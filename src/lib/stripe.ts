export const STRIPE_PLANS = {
  basic: {
    product_id: 'prod_TuYV8OLHKPqp3Y',
    price_id: 'price_1SwjOrLbqFmREm0fqfXpdc8L',
    name: 'Básico',
    price: 29.90,
    limit: 30,
  },
  pro: {
    product_id: 'prod_TuYWj1Y0ffKgoX',
    price_id: 'price_1SwjPWLbqFmREm0fpy8ef02R',
    name: 'Pro',
    price: 49.90,
    limit: 999,
  },
} as const;

export type PlanType = keyof typeof STRIPE_PLANS;
