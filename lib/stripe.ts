import { Stripe } from "stripe"
import { createHash } from "node:crypto"

/**
 * Normaliza y limpia cadenas de texto de forma segura.
 */
export const cleanText = (value: unknown, maxLength = 160): string => {
  return String(value || "")
    .trim()
    .slice(0, maxLength)
}

export const cleanDomain = (value: unknown): string => {
  return cleanText(value, 120)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
}

export const cleanEmail = (value: unknown): string => {
  return cleanText(value, 160).toLowerCase()
}

/**
 * Obtiene la clave secreta de Stripe con limpieza de espacios accidentales.
 */
export const getStripeSecretKey = (): string => {
  return (process.env.STRIPE_SECRET_KEY || "").trim()
}

/**
 * Obtiene la clave pública de Stripe con limpieza de espacios accidentales.
 */
export const getStripePublishableKey = (): string => {
  return (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").trim()
}

/**
 * Obtiene el secreto del webhook de Stripe.
 */
export const getStripeWebhookSecret = (): string => {
  return (process.env.STRIPE_WEBHOOK_SECRET || "").trim()
}

/**
 * Valida la coherencia de las credenciales de Stripe (modo test vs live).
 */
export const checkStripeKeysHealth = (): {
  configured: boolean
  isLiveMode: boolean
  secretMode: "live" | "test" | "missing"
  publishableMode: "live" | "test" | "missing"
  keysMatch: boolean
  warning?: string
} => {
  const secretKey = getStripeSecretKey()
  const publishableKey = getStripePublishableKey()

  const secretMode: "live" | "test" | "missing" = !secretKey
    ? "missing"
    : secretKey.startsWith("sk_live_")
    ? "live"
    : secretKey.startsWith("sk_test_")
    ? "test"
    : "missing"

  const publishableMode: "live" | "test" | "missing" = !publishableKey
    ? "missing"
    : publishableKey.startsWith("pk_live_")
    ? "live"
    : publishableKey.startsWith("pk_test_")
    ? "test"
    : "missing"

  const configured = secretMode !== "missing"
  const keysMatch =
    (secretMode === "live" && publishableMode === "live") ||
    (secretMode === "test" && publishableMode === "test") ||
    publishableMode === "missing"

  let warning: string | undefined
  if (secretMode !== "missing" && publishableMode !== "missing" && !keysMatch) {
    warning = `Inconsistencia en Stripe: STRIPE_SECRET_KEY está en modo ${secretMode.toUpperCase()} (${secretKey.slice(0, 8)}...) mientras que NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY está en modo ${publishableMode.toUpperCase()} (${publishableKey.slice(0, 8)}...). Ambas claves deben ser del mismo entorno para evitar errores al cargar Embedded Checkout.`
  }

  return {
    configured,
    isLiveMode: secretMode === "live",
    secretMode,
    publishableMode,
    keysMatch,
    warning,
  }
}

/**
 * Singleton del cliente de Stripe en el servidor.
 */
let stripeInstance: Stripe | null = null

export const getStripeServer = (): Stripe => {
  const secretKey = getStripeSecretKey()
  if (!secretKey) {
    throw new Error("Configuración de Stripe incompleta: falta STRIPE_SECRET_KEY en las variables de entorno.")
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      typescript: true,
      appInfo: {
        name: "Kinexting B2B Platform",
        version: "1.0.0",
      },
    })
  }

  return stripeInstance
}

/**
 * Determina el origen público de la aplicación respetando proxies inversos (Vercel, Cloudflare, etc.).
 */
export const getSiteOrigin = (request?: Request): string => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  }
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, "")
  }

  if (request) {
    const forwardedHost = request.headers.get("x-forwarded-host")
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https"
    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost.split(",")[0].trim()}`
    }
    try {
      return new URL(request.url).origin
    } catch {
      // fallback
    }
  }

  return "https://www.kinexting.com"
}

export const isStripeProduct = (product: unknown): product is Stripe.Product => {
  return Boolean(
    product &&
      typeof product === "object" &&
      !("deleted" in product && (product as { deleted?: boolean }).deleted) &&
      "name" in product
  )
}

/**
 * Resuelve el identificador de plan correspondiente a un Price de Stripe.
 */
const KNOWN_PLAN_IDS = new Set(["asistente", "recepcionista", "soporte-tecnico", "a-medida"])

export const resolvePlanIdFromStripePrice = (price: Stripe.Price): string | null => {
  // 1. Metadata directa en el precio
  const priceMetaId = price.metadata?.plan_id
  if (priceMetaId && KNOWN_PLAN_IDS.has(priceMetaId)) return priceMetaId

  // 2. Metadata en el producto asociado (si está expandido y no eliminado)
  const product = isStripeProduct(price.product) ? price.product : null
  const productMetaId = product?.metadata?.plan_id
  if (productMetaId && KNOWN_PLAN_IDS.has(productMetaId)) return productMetaId

  // 3. Lookup Key
  const lookupKey = (price.lookup_key || "").toLowerCase()
  if (lookupKey) {
    if (
      lookupKey.includes("a-medida") ||
      lookupKey.includes("a_medida") ||
      lookupKey.includes("tier4") ||
      lookupKey.includes("personalizado")
    ) {
      return "a-medida"
    }
    if (
      lookupKey.includes("tier1") ||
      lookupKey.includes("asistente") ||
      lookupKey.includes("esencial") ||
      lookupKey.includes("landing")
    ) {
      return "asistente"
    }
    if (
      lookupKey.includes("tier2") ||
      lookupKey.includes("recepcionista") ||
      lookupKey.includes("omnicanal") ||
      (lookupKey.includes("chatbot") && !lookupKey.includes("web"))
    ) {
      return "recepcionista"
    }
    if (
      lookupKey.includes("tier3") ||
      lookupKey.includes("soporte") ||
      lookupKey.includes("webapp") ||
      (lookupKey.includes("web") && !lookupKey.includes("chatbot"))
    ) {
      return "soporte-tecnico"
    }
  }

  // 4. Nickname o nombre del producto
  const productName = (product?.name || "").toLowerCase()
  const nickname = (price.nickname || "").toLowerCase()
  const text = `${nickname} ${productName}`

  if (text.includes("a medida") || (text.includes("chatbot") && text.includes("web")) || text.includes("tier 4")) {
    return "a-medida"
  }
  if (text.includes("asistente") || text.includes("esencial") || text.includes("tier 1")) {
    return "asistente"
  }
  if (text.includes("recepcionista") || text.includes("omnicanal") || text.includes("tier 2")) {
    return "recepcionista"
  }
  if (text.includes("soporte") || text.includes("web app") || text.includes("tier 3")) {
    return "soporte-tecnico"
  }

  return null
}

/**
 * Resuelve el ciclo de facturación (quarterly | annual) de un Price de Stripe.
 */
export const resolveBillingPeriodFromStripePrice = (price: Stripe.Price): "quarterly" | "annual" | null => {
  const lookupKey = (price.lookup_key || "").toLowerCase()
  if (
    lookupKey.includes("year") ||
    lookupKey.includes("annual") ||
    lookupKey.includes("anual") ||
    lookupKey.includes("yearly")
  ) {
    return "annual"
  }
  if (
    lookupKey.includes("quarter") ||
    lookupKey.includes("trimest") ||
    lookupKey.includes("_3m")
  ) {
    return "quarterly"
  }

  const interval = price.recurring?.interval
  const intervalCount = price.recurring?.interval_count || 1

  if (interval === "year" || (interval === "month" && intervalCount === 12)) {
    return "annual"
  }
  if (interval === "month" && intervalCount === 3) {
    return "quarterly"
  }

  return null
}

/**
 * Resuelve si un precio de Stripe corresponde a un Extra / Addon opcional.
 */
export const resolveExtraIdFromStripePrice = (price: Stripe.Price): string | null => {
  if (price.metadata?.extra_id) return price.metadata.extra_id

  const product = isStripeProduct(price.product) ? price.product : null
  if (product?.metadata?.extra_id) return product.metadata.extra_id

  const lookupKey = price.lookup_key || ""
  if (lookupKey.startsWith("extra.")) {
    const parts = lookupKey.split(".")
    return parts.slice(1, -1).join("-") || parts[1] || null
  }

  return null
}

/**
 * Busca o crea un Customer en Stripe de forma segura, descartando clientes borrados y actualizando metadata.
 */
export const findOrCreateStripeCustomer = async (
  stripe: Stripe,
  params: {
    email: string
    name: string
    phone: string
    address?: Stripe.AddressParam
    metadata: Record<string, string>
  }
): Promise<string> => {
  const normalizedEmail = cleanEmail(params.email)

  // Buscar clientes existentes con el mismo correo
  const existingCustomers = await stripe.customers.list({
    email: normalizedEmail,
    limit: 5,
  })

  // Descartar clientes marcados como eliminados (deleted: true)
  const activeCustomer = existingCustomers.data.find(
    (c) => !(c as Stripe.Customer & { deleted?: boolean }).deleted
  )

  const customerData: Stripe.CustomerUpdateParams = {
    name: cleanText(params.name, 120),
    phone: cleanText(params.phone, 30),
    metadata: params.metadata,
  }

  if (params.address) {
    customerData.address = params.address
  }

  if (activeCustomer) {
    await stripe.customers.update(activeCustomer.id, customerData)
    return activeCustomer.id
  }

  // Si no existe ninguno activo, crear uno nuevo
  const newCustomer = await stripe.customers.create({
    email: normalizedEmail,
    name: cleanText(params.name, 120),
    phone: cleanText(params.phone, 30),
    address: params.address,
    metadata: params.metadata,
  })

  return newCustomer.id
}

/**
 * Genera una Idempotency Key segura para solicitudes a Stripe.
 */
export const buildSafeIdempotencyKey = (
  prefix: string,
  components: Array<string | number | boolean | null | undefined>
): string => {
  const raw = [prefix, ...components.map((c) => String(c ?? ""))].join(":")
  return createHash("sha256").update(raw).digest("hex").slice(0, 64)
}
