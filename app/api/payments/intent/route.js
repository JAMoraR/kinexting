import { NextResponse } from "next/server"
import { Stripe } from "stripe"

const PLAN_IDS = new Set(["landing", "chatbot", "webapp", "chatbot-webapp"])
const OXXO_MAX_AMOUNT_MXN = 1_000_000

const getPriceLabel = (price) => {
  const product = price.product && typeof price.product !== "string" ? price.product : null
  return price.nickname || product?.name || price.id
}

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const resolvePlanId = (price) => {
  const metadataId = price.metadata?.plan_id
  if (metadataId && PLAN_IDS.has(metadataId)) return metadataId

  const lookupKey = price.lookup_key ?? ""
  if (lookupKey.startsWith("plan.")) {
    const lookupParts = lookupKey.split(".")
    const inferred = lookupParts.slice(1, -1).join("-")
    if (PLAN_IDS.has(inferred)) return inferred
  }

  const productName = price.product && typeof price.product !== "string" ? price.product.name : ""
  const candidate = normalizeText(price.nickname || productName)

  if (candidate.includes("chatbot") && candidate.includes("web")) return "chatbot-webapp"
  if (candidate.includes("web app") || candidate === "webapp" || candidate === "web app") return "webapp"
  if (candidate.includes("chatbot")) return "chatbot"
  if (candidate.includes("landing")) return "landing"

  return null
}

const resolveExtraId = (price) => {
  const metadataId = price.metadata?.extra_id
  if (metadataId) return metadataId

  const lookupKey = price.lookup_key ?? ""
  if (lookupKey.startsWith("extra.")) {
    const lookupParts = lookupKey.split(".")
    const inferred = lookupParts.slice(1, -1).join("-")
    if (inferred) return inferred
  }

  return null
}

const getInterval = (billing) => (billing === "annual" ? "year" : "month")

const isRecurringPlanPrice = (price, selectedPlanId) => {
  const interval = price.recurring?.interval
  return Boolean(interval && (interval === "month" || interval === "year") && resolvePlanId(price) === selectedPlanId)
}

const isRecurringExtraPrice = (price, selectedExtraId) => {
  const interval = price.recurring?.interval
  return Boolean(interval && (interval === "month" || interval === "year") && resolveExtraId(price) === selectedExtraId)
}

const pickPriceForInterval = (candidates, targetInterval) => {
  const exact = candidates.find((price) => price.recurring?.interval === targetInterval)
  if (exact) return exact

  return candidates.find((price) => price.recurring?.interval === "month") ?? null
}

const resolvePaymentMethodTypes = (preferredMethod, amount) => {
  const oxxoAllowed = amount <= OXXO_MAX_AMOUNT_MXN

  if (preferredMethod === "card") return ["card"]
  if (preferredMethod === "oxxo") {
    if (!oxxoAllowed) {
      throw new Error("El metodo OXXO solo permite montos de hasta $10,000 MXN")
    }
    return ["oxxo"]
  }
  if (preferredMethod === "spei") return ["customer_balance"]

  const methods = ["card", "customer_balance"]
  if (oxxoAllowed) methods.push("oxxo")
  return methods
}

export async function POST(request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 })
    }

    const payload = await request.json()
    const planId = payload?.planId
    const billing = payload?.billing === "annual" ? "annual" : "monthly"
    const extraIds = Array.isArray(payload?.extraIds) ? payload.extraIds : []
    const selectedDomain = payload?.selectedDomain || ""
    const newDomain = payload?.newDomain || ""
    const customerEmail = payload?.customerEmail || undefined
    const customerPhone = payload?.customerPhone || ""
    const businessInfo = payload?.businessInfo && typeof payload.businessInfo === "object" ? payload.businessInfo : null
    const customerName = payload?.customerName || ""
    const preferredMethod = payload?.preferredMethod || "all"
    const invoice = payload?.invoice && typeof payload.invoice === "object" ? payload.invoice : null

    if (!planId || !PLAN_IDS.has(planId)) {
      return NextResponse.json({ error: "Invalid planId" }, { status: 400 })
    }

    const stripe = new Stripe(secretKey)

    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
    })

    const targetInterval = getInterval(billing)
    const planCandidates = prices.data.filter((price) => isRecurringPlanPrice(price, planId))
    const basePlanPrice = pickPriceForInterval(planCandidates, targetInterval)

    if (!basePlanPrice?.unit_amount) {
      return NextResponse.json({ error: "Price not found for selected plan" }, { status: 400 })
    }

    let totalAmount = basePlanPrice.unit_amount
    const extraLineItems = []

    for (const extraId of extraIds) {
      const extraCandidates = prices.data.filter((price) => isRecurringExtraPrice(price, extraId))
      const extraPrice = pickPriceForInterval(extraCandidates, targetInterval)
      if (extraPrice?.unit_amount) {
        totalAmount += extraPrice.unit_amount
        extraLineItems.push({
          id: extraId,
          label: getPriceLabel(extraPrice),
          amount: extraPrice.unit_amount,
        })
      }
    }

    const customer = await stripe.customers.create({
      email: customerEmail,
      name: customerName || undefined,
      phone: customerPhone || undefined,
      metadata: {
        planId,
        billing,
        selectedDomain,
        newDomain,
        customerName,
        customerPhone,
        businessName: businessInfo?.businessName || "",
        businessType: businessInfo?.businessType || "",
        businessEmail: businessInfo?.email || "",
        businessCountry: businessInfo?.country || "",
        businessCity: businessInfo?.city || "",
        invoiceRequested: invoice?.enabled ? "true" : "false",
        invoiceRfc: invoice?.enabled ? invoice?.rfc || "" : "",
        invoiceBusinessName: invoice?.enabled ? invoice?.businessName || "" : "",
        invoiceEmail: invoice?.enabled ? invoice?.email || "" : "",
      },
    })

    const paymentMethodTypes = resolvePaymentMethodTypes(preferredMethod, totalAmount)
    const paymentMethodOptions = paymentMethodTypes.includes("customer_balance")
      ? {
          customer_balance: {
            funding_type: "bank_transfer",
            bank_transfer: {
              type: "mx_bank_transfer",
            },
          },
        }
      : undefined

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "mxn",
      customer: customer.id,
      payment_method_types: paymentMethodTypes,
      payment_method_options: paymentMethodOptions,
      metadata: {
        flow: "embedded-payment-element-trial",
        planId,
        billing,
        selectedDomain,
        newDomain,
        preferredMethod,
        customerName,
        customerPhone,
        businessName: businessInfo?.businessName || "",
        businessType: businessInfo?.businessType || "",
        businessEmail: businessInfo?.email || "",
        businessCountry: businessInfo?.country || "",
        businessCity: businessInfo?.city || "",
        invoiceRequested: invoice?.enabled ? "true" : "false",
        invoiceRfc: invoice?.enabled ? invoice?.rfc || "" : "",
        invoiceBusinessName: invoice?.enabled ? invoice?.businessName || "" : "",
        invoiceEmail: invoice?.enabled ? invoice?.email || "" : "",
        extraIds: JSON.stringify(extraIds),
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      summary: {
        currency: "mxn",
        billing,
        plan: {
          id: planId,
          label: getPriceLabel(basePlanPrice),
          amount: basePlanPrice.unit_amount,
        },
        extras: extraLineItems,
        total: totalAmount,
      },
    })
  } catch (error) {
    console.error("Failed to create PaymentIntent", error)

    if (error instanceof Error && error.message.includes("OXXO")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 })
  }
}
