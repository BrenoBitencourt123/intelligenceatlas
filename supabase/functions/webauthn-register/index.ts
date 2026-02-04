import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "https://esm.sh/@simplewebauthn/server@8.3.7";
import { encode as base64Encode, decode as base64Decode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RP_NAME = "Atlas - Redação ENEM";
const RP_ID = Deno.env.get("RP_ID") || "lovable.app";
const ORIGIN = Deno.env.get("ORIGIN") || `https://${RP_ID}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    const { action, credential, device_name } = await req.json();

    if (action === "start") {
      // Get existing credentials for this user
      const { data: existingCreds } = await supabase
        .from("passkey_credentials")
        .select("credential_id")
        .eq("user_id", userId);

      const excludeCredentials = (existingCreds || []).map((cred: { credential_id: string }) => ({
        id: base64Decode(cred.credential_id),
        type: "public-key" as const,
        transports: ["internal" as const],
      }));

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: userId,
        userName: userEmail,
        userDisplayName: userEmail.split("@")[0],
        attestationType: "none",
        excludeCredentials,
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
          authenticatorAttachment: "platform",
        },
      });

      return new Response(JSON.stringify({ options, challenge: options.challenge }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      const { response, expectedChallenge } = credential;

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: [ORIGIN, "https://intelligenceatlas.lovable.app", "https://id-preview--e42fa3ef-261f-455a-bf1a-6b0848d29830.lovable.app"],
        expectedRPID: [RP_ID, "intelligenceatlas.lovable.app", "id-preview--e42fa3ef-261f-455a-bf1a-6b0848d29830.lovable.app"],
      });

      if (!verification.verified || !verification.registrationInfo) {
        return new Response(JSON.stringify({ error: "Verification failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

      // Use service role to insert credential
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Convert Uint8Array to base64
      const credentialIdBase64 = base64Encode(credentialID);
      const publicKeyBase64 = base64Encode(credentialPublicKey);

      const { error: insertError } = await supabaseAdmin
        .from("passkey_credentials")
        .insert({
          user_id: userId,
          credential_id: credentialIdBase64,
          public_key: publicKeyBase64,
          counter: counter,
          device_name: device_name || "Dispositivo",
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to save credential" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("WebAuthn register error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
