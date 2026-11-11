import { NextResponse } from "next/server"
import {
  getStripeSecretKey,
  getStripeServer,
  isStripeProduct,
  resolveBillingPeriodFromStripePrice,
  resolveExtraIdFromStripePrice,
  resolvePlanIdFromStripePrice,
} from "@/lib/stripe"
import {
  MASTER_EXTRAS,
  MASTER_PLANS,
  type CatalogExtra,
  type CatalogPlan,
  type PlanId,
  type PricingCatalogResponse,
} from "@/lib/plans"
import { supabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"
export const revalidate = 60

const buildFallbackCatalog = (): PricingCatalogResponse => {
  const p = MASTER_PLANS.asistente
  const plans: CatalogPlan[] = [
    {
      id: p.id,
      category: p.category,
      title: p.title,
      description: p.description,
      features: p.features,
      differences: p.differences,
      buttonText: p.buttonText,
      flags: p.flags,
      prices: {
        quarterly: {
          id: `catalog_${p.id}_quarterly`,
          amount: p.defaultPrices.quarterly.amount,
          currency: p.defaultPrices.quarterly.currency,
        },
        annual: {
          id: `catalog_${p.id}_annual`,
          amount: p.defaultPrices.annual.amount,
          currency: p.defaultPrices.annual.currency,
        },
      },
    },
  ]

  return {
    plans,
    extras: MASTER_EXTRAS,
    currency: "mxn",
  }
}

export async function GET() {
  const secretKey = getStripeSecretKey()

  try {
    // 1. Obtener ÚNICAMENTE los planes marcados como activos en Supabase
    const { data: dbPlans } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("price_quarterly_mxn", { ascending: true })

    // Determinar qué planes están activos (por defecto Plan Asistente)
    const activePlanRecords =
      dbPlans && dbPlans.length > 0
        ? dbPlans
        : [{ id: "asistente", name: "Plan Asistente", is_active: true }]

    const plansMap = new Map<PlanId, CatalogPlan>()

    for (const record of activePlanRecords) {
      const planId = record.id as PlanId
      const def = MASTER_PLANS[planId] || MASTER_PLANS.asistente

      const customFeatures =
        Array.isArray(record.features) && record.features.length > 0
          ? record.features
          : [...def.features]

      plansMap.set(planId, {
        id: planId,
        category: def.category,
        title: record.name || def.title,
        description: record.description || def.description,
        features: customFeatures,
        differences: [...def.differences],
        buttonText: def.buttonText,
        flags: def.flags,
        prices: {
          quarterly: {
            id: record.stripe_quarterly_price_id || `catalog_${planId}_quarterly`,
            amount: Number(record.price_quarterly_mxn) || def.defaultPrices.quarterly.amount,
            currency: "mxn",
          },
          annual: {
            id: record.stripe_annual_price_id || `catalog_${planId}_annual`,
            amount: Number(record.price_annual_mxn) || def.defaultPrices.annual.amount,
            currency: "mxn",
          },
        },
      })
    }

    if (!secretKey) {
      return NextResponse.json({
        plans: Array.from(plansMap.values()),
        extras: MASTER_EXTRAS,
        currency: "mxn",
      })
    }

    // 2. Obtener precios activos desde Stripe
    const stripe = getStripeServer()
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
    })

    // Inicializar extras con la definición maestra
    const extrasMap = new Map<string, CatalogExtra>()
    for (const extra of MASTER_EXTRAS) {
      extrasMap.set(extra.id, { ...extra })
    }

    // Procesar precios registrados en Stripe para los planes ACTIVOS
    for (const price of prices.data) {
      if (!price.active) continue

      const planId = resolvePlanIdFromStripePrice(price) as PlanId | null
      const period = resolveBillingPeriodFromStripePrice(price)

      // Solo asociar precio si el plan está en la lista de planes ACTIVOS
      if (planId && plansMap.has(planId) && period) {
        const plan = plansMap.get(planId)!
        const product = isStripeProduct(price.product) ? price.product : null

        // Si el producto en Stripe está inactivo, omitirlo
        if (product && product.active === false) {
          continue
        }

        const amount = Number((price.unit_amount ?? 0) / 100)
        plan.prices = plan.prices || {}
        plan.prices[period] = {
          id: price.id,
          amount,
          currency: price.currency,
        }
        continue
      }

      // Extras / Addons
      const extraId = resolveExtraIdFromStripePrice(price)
      if (extraId) {
        const product = isStripeProduct(price.product) ? price.product : null
        const existingExtra = extrasMap.get(extraId) || {
          id: extraId,
          category:
            (price.metadata?.category as string) ||
            (product?.metadata?.category as string) ||
            "general",
          name: price.nickname || product?.name || extraId,
          description: product?.description || "",
          prices: {
            quarterly: null,
            annual: null,
          },
        }

        const amount = Number((price.unit_amount ?? 0) / 100)
        const targetPeriod = period === "annual" ? "annual" : "quarterly"

        existingExtra.prices = existingExtra.prices || {}
        existingExtra.prices[targetPeriod] = {
          id: price.id,
          amount,
          currency: price.currency,
        }

        extrasMap.set(extraId, existingExtra)
      }
    }

    const plans = Array.from(plansMap.values())
    const extras = Array.from(extrasMap.values())

    return NextResponse.json(
      {
        plans,
        extras,
        currency: "mxn",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    )
  } catch (error) {
    console.error("Error al obtener catálogo de Stripe (utilizando catálogo resiliente):", error)
    return NextResponse.json(buildFallbackCatalog(), {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    })
  }
}
