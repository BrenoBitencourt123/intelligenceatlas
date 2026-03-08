export const STRIPE_PLANS = {
  free: {
    product_id: null,
    price_id: null,
    name: 'Free',
    price: 0,
    limit: 1, // 1 redação total
  },
  pro: {
    product_id: 'prod_TudN04n9u6Wdvf',
    price_id: 'price_1Swo6ILCrHbXOvxe2DGBWebl',
    name: 'Pro',
    price: 49.90,
    limit: 60, // 60/mês (2/dia)
  },
} as const;

export type PlanType = keyof typeof STRIPE_PLANS;

// Coupon IDs created in Stripe for progressive discounts
export const DISCOUNT_COUPONS = {
  3: { id: 'oNt0SsEC', percent: 5, label: '3 meses' },
  6: { id: 'lFe8ZWYd', percent: 10, label: '6 meses' },
  12: { id: 'HZWYfKsO', percent: 20, label: '12 meses' },
} as const;

// Founding Members coupon: 50% forever, max 20 redemptions
export const FOUNDERS_COUPON = {
  id: 'oPJ7c2xK',
  percent: 50,
  label: 'Membro Fundador - 50%',
  maxRedemptions: 20,
} as const;

// Calculate months until next ENEM (November)
export function getMonthsUntilEnem(): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const enemMonth = 10; // November (0-indexed)
  const enemDay = 15;

  let enemDate = new Date(currentYear, enemMonth, enemDay);
  if (now > enemDate) {
    enemDate = new Date(currentYear + 1, enemMonth, enemDay);
  }

  const diffMs = enemDate.getTime() - now.getTime();
  const months = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30));
  return Math.max(1, months);
}

// Get the best discount tier for a given number of months
export function getDiscountTier(months: number): (typeof DISCOUNT_COUPONS)[keyof typeof DISCOUNT_COUPONS] | null {
  if (months >= 12) return DISCOUNT_COUPONS[12];
  if (months >= 6) return DISCOUNT_COUPONS[6];
  if (months >= 3) return DISCOUNT_COUPONS[3];
  return null;
}
