import { NextResponse } from "next/server"
import type { Stripe } from "stripe"
import {
  cleanDomain,
  cleanText,
  getSiteOrigin,
  getStripeSecretKey,
  getStripeServer,
  resolveBillingPeriodFromStripePrice,
  resolveExtraIdFromStripePrice,
  resolvePlanIdFromStripePrice,
  buildSafeIdempotencyKey,
} from "@/lib/stripe"
import {
  MASTER_EXTRAS,
  MASTER_PLANS,
  type BillingCycle,
  type PlanId,
} from "@/lib/plans"

const VALID_PLAN_IDS = new Set(["asistente", "recepcionista", "soporte-tecnico", "a-medida"])
const VALID_DOMAIN_OPTIONS = new Set(["domain-1", "domain-2"])
const DOMAIN_REGEX = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,}$/i

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 })
    }

    const secretKey = getStripeSecretKey()
    if (!secretKey) {
      return NextResponse.json({ error: "Falta STRIPE_SECRET_KEY en el servidor" }, { status: 500 })
    }

    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    const planId = cleanText(payload.planId, 40) as PlanId
    const billing: BillingCycle = payload.billing === "annual" ? "annual" : "quarterly"
    const extraIds = Array.isArray(payload.extraIds) ? payload.extraIds.map((e: string) => cleanText(e, 80)) : []
    const selectedDomain = cleanText(payload.selectedDomain, 40)
    const newDomain = cleanDomain(payload.newDomain)

    if (!planId || !VALID_PLAN_IDS.has(planId)) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 })
    }

    if (selectedDomain && VALID_DOMAIN_OPTIONS.has(selectedDomain)) {
      if (selectedDomain === "domain-2" && newDomain && !DOMAIN_REGEX.test(newDomain)) {
        return NextResponse.json({ error: "Dominio inválido" }, { status: 400 })
      }
    }

    const stripe = getStripeServer()
    const masterPlan = MASTER_PLANS[planId] || MASTER_PLANS.asistente

    const stripePrices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
    })

    const planCandidate = stripePrices.data.find((price) => {
      const pId = resolvePlanIdFromStripePrice(price)
      const pPeriod = resolveBillingPeriodFromStripePrice(price)
      return pId === planId && pPeriod === billing
    })

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    if (planCandidate) {
      lineItems.push({
        price: planCandidate.id,
        quantity: 1,
      })
    } else {
      const defaultPrice = masterPlan.defaultPrices[billing]
      lineItems.push({
        price_data: {
          currency: defaultPrice.currency,
          unit_amount: Math.round(defaultPrice.amount * 100),
          recurring: {
            interval: billing === "annual" ? "year" : "month",
            interval_count: billing === "annual" ? 1 : 3,
          },
          product_data: {
            name: `${masterPlan.title} (${billing === "annual" ? "Anual" : "Trimestral"})`,
            description: masterPlan.description,
            metadata: {
              plan_id: planId,
              billing,
            },
          },
        },
        quantity: 1,
      })
    }

    for (const extraId of extraIds) {
      const extraStripePrice = stripePrices.data.find((p) => {
        const id = resolveExtraIdFromStripePrice(p)
        const period = resolveBillingPeriodFromStripePrice(p)
        return id === extraId && (period === billing || period === "quarterly")
      })

      if (extraStripePrice) {
        lineItems.push({
          price: extraStripePrice.id,
          quantity: 1,
        })
      } else {
        const catalogExtra = MASTER_EXTRAS.find((e) => e.id === extraId)
        if (catalogExtra && catalogExtra.prices) {
          const extraPriceObj = billing === "annual" ? catalogExtra.prices.annual : catalogExtra.prices.quarterly
          if (extraPriceObj && extraPriceObj.amount > 0) {
            lineItems.push({
              price_data: {
                currency: extraPriceObj.currency,
                unit_amount: Math.round(extraPriceObj.amount * 100),
                recurring: {
                  interval: billing === "annual" ? "year" : "month",
                  interval_count: billing === "annual" ? 1 : 3,
                },
                product_data: {
                  name: catalogExtra.name || extraId,
                  description: catalogExtra.description || "",
                  metadata: {
                    extra_id: extraId,
                    billing,
                  },
                },
              },
              quantity: 1,
            })
          }
        }
      }
    }

    const origin = getSiteOrigin(request)
    const successUrl = `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/checkout?plan=${planId}&billing=${billing}`

    const metadata: Record<string, string> = {
      planId,
      billing,
      selectedDomain,
      newDomain,
      extraIds: JSON.stringify(extraIds),
    }

    const idempotencyKey = buildSafeIdempotencyKey("hosted", [
      planId,
      billing,
      extraIds.join(","),
      Math.floor(Date.now() / 5000),
    ])

    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        subscription_data: {
          metadata,
          description: `${masterPlan.title} (${billing === "annual" ? "Anual" : "Trimestral"})`,
        },
        locale: "es",
        allow_promotion_codes: true,
      },
      {
        idempotencyKey,
      }
    )

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error) {
    console.error("Error al crear sesión de checkout:", error)
    return NextResponse.json({ error: "No fue posible iniciar el checkout de Stripe" }, { status: 500 })
  }
}
