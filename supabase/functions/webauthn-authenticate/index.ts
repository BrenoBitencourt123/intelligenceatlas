import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "https://esm.sh/@simplewebauthn/server@8.3.7";
import { decode as base64Decode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RP_ID = Deno.env.get("RP_ID") || "lovable.app";
const ORIGIN = Deno.env.get("ORIGIN") || `https://${RP_ID}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, credential, email, expectedChallenge } = await req.json();

    if (action === "start") {
      // Get user's credentials if email provided
      let allowCredentials: { id: Uint8Array; type: "public-key"; transports?: ("internal")[] }[] = [];

      if (email) {
        // Find user by email
        const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
        const user = userData?.users?.find((u) => u.email === email);

        if (user) {
          const { data: creds } = await supabaseAdmin
            .from("passkey_credentials")
            .select("credential_id")
            .eq("user_id", user.id);

          allowCredentials = (creds || []).map((c: { credential_id: string }) => ({
            id: base64Decode(c.credential_id),
            type: "public-key" as const,
            transports: ["internal" as const],
          }));
        }
      }

      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        userVerification: "preferred",
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
      });

      return new Response(
        JSON.stringify({ options, challenge: options.challenge }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      const { response, rawId } = credential;

      // Find the credential in database
      const credentialIdBase64 = rawId;
      const { data: storedCred, error: findError } = await supabaseAdmin
        .from("passkey_credentials")
        .select("*")
        .eq("credential_id", credentialIdBase64)
        .single();

      if (findError || !storedCred) {
        return new Response(
          JSON.stringify({ error: "Credential not found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Decode stored public key
      const publicKeyBytes = base64Decode(storedCred.public_key);
      const credIdBytes = base64Decode(storedCred.credential_id);

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: [ORIGIN, "https://intelligenceatlas.lovable.app", "https://id-preview--e42fa3ef-261f-455a-bf1a-6b0848d29830.lovable.app"],
        expectedRPID: [RP_ID, "intelligenceatlas.lovable.app", "id-preview--e42fa3ef-261f-455a-bf1a-6b0848d29830.lovable.app"],
        authenticator: {
          credentialID: credIdBytes,
          credentialPublicKey: publicKeyBytes,
          counter: storedCred.counter,
        },
      });

      if (!verification.verified) {
        return new Response(
          JSON.stringify({ error: "Authentication failed" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update counter
      await supabaseAdmin
        .from("passkey_credentials")
        .update({ counter: verification.authenticationInfo.newCounter })
        .eq("id", storedCred.id);

      // Create a session for the user using admin API
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: (await supabaseAdmin.auth.admin.getUserById(storedCred.user_id)).data.user?.email || "",
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        return new Response(
          JSON.stringify({ error: "Failed to create session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract the token from the link
      const tokenHash = signInData.properties?.hashed_token;

      return new Response(
        JSON.stringify({ 
          success: true, 
          token_hash: tokenHash,
          user_id: storedCred.user_id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("WebAuthn auth error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
