// xero-sync: fetches Xero Purchase Orders and upserts them into incoming_stock.
// Called from the app when the user clicks "Sync from Xero".

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Refresh an expired Xero access token
async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; refresh_token: string; expires_at: string } | null> {
  const res = await fetch("https://identity.xero.com/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) return null;
  const t = await res.json();
  return {
    access_token:  t.access_token,
    refresh_token: t.refresh_token,
    expires_at:    new Date(Date.now() + t.expires_in * 1000).toISOString(),
  };
}

// Map a Xero PO status to our app status
function mapStatus(xeroStatus: string): string {
  if (xeroStatus === "BILLED" || xeroStatus === "RECEIPTED") return "Received";
  return "Pending";
}

// Map Xero LineItem to our item shape
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Load stored Xero tokens
  const { data: tokenRow, error: tokenErr } = await supabase
    .from("xero_tokens")
    .select("*")
    .eq("id", "singleton")
    .single();

  if (tokenErr || !tokenRow) {
    return new Response(
      JSON.stringify({ error: "Xero not connected. Please connect Xero first." }),
      { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  const clientId     = Deno.env.get("XERO_CLIENT_ID")!;
  const clientSecret = Deno.env.get("XERO_CLIENT_SECRET")!;

  // Refresh token if expired (with 60s buffer)
  let accessToken = tokenRow.access_token;
  if (new Date(tokenRow.expires_at).getTime() < Date.now() + 60_000) {
    const refreshed = await refreshAccessToken(tokenRow.refresh_token, clientId, clientSecret);
    if (!refreshed) {
      return new Response(
        JSON.stringify({ error: "Xero session expired. Please reconnect Xero." }),
        { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }
    accessToken = refreshed.access_token;
    await supabase.from("xero_tokens").update({
      access_token:  refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at:    refreshed.expires_at,
    }).eq("id", "singleton");
  }

  // Fetch Purchase Orders from Xero (AUTHORISED, SUBMITTED, BILLED)
  const poRes = await fetch(
    "https://api.xero.com/api.xro/2.0/PurchaseOrders?Status=AUTHORISED&Status=SUBMITTED&Status=BILLED",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Xero-Tenant-Id": tokenRow.tenant_id,
        Accept: "application/json",
      },
    }
  );

  if (!poRes.ok) {
    const msg = await poRes.text();
    return new Response(
      JSON.stringify({ error: `Xero API error: ${msg}` }),
      { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  const { PurchaseOrders: pos = [] } = await poRes.json();

  // Map Xero POs → incoming_stock rows
  const rows = (pos as Record<string, unknown>[]).map((po) => {
    const lineItems = (po.LineItems as Record<string, unknown>[]) ?? [];
    return {
      // Use Xero PurchaseOrderID as stable ID so re-syncing won't duplicate
      id:               po.PurchaseOrderID as string,
      supplier:         (po.Contact as Record<string, unknown>)?.Name as string ?? "",
      po:               (po.PurchaseOrderNumber as string) || "",
      reference:        (po.Reference as string) || "",
      dateRaised:       ((po.DateString as string) || "").slice(0, 10),
      expectedDelivery: ((po.DeliveryDateString as string) || "").slice(0, 10),
      status:           mapStatus(po.Status as string),
      notes:            "",
      items:            JSON.stringify(lineItems.map(mapItem)),
    };
  });

  if (rows.length === 0) {
    return new Response(
      JSON.stringify({ synced: 0, message: "No Purchase Orders found in Xero." }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  // Upsert into incoming_stock (merge by id = Xero PurchaseOrderID)
  const { error: upsertErr } = await supabase
    .from("incoming_stock")
    .upsert(rows, { onConflict: "id" });

  if (upsertErr) {
    return new Response(
      JSON.stringify({ error: `DB upsert error: ${upsertErr.message}` }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ synced: rows.length, message: `Synced ${rows.length} purchase order${rows.length !== 1 ? "s" : ""} from Xero.` }),
    { headers: { ...CORS, "Content-Type": "application/json" } }
  );
});
