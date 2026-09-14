import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(120),
  email: z.string().trim().email("El email no es válido"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Contanos un poco más").max(2000),
  // Campo señuelo: invisible para personas, si viene lleno es un bot.
  website: z.string().max(0).optional().or(z.literal("")),
});

export const stockNotifySchema = z.object({
  productId: z.string().min(1),
  email: z.string().trim().email("El email no es válido"),
});

export const newsletterSchema = z.object({
  email: z.string().trim().email("El email no es válido"),
});

export const trackEventSchema = z.object({
  type: z.enum(["page_view", "view_content", "add_to_cart", "initiate_checkout"]),
  sessionId: z.string().trim().min(1).max(100),
  path: z.string().trim().max(300).optional(),
  productId: z.string().trim().max(100).optional(),
  productName: z.string().trim().max(200).optional(),
  value: z.coerce.number().int().optional(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Usá minúsculas, números y guiones")
    .max(120),
  tagline: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(4000),
  price: z.coerce
    .number({ message: "El precio tiene que ser un número" })
    .int("El precio no puede tener centavos")
    .positive("El precio tiene que ser mayor a cero")
    .max(100_000_000, "Precio demasiado alto"),
  costPrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ message: "El costo tiene que ser un número" })
      .int("El costo no puede tener centavos")
      .min(0, "El costo no puede ser negativo")
      .max(100_000_000, "Costo demasiado alto")
      .optional(),
  ),
  stock: z.coerce
    .number({ message: "El stock tiene que ser un número" })
    .int("El stock tiene que ser un entero")
    .min(0, "El stock no puede ser negativo")
    .max(1_000_000),
  status: z.enum(["active", "archived"]),
  promoQuantity: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ message: "Ingresá un número entero" })
      .int("Tiene que ser un número entero")
      .min(2, "La promo necesita al menos 2 unidades")
      .optional(),
  ),
  promoPrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ message: "El precio de la promo tiene que ser un número" })
      .int("El precio no puede tener centavos")
      .positive("El precio de la promo tiene que ser mayor a cero")
      .optional(),
  ),
})
  .refine((data) => Boolean(data.promoQuantity) === Boolean(data.promoPrice), {
    message: "Completá la cantidad y el precio de la promo, o dejá los dos vacíos",
    path: ["promoPrice"],
  })
  .refine(
    (data) =>
      !data.promoQuantity ||
      !data.promoPrice ||
      data.promoPrice < data.price * data.promoQuantity,
    {
      message: "El precio de la promo tiene que ser menor al precio normal multiplicado por la cantidad",
      path: ["promoPrice"],
    },
  );

export type ProductFormValues = z.infer<typeof productSchema>;

// Una característica por línea de texto; se descartan líneas vacías. El
// textarea completo llega como un solo string desde el form.
export const featuresTextSchema = z
  .string()
  .max(4000)
  .optional()
  .or(z.literal(""))
  .transform((v) =>
    (v ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 20),
  );

export const siteSettingsSchema = z.object({
  installments: z.coerce
    .number({ message: "Ingresá un número de cuotas" })
    .int("Tiene que ser un número entero")
    .min(1, "Tiene que ser al menos 1 cuota")
    .max(24, "Máximo 24 cuotas"),
});

export const orderStatuses = [
  "pending",
  "paid",
  "shipped",
  "cancelled",
  "failed",
] as const;

export const orderStatusSchema = z.enum(orderStatuses);

export const checkoutSchema = z.object({
  sessionId: z.string().trim().max(100).optional(),
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email(),
  customerPhone: z.string().trim().min(6).max(30),
  shippingAddress: z.string().trim().min(4).max(200),
  shippingCity: z.string().trim().min(2).max(100),
  shippingProvince: z.string().trim().min(2).max(100),
  shippingZip: z.string().trim().min(3).max(15),
  shippingMethod: z.enum(["correo"]).default("correo"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(50),
        variantName: z.string().optional(),
      }),
    )
    .min(1, "El carrito está vacío"),
});

export const manualSaleSchema = z.object({
  customerName: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? "Venta manual" : val),
    z.string().trim().min(1).max(120),
  ),
  customerPhone: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().trim().max(30).optional(),
  ),
  note: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().trim().max(500).optional(),
  ),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(1000),
        variantName: z.string().optional(),
        unitPrice: z.coerce
          .number()
          .int("El precio no puede tener centavos")
          .min(0, "El precio no puede ser negativo"),
      }),
    )
    .min(1, "Agregá al menos un producto"),
});

const purchaseItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().trim().min(2, "El nombre es muy corto").max(160),
  quantity: z.coerce
    .number({ message: "La cantidad tiene que ser un número" })
    .int("La cantidad tiene que ser un entero")
    .positive("La cantidad tiene que ser mayor a cero"),
  unitPriceUsd: z.coerce
    .number({ message: "El precio unitario tiene que ser un número" })
    .positive("El precio unitario tiene que ser mayor a cero"),
  exchangeRate: z.coerce
    .number({ message: "La cotización tiene que ser un número" })
    .positive("La cotización tiene que ser mayor a cero"),
  taxesPesos: z.coerce.number().min(0).optional(),
  shippingCostUsd: z.coerce.number().min(0).optional(),
  suggestedPrice: z.coerce.number().int().positive().optional(),
});

export const purchaseSchema = z.object({
  supplierName: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().trim().min(1).max(160).optional(),
  ),
  // El <input type="date"> manda "yyyy-mm-dd" sin hora — parsearlo tal
  // cual con z.coerce.date() lo toma como medianoche UTC, que en Argentina
  // (GMT-3) cae el día anterior. Se ancla al mediodía UTC para que el día
  // calendario coincida sin importar la zona horaria de quien lo mira.
  purchaseDate: z.preprocess((val) => {
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return `${val}T12:00:00Z`;
    }
    return val;
  }, z.coerce.date({ message: "Ingresá una fecha válida" })),
  items: z.array(purchaseItemSchema).min(1, "Agregá al menos un producto"),
});

export const shipmentSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1, "Elegí al menos un pedido"),
  shippingMethod: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().trim().max(60).optional(),
  ),
  trackingCode: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().trim().max(60).optional(),
  ),
  note: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().trim().max(500).optional(),
  ),
});
