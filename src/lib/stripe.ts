export const STRIPE_PLANS = {
  free: {
    product_id: null,
    price_id: null,
    name: 'Free',
    price: 0,
    limit: 1, // 1 redação total
  },
  basic: {
    product_id: 'prod_TuYV8OLHKPqp3Y',
    price_id: 'price_1SwjOrLbqFmREm0fqfXpdc8L',
    name: 'Básico',
    price: 29.90,
    limit: 30, // 30/mês (1/dia)
  },
  pro: {
    product_id: 'prod_TuYWj1Y0ffKgoX',
    price_id: 'price_1SwjPWLbqFmREm0fpy8ef02R',
    name: 'Pro',
    price: 49.90,
    limit: 60, // 60/mês (2/dia)
  },
} as const;

export type PlanType = keyof typeof STRIPE_PLANS;
