import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Sem header de autenticação");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr) throw new Error(userErr.message);
    const user = userData.user;
    if (!user) throw new Error("Usuário não autenticado");

    const body = await req.json().catch(() => ({}));
    const sessionId = body?.session_id as string | undefined;
    if (!sessionId || !sessionId.startsWith("cs_")) throw new Error("session_id inválido");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ creditado: false, status: session.payment_status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const meta = session.metadata ?? {};
    if (meta.user_id !== user.id) {
      throw new Error("Sessão não pertence a este usuário");
    }
    const qtd = Number(meta.qtd || "0");
    if (!qtd || qtd < 1) throw new Error("Metadata de quantidade inválido");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Idempotência: unique index em stripe_session_id garante uma linha só por sessão.
    const { error: insertErr } = await admin.from("ufu_creditos").insert({
      user_id: user.id,
      qtd,
      motivo: `stripe_${meta.plano ?? "avulsa"}`,
      stripe_session_id: sessionId,
    });

    if (insertErr && (insertErr as { code?: string }).code !== "23505") {
      throw new Error(insertErr.message);
    }

    return new Response(JSON.stringify({ creditado: true, qtd }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[verify-checkout-ufu]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
