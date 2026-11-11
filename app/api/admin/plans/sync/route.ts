import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getStripeServer, resolvePlanIdFromStripePrice } from "@/lib/stripe"
import { MASTER_PLANS } from "@/lib/plans"

export async function POST() {
  try {
    const stripe = getStripeServer()

    // 1. Obtener todos los productos y precios (activos e inactivos) de Stripe
    const [productsRes, pricesRes] = await Promise.all([
      stripe.products.list({ limit: 100 }),
      stripe.prices.list({ limit: 100, expand: ["data.product"] }),
    ])

    const products = productsRes.data
    const prices = pricesRes.data

    const syncedPlans = []

    for (const prod of products) {
      // Filtrar precios asociados a este producto
      const prodPrices = prices.filter((p) => {
        const prodId = typeof p.product === "string" ? p.product : p.product.id
        return prodId === prod.id
      })

      // Ordenar por fecha de creación descendente (el más reciente primero)
      prodPrices.sort((a, b) => b.created - a.created)

      // Separar precios activos e inactivos
      const activeProdPrices = prodPrices.filter((p) => p.active)
      const candidatePrices = activeProdPrices.length > 0 ? activeProdPrices : prodPrices

      // Identificar precio trimestral (cada 3 meses)
      const quarterlyPrice =
        candidatePrices.find(
          (p) => p.recurring?.interval === "month" && p.recurring?.interval_count === 3
        ) ||
        candidatePrices.find(
          (p) =>
            p.lookup_key?.includes("quarter") ||
            p.lookup_key?.includes("trimest") ||
            p.nickname?.toLowerCase().includes("trimestral")
        ) ||
        prodPrices.find(
          (p) => p.recurring?.interval === "month" && p.recurring?.interval_count === 3
        )

      // Identificar precio anual (por año o cada 12 meses)
      const annualPrice =
        candidatePrices.find(
          (p) => p.recurring?.interval === "year" && p.recurring?.interval_count === 1
        ) ||
        candidatePrices.find(
          (p) => p.recurring?.interval === "month" && p.recurring?.interval_count === 12
        ) ||
        candidatePrices.find(
          (p) =>
            p.lookup_key?.includes("year") ||
            p.lookup_key?.includes("anual") ||
            p.nickname?.toLowerCase().includes("anual")
        ) ||
        prodPrices.find(
          (p) => p.recurring?.interval === "year" && p.recurring?.interval_count === 1
        )

      // Determinar ID del plan
      const planId =
        prod.metadata?.plan_id ||
        (quarterlyPrice ? resolvePlanIdFromStripePrice(quarterlyPrice) : null) ||
        (annualPrice ? resolvePlanIdFromStripePrice(annualPrice) : null) ||
        (prod.name.toLowerCase().includes("asistente") ? "asistente" : null) ||
        (prod.name.toLowerCase().includes("omnicanal") ? "recepcionista" : null) ||
        (prod.name.toLowerCase().includes("web app") && !prod.name.toLowerCase().includes("chatbot") ? "soporte-tecnico" : null) ||
        (prod.name.toLowerCase().includes("chatbot") ? "a-medida" : null) ||
        prod.name.toLowerCase().replace(/[^a-z0-9]/g, "_")

      const masterDef = MASTER_PLANS[planId as keyof typeof MASTER_PLANS]

      const priceQ = quarterlyPrice ? (quarterlyPrice.unit_amount || 0) / 100 : masterDef?.defaultPrices.quarterly.amount || 0
      const priceA = annualPrice ? (annualPrice.unit_amount || 0) / 100 : masterDef?.defaultPrices.annual.amount || 0

      const planRecord = {
        id: planId,
        name: prod.name,
        description: prod.description || masterDef?.description || "",
        stripe_product_id: prod.id,
        stripe_quarterly_price_id: quarterlyPrice ? quarterlyPrice.id : null,
        stripe_annual_price_id: annualPrice ? annualPrice.id : null,
        price_quarterly_mxn: priceQ,
        price_annual_mxn: priceA,
        currency: "MXN",
        features: masterDef?.features || [
          "Sincronización bidireccional con Stripe",
          "Automatización conversacional de IA",
          "Gestión centralizada CRM",
        ],
        is_active: Boolean(prod.active),
        updated_at: new Date().toISOString(),
      }

      // Upsert en Supabase
      const { data: upserted, error } = await supabaseAdmin
        .from("plans")
        .upsert(planRecord)
        .select()
        .single()

      if (error) {
        console.error(`Error al upsert en Supabase para plan ${planId}:`, error)
      } else if (upserted) {
        syncedPlans.push(upserted)
      }
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_email: "angelpordiez@gmail.com",
      action: "STRIPE_CATALOG_SYNCED",
      details: { count: syncedPlans.length, timestamp: new Date().toISOString() },
    })

    return NextResponse.json({
      success: true,
      message: `Catálogo de Stripe sincronizado exitosamente con Supabase (${syncedPlans.length} planes actualizados)`,
      plans: syncedPlans,
    })
  } catch (err: any) {
    console.error("Error syncing Stripe catalog:", err)
    return NextResponse.json({ error: err.message || "Error al sincronizar con Stripe" }, { status: 500 })
  }
}
