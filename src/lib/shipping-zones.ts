// Costo de envío por zona — tabla propia mientras no está conectada la
// cotización automática de Correo Argentino (necesita cuenta/CPI comercial
// dado de alta). Todas las zonas arrancan en el mismo valor; se van a ir
// ajustando a mano con una simulación real en Correo Argentino.
export type ShippingZone = "amba" | "centro" | "norte-cuyo" | "patagonia";

export const PROVINCES = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export type Province = (typeof PROVINCES)[number];

const PROVINCE_ZONE: Record<Province, ShippingZone> = {
  "Buenos Aires": "amba",
  "Ciudad Autónoma de Buenos Aires": "amba",
  Córdoba: "centro",
  "Santa Fe": "centro",
  "Entre Ríos": "centro",
  "La Pampa": "centro",
  Catamarca: "norte-cuyo",
  Chaco: "norte-cuyo",
  Corrientes: "norte-cuyo",
  Formosa: "norte-cuyo",
  Jujuy: "norte-cuyo",
  "La Rioja": "norte-cuyo",
  Mendoza: "norte-cuyo",
  Misiones: "norte-cuyo",
  Salta: "norte-cuyo",
  "San Juan": "norte-cuyo",
  "San Luis": "norte-cuyo",
  "Santiago del Estero": "norte-cuyo",
  Tucumán: "norte-cuyo",
  Chubut: "patagonia",
  Neuquén: "patagonia",
  "Río Negro": "patagonia",
  "Santa Cruz": "patagonia",
  "Tierra del Fuego": "patagonia",
};

// TODO: reemplazar por los valores reales de una simulación en Correo
// Argentino — arrancan todas iguales a pedido, se van a ir completando.
const ZONE_COST: Record<ShippingZone, number> = {
  amba: 11000,
  centro: 11000,
  "norte-cuyo": 11000,
  patagonia: 11000,
};

// Nunca se confía en un costo mandado por el cliente — el checkout siempre
// recalcula esto en el servidor a partir de la provincia.
export function getShippingCostForProvince(province: string): number {
  const zone = PROVINCE_ZONE[province as Province];
  return zone ? ZONE_COST[zone] : ZONE_COST.amba;
}
