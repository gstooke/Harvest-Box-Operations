// invoice-webhook: receives Xero Invoice data pushed by Zapier and upserts into orders.
// Deploy with --no-verify-jwt so Zapier can POST without a Supabase JWT.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function mapStatus(xeroStatus: string): string {
  if (xeroStatus === "PAID") return "Collected";
  return "Open";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Verify shared secret
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  const { searchParams } = new URL(req.url);
  if (webhookSecret && searchParams.get("secret") !== webhookSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }), {
      status: 405, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const rawText = await req.text();
  let body: unknown;

  // Try JSON first, then form-encoded
  try {
    body = JSON.parse(rawText);
  } catch {
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

  // Debug mode — returns raw payload so you can inspect what Zapier sends
  if (searchParams.get("debug") === "1") {
    const inv = (Array.isArray(body) ? body[0] : body) as Record<string, unknown>;
    return new Response(JSON.stringify({
      allKeys: Object.keys(inv || {}),
      InvoiceID: inv?.InvoiceID,
      InvoiceNumber: inv?.InvoiceNumber,
      ContactName: inv?.ContactName,
      Contact: inv?.Contact,
      DateString: inv?.DateString,
      DueDateString: inv?.DueDateString,
      Status: inv?.Status,
      code: inv?.code, Code: inv?.Code, ItemCode: inv?.ItemCode,
      description: inv?.description,
      quantity: inv?.quantity, Quantity: inv?.Quantity,
      LineItems: inv?.LineItems,
      rawSnippet: rawText.slice(0, 800),
    }, null, 2), { headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const invoices: Record<string, unknown>[] = Array.isArray(body) ? body : [body as Record<string, unknown>];
  let synced = 0;
  const errors: string[] = [];

  for (const inv of invoices) {
    // Contact name
    const contact = inv.Contact as Record<string, unknown> | undefined;
    const customer =
      (contact?.Name as string) ||
      (inv.ContactName as string) ||
      "";

    // Line items — handle JSON array, JSON string, or flat Zapier fields
    const toArr = (v: unknown): unknown[] => {
      if (Array.isArray(v)) return v;
      if (typeof v === "string" && v.includes(",")) return v.split(",").map(s => s.trim());
      return v !== undefined && v !== "" ? [v] : [];
    };

    let items: Record<string, unknown>[] = [];

    if (Array.isArray(inv.LineItems)) {
      items = (inv.LineItems as Record<string, unknown>[]).map((li, i) => ({
        id: i + 1,
        productId: (li.ItemCode as string) || "",
        description: (li.Description as string) || "",
        batch: "",
        qty: Number(li.Quantity) || 0,
      }));
    } else if (typeof inv.LineItems === "string") {
      try {
        const parsed = JSON.parse(inv.LineItems) as Record<string, unknown>[];
        items = parsed.map((li, i) => ({
          id: i + 1,
          productId: (li.ItemCode as string) || "",
          description: (li.Description as string) || "",
          batch: "",
          qty: Number(li.Quantity) || 0,
        }));
      } catch { items = []; }
    } else {
      // Flat Zapier fields — quantities are unambiguous numbers and only present for real
      // line items. Use quantities.length as the authoritative item count. Any remaining
      // description fragments (delivery notes, addresses, etc.) are merged into one extra
      // blank item so the information is preserved.
      const codes      = toArr(inv.code      ?? inv.Code      ?? inv.ItemCode);
      const quantities = toArr(inv.quantity  ?? inv.Quantity  ?? inv.qty     ?? inv.Qty);
      const rawDescs   = toArr(inv.description ?? inv.Description) as string[];
      const itemCount  = quantities.length > 0 ? quantities.length : codes.length;
      items = Array.from({ length: itemCount }, (_, i) => ({
        id: i + 1,
        productId: (codes[i] as string) || "",
        description: (rawDescs[i] as string) || "",
        batch: "",
        qty: Number(quantities[i]) || 0,
      }));
      // Append any leftover description fragments as a single notes item
      if (rawDescs.length > itemCount) {
        const notes = rawDescs.slice(itemCount).join(", ").trim();
        if (notes) {
          items.push({ id: itemCount + 1, productId: "", description: notes, batch: "", qty: 0 });
        }
      }
    }

    // Auto-register unknown product codes into stockcodes table
    const uniqueCodes = [...new Set(items.map(it => it.productId as string).filter(Boolean))];
    if (uniqueCodes.length > 0) {
      const { data: existingCodes } = await supabase
        .from("stockcodes")
        .select("code")
        .in("code", uniqueCodes);
      const existingSet = new Set((existingCodes || []).map((r: { code: string }) => r.code));
      const toInsert = items
        .filter(it => it.productId && !existingSet.has(it.productId as string))
        .filter((it, idx, arr) => arr.findIndex(x => x.productId === it.productId) === idx)
        .map((it, i) => ({
          id: Date.now() + i,
          code: it.productId as string,
          description: (it.description as string) || "",
          type: "Generated",
        }));
      if (toInsert.length > 0) {
        await supabase.from("stockcodes").insert(toInsert);
      }
    }

    const xeroId = (inv.InvoiceID as string) || "";
    const fields = {
      xero_id:       xeroId || null,
      invoicenumber: (inv.InvoiceNumber as string) || (inv.invoicenumber as string) || "",
      customer,
      reference:     (inv.Reference as string) || (inv.reference as string) || "",
      date:          ((inv.DateString as string) || (inv.date as string) || "").slice(0, 10),
      duedate:       ((inv.DueDateString as string) || (inv.duedate as string) || "").slice(0, 10),
      status:        mapStatus((inv.Status as string) || (inv.status as string) || ""),
      notes:         (inv.notes as string) || (inv.Notes as string) || "",
      items:         JSON.stringify(items),
    };

    // Try to find existing row by xero_id
    if (xeroId) {
      const { data: existing, error: lookupErr } = await supabase
        .from("orders")
        .select("id")
        .eq("xero_id", xeroId)
        .maybeSingle();

      if (lookupErr) {
        errors.push(`Lookup error: ${lookupErr.message}`);
      } else if (existing) {
        const { error: updateErr } = await supabase.from("orders").update(fields).eq("id", existing.id);
        if (updateErr) {
          errors.push(`Update error: ${updateErr.message}`);
        } else {
          synced++;
        }
        continue;
      }
    }

    const { error: insertErr } = await supabase
      .from("orders")
      .insert({ ...fields, id: Date.now() + synced });

    if (insertErr) {
      errors.push(`Insert error: ${insertErr.message}`);
    } else {
      synced++;
    }
  }

  return new Response(
    JSON.stringify({
      synced,
      message: `Upserted ${synced} invoice${synced !== 1 ? "s" : ""}.`,
      ...(errors.length > 0 ? { errors } : {}),
    }),
    { headers: { ...CORS, "Content-Type": "application/json" } }
  );
});
