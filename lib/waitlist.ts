import { z } from "zod"
import { parsePhoneNumberFromString } from "libphonenumber-js/max"

export const waitlistSchema = z.object({
  email: z.string().trim().max(254).default("").transform(value => value.toLowerCase()).refine(value => !value || z.string().email().safeParse(value).success, "Ingresa un correo electrónico válido."),
  whatsapp: z.string().trim().max(40).default("").transform((value, ctx) => {
    if (!value) return ""
    const phone = value.startsWith("+") ? parsePhoneNumberFromString(value) : undefined
    if (!phone?.isValid()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Incluye el código de país, por ejemplo +52 998 123 4567." })
      return z.NEVER
    }
    return phone.number
  }),
  consent: z.literal(true, { errorMap: () => ({ message: "Acepta el aviso de privacidad para continuar." }) }),
  website: z.string().max(200).optional(),
}).refine(value => value.email || value.whatsapp, { message: "Ingresa tu correo electrónico o tu WhatsApp.", path: ["email"] })
