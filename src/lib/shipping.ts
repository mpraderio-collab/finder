// El costo ya no es fijo acá — se calcula por zona según la provincia, ver
// getShippingCostForProvince en shipping-zones.ts.
export const shippingMethods = {
  correo: {
    label: "Correo Argentino",
    detail: "3 a 5 días hábiles",
  },
} as const;

export type ShippingMethod = keyof typeof shippingMethods;
