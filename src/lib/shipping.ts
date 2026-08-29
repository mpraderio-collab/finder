export const shippingMethods = {
  correo: {
    label: "Correo Argentino",
    detail: "3 a 5 días hábiles · Gratis",
    cost: 0,
  },
} as const;

export type ShippingMethod = keyof typeof shippingMethods;
