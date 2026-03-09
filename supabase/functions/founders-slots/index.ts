import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COUPON_ID = "FUNDADOR";
const MAX_REDEMPTIONS = 20;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const coupon = await stripe.coupons.retrieve(COUPON_ID);
    const timesRedeemed = coupon.times_redeemed ?? 0;
    const remaining = Math.max(0, MAX_REDEMPTIONS - timesRedeemed);

    return new Response(
      JSON.stringify({ remaining, total: MAX_REDEMPTIONS, redeemed: timesRedeemed }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[FOUNDERS-SLOTS] Error:", message);
    return new Response(
      JSON.stringify({ remaining: null, error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
