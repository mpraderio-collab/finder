export const shippingMethods = {
  correo: {
    label: "Correo Argentino",
    detail: "3 a 5 días hábiles · Gratis",
    cost: 0,
  },
  oca: {
    label: "OCA a domicilio",
    detail: "2 a 3 días hábiles · $ 4.900",
    cost: 4900,
  },
} as const;

export type ShippingMethod = keyof typeof shippingMethods;
