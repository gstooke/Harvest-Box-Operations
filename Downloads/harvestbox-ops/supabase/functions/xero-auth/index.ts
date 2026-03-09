// xero-auth: redirects the browser to Xero's OAuth consent screen.
// Called by the app as a plain link/redirect with ?return_url=<app origin>

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const clientId = Deno.env.get("XERO_CLIENT_ID");
  if (!clientId) {
    return new Response(JSON.stringify({ error: "XERO_CLIENT_ID not configured" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(req.url);
  const returnUrl = searchParams.get("return_url") || "https://harvestbox-ops.vercel.app";
  const redirectUri = Deno.env.get("XERO_REDIRECT_URI")!;

  // Encode return_url in state so the callback knows where to send the user back
  const state = btoa(JSON.stringify({ returnUrl, nonce: crypto.randomUUID() }));

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email accounting.transactions.read accounting.contacts.read offline_access",
    state,
  });

  return Response.redirect(
    `https://login.xero.com/identity/connect/authorize?${params}`,
    302
  );
});
