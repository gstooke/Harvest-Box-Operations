// xero-webhook: receives PO data pushed by Zapier and upserts into incoming_stock.
// Deploy with --no-verify-jwt so Zapier can POST without a Supabase JWT.
// Protect with a shared secret passed as ?secret=<WEBHOOK_SECRET> in the Zapier URL.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function upsertRawDefs(supabase: ReturnType<typeof createClient>, lineItems: Record<string, unknown>[]) {
  for (const li of lineItems) {
    const rawId = ((li.ItemCode as string) || "").trim();
    if (!rawId) continue;
    const { data: existing } = await supabase
      .from("raw_defs")
      .select("id")
      .eq("raw_id", rawId)
      .maybeSingle();
    if (!existing) {
      await supabase.from("raw_defs").insert({
        id: Date.now() + Math.floor(Math.random() * 1000),
        raw_id: rawId,
        description: (li.Description as string) || "",
        available: true,
        raw_type: "Food",
      });
    }
  }
}

function mapStatus(xeroStatus: string): string {
  if (xeroStatus === "BILLED" || xeroStatus === "RECEIPTED") return "Processed";
  return "Pending";
}

function mapItem(li: Record<string, unknown>, idx: number) {
  return {
    id:          idx + 1,
    code:        (li.ItemCode as string) || "",
    description: (li.Description as string) || "",
    qty:         Number(li.Quantity) || 0,
    cost:        Number(li.UnitAmount) || 0,
    receivedQty: 0,
    usedQty:     0,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Verify shared secret
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  if (webhookSecret) {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("secret") !== webhookSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }), {
      status: 405, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  const rawText = await req.text();
  try {
    body = JSON.parse(rawText);
  } catch {
    // Zapier may send as form-encoded — use getAll() so repeated keys become arrays
    try {
      const params = new URLSearchParams(rawText);
      const obj: Record<string, unknown> = {};
      for (const key of [...new Set(params.keys())]) {
        const vals = params.getAll(key);
        obj[key] = vals.length > 1 ? vals : vals[0];
      }
      body = Object.keys(obj).length > 0 ? obj : null;
    } catch {
      body = null;
    }
    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid body", raw: rawText.slice(0, 200) }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
  }

  // Debug mode: return the raw body so you can inspect what Zapier is sending
  const { searchParams } = new URL(req.url);
  if (searchParams.get("debug") === "1") {
    const po = (Array.isArray(body) ? body[0] : body) as Record<string, unknown>;
    return new Response(JSON.stringify({
      allKeys: Object.keys(po || {}),
      code: po?.code, Code: po?.Code, ItemCode: po?.ItemCode,
      description: po?.description,
      quantity: po?.quantity, Quantity: po?.Quantity, qty: po?.qty,
      unitamount: po?.unitamount, UnitAmount: po?.UnitAmount, price: po?.price,
      LineItems: po?.LineItems,
      rawSnippet: rawText.slice(0, 800),
    }, null, 2), { headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const pos: Record<string, unknown>[] = Array.isArray(body) ? body : [body as Record<string, unknown>];
  let synced = 0;

  for (const po of pos) {
    const contact = po.Contact as Record<string, unknown> | undefined;
    const supplierName =
      (contact?.Name as string) ||
      (po.ContactName as string) ||
      (po.Supplier as string) ||
      "";

    // LineItems: handle three formats Zapier may send:
    // 1. A JSON array (direct API)
    // 2. A JSON string
    // 3. Flat array fields: code[], description[], quantity[], unitamount[]
    let lineItems: Record<string, unknown>[] = [];
    if (Array.isArray(po.LineItems)) {
      lineItems = po.LineItems as Record<string, unknown>[];
    } else if (typeof po.LineItems === "string") {
      try { lineItems = JSON.parse(po.LineItems); } catch { lineItems = []; }
    } else {
      // Zapier may send repeated keys (already arrays) or comma-joined strings.
      // Numeric/code fields are safe to split on comma; description fields are NOT
      // (descriptions naturally contain commas e.g. "Almonds, Roasted").
      const toArr = (v: unknown): unknown[] => {
        if (Array.isArray(v)) return v;
        if (typeof v === "string" && v.includes(",")) return v.split(",").map(s => s.trim());
        return v !== undefined && v !== "" ? [v] : [];
      };
      // Descriptions must never be comma-split — accept repeated fields or single string as-is.
      const toArrStr = (v: unknown): unknown[] => {
        if (Array.isArray(v)) return v;
        return v !== undefined && v !== "" ? [v as string] : [];
      };
      const codes       = toArr(po.code       ?? po.Code       ?? po.ItemCode);
      const quantities  = toArr(po.quantity   ?? po.Quantity   ?? po.qty      ?? po.Qty);
      const unitAmounts = toArr(po.unitamount ?? po.UnitAmount ?? po.unitAmount ?? po.price ?? po.Price);
      // Descriptions and quantities are the most reliably present fields (even for
      // code-less items). Use their length as the authoritative item count so that
      // a missing code for one line item doesn't shift all subsequent descriptions.
      const descs = toArrStr(po.description ?? po.Description);
      const itemCount = Math.max(descs.length, quantities.length, codes.length);
      if (itemCount > 0) {
        lineItems = Array.from({ length: itemCount }, (_, i) => ({
          ItemCode:    (codes[i] as string)       ?? "",
          Description: (descs[i] as string)       ?? "",
          Quantity:    quantities[i]              ?? 0,
          UnitAmount:  unitAmounts[i]             ?? 0,
        }));
      }
    }

    const xeroId = (po.PurchaseOrderID as string) || "";
    const fields = {
      xero_id:          xeroId || null,
      supplier:         supplierName,
      po:               (po.PurchaseOrderNumber as string) || (po.po as string) || "",
      reference:        (po.Reference as string) || (po.reference as string) || "",
      dateraised:       ((po.DateString as string) || (po.dateRaised as string) || (po.dateraised as string) || "").slice(0, 10),
      expecteddelivery: ((po.DeliveryDateString as string) || (po.expectedDelivery as string) || (po.expecteddelivery as string) || "").slice(0, 10),
      status:           mapStatus((po.Status as string) || (po.status as string) || ""),
      notes:            (po.notes as string) || "",
      items:            JSON.stringify(lineItems.map(mapItem)),
    };

    if (xeroId) {
      const { data: existing } = await supabase
        .from("incoming_stock")
        .select("id, status")
        .eq("xero_id", xeroId)
        .maybeSingle();

      if (existing) {
        // Never overwrite a Processed status from Zapier re-sync
        const updateFields = existing.status === "Processed"
          ? { ...fields, status: "Processed" }
          : fields;
        const { error } = await supabase.from("incoming_stock").update(updateFields).eq("id", existing.id);
        if (error) {
          return new Response(JSON.stringify({ error: `DB update error: ${error.message}` }), {
            status: 500, headers: { ...CORS, "Content-Type": "application/json" },
          });
        }
        synced++;
        await upsertRawDefs(supabase, lineItems);
        continue;
      }
    }

    const { error } = await supabase.from("incoming_stock").insert({ ...fields, id: Date.now() + synced });
    if (error) {
      return new Response(JSON.stringify({ error: `DB insert error: ${error.message}` }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    synced++;

    // Auto-register any new raw IDs into raw_defs
    await upsertRawDefs(supabase, lineItems);
  }

  return new Response(
    JSON.stringify({ synced, message: `Upserted ${synced} purchase order${synced !== 1 ? "s" : ""}.` }),
    { headers: { ...CORS, "Content-Type": "application/json" } }
  );
});
