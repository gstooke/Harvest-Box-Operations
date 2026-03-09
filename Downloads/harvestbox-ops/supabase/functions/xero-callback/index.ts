// xero-callback: exchanges the OAuth code for tokens, stores them,
// then redirects the user back to the app with ?xero_connected=true

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Decode return URL from state
  let returnUrl = "https://harvestbox-ops.vercel.app";
  try {
    const decoded = JSON.parse(atob(state ?? ""));
    if (decoded.returnUrl) returnUrl = decoded.returnUrl;
  } catch { /* use default */ }

  if (error || !code) {
    return Response.redirect(`${returnUrl}?xero_error=${encodeURIComponent(error ?? "no_code")}`, 302);
  }

  const clientId     = Deno.env.get("XERO_CLIENT_ID")!;
  const clientSecret = Deno.env.get("XERO_CLIENT_SECRET")!;
  const redirectUri  = Deno.env.get("XERO_REDIRECT_URI")!;

  // Exchange code for tokens
  const tokenRes = await fetch("https://identity.xero.com/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const msg = await tokenRes.text();
    return Response.redirect(`${returnUrl}?xero_error=${encodeURIComponent(msg)}`, 302);
  }

  const tokens = await tokenRes.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Get Xero tenant (organisation) list
  const connRes = await fetch("https://api.xero.com/connections", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const connections = connRes.ok ? await connRes.json() : [];
  const tenant = connections[0] ?? {};

  // Store tokens in Supabase
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error: dbErr } = await supabase.from("xero_tokens").upsert({
    id: "singleton", // single-tenant: only one Xero connection
    tenant_id:     tenant.tenantId   ?? "",
    tenant_name:   tenant.tenantName ?? "",
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at:    expiresAt,
  });

  if (dbErr) {
    return Response.redirect(`${returnUrl}?xero_error=${encodeURIComponent(dbErr.message)}`, 302);
  }

  return Response.redirect(`${returnUrl}?xero_connected=true`, 302);
});
