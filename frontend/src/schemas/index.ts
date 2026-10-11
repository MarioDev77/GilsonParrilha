import { z } from "zod";
import { onlyDigits } from "@/utils/format";

const phone = z
  .string()
  .min(1, "Informe o telefone")
  .refine((v) => [10, 11].includes(onlyDigits(v).length), "Informe DDD e número (10 ou 11 dígitos)");

export const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome").max(80, "Nome muito longo"),
    phone,
    fulfillment: z.enum(["delivery", "pickup"]),
    street: z.string().trim().max(120).optional(),
    number: z.string().trim().max(15).optional(),
    district: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80).optional(),
    complement: z.string().trim().max(80).optional(),
    reference: z.string().trim().max(160).optional(),
    notes: z.string().trim().max(300, "Máximo de 300 caracteres").optional(),
  })
  .superRefine((v, ctx) => {
    if (v.fulfillment !== "delivery") return;
    const required: Array<[keyof typeof v, string]> = [
      ["street", "Informe a rua"],
      ["number", "Informe o número"],
      ["district", "Informe o bairro"],
      ["city", "Informe a cidade"],
    ];
    for (const [field, message] of required) {
      if (!String(v[field] ?? "").trim()) ctx.addIssue({ code: "custom", path: [field], message });
    }
  });
export type CheckoutValues = z.infer<typeof checkoutSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const productSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(80),
  description: z.string().trim().min(5, "Descreva o produto").max(500),
  ingredientsText: z.string().trim().min(1, "Informe ao menos um ingrediente"),
  removableText: z.string().optional(),
  price: z.number({ error: "Informe o preço" }).positive("O preço deve ser maior que zero").max(10000),
  categoryId: z.string().min(1, "Escolha uma categoria"),
  available: z.boolean(),
  featured: z.boolean(),
  badge: z.enum(["", "mais_pedido", "novidade"]),
  addons: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().trim().min(1, "Nome do adicional"),
      price: z.number({ error: "Preço" }).min(0, "Preço inválido").max(1000),
      available: z.boolean(),
    })
  ),
});
export type ProductFormValues = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(50),
  active: z.boolean(),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;

export const userSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  email: z.string().trim().email("E-mail inválido"),
  role: z.string().min(1, "Escolha uma função"),
  active: z.boolean(),
  password: z.string().optional(),
});
export type UserFormValues = z.infer<typeof userSchema>;

export const settingsSchema = z.object({
  businessName: z.string().trim().min(2, "Informe o nome comercial"),
  whatsapp: z.string().refine((v) => onlyDigits(v).length >= 12, "Inclua DDI e DDD (ex.: 5575999999999)"),
  phone: z.string().optional(),
  address: z.string().optional(),
  instagramUrl: z.string().trim().refine((v) => !v || /^https?:\/\//.test(v), "Use um link começando com https://").optional(),
  facebookUrl: z.string().trim().refine((v) => !v || /^https?:\/\//.test(v), "Use um link começando com https://").optional(),
  heroHeadline: z.string().max(160).optional(),
  acceptsDelivery: z.boolean(),
  acceptsPickup: z.boolean(),
  deliveryFee: z.number({ error: "Valor inválido" }).min(0).nullable(),
  minimumOrder: z.number({ error: "Valor inválido" }).min(0).nullable(),
  prepTimeMinutes: z.number({ error: "Valor inválido" }).int().min(0).nullable(),
  serviceMessage: z.string().max(300).optional(),
  openingHours: z.array(z.object({ day: z.string().trim().min(1, "Dia"), hours: z.string().trim().min(1, "Horário") })),
});
export type SettingsFormValues = z.infer<typeof settingsSchema>;
