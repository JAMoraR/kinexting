import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getStripeServer } from "@/lib/stripe"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("active_only") === "true"

    let query = supabaseAdmin
      .from("plans")
      .select("*")
      .not("id", "in", '("pro_wa","enterprise","pack_extra")')
      .order("is_active", { ascending: false })
      .order("price_quarterly_mxn", { ascending: true })

    if (activeOnly) {
      query = query.eq("is_active", true)
    }

    const { data: plans, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ plans: plans || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al obtener planes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      description,
      category = "chatbot",
      price_quarterly_mxn,
      price_annual_mxn,
      features = [],
      budget_breakdown,
    } = body

    if (!id || !name) {
      return NextResponse.json({ error: "ID y Nombre del plan son requeridos" }, { status: 400 })
    }

    const qPrice = Math.max(0, Number(price_quarterly_mxn) || 0)
    const aPrice = Math.max(0, Number(price_annual_mxn) || 0)

    const stripe = getStripeServer()

    // 1. Crear producto en Stripe
    const product = await stripe.products.create({
      name: name.trim(),
      description: description ? description.trim() : undefined,
      metadata: {
        plan_id: id.trim().toLowerCase(),
        category,
        tipo: "crm_whatsapp_saas",
      },
    })

    // 2. Crear precio trimestral en Stripe (tax_behavior: exclusive)
    const priceQ = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(qPrice * 100),
      currency: "mxn",
      tax_behavior: "exclusive",
      recurring: { interval: "month", interval_count: 3 },
      lookup_key: `kinexting_${id}_quarter`,
      metadata: { plan_id: id, period: "quarterly" },
      nickname: `Cuota trimestral ${name}`,
    })

    // 3. Crear precio anual en Stripe (tax_behavior: exclusive)
    const priceA = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(aPrice * 100),
      currency: "mxn",
      tax_behavior: "exclusive",
      recurring: { interval: "year", interval_count: 1 },
      lookup_key: `kinexting_${id}_annual`,
      metadata: { plan_id: id, period: "annual" },
      nickname: `Cuota anual ${name}`,
    })

    // Establecer precio trimestral como default
    await stripe.products.update(product.id, {
      default_price: priceQ.id,
    })

    // 4. Generar o utilizar el desglose presupuestario configurado (usando tipos de cambio de la BD)
    let dbUsd = 20.00
    let dbEur = 21.40
    try {
      const { data: cSettings } = await supabaseAdmin
        .from("currency_settings")
        .select("exchange_rate_usd, exchange_rate_eur")
        .eq("id", "default")
        .maybeSingle()
      if (cSettings?.exchange_rate_usd) dbUsd = Number(cSettings.exchange_rate_usd)
      if (cSettings?.exchange_rate_eur) dbEur = Number(cSettings.exchange_rate_eur)
    } catch {
      // Usar defaults
    }

    const initialBudget = budget_breakdown || {
      quarterly: {
        target_price_mxn: qPrice,
        markup_percentage: 20.0,
        exchange_rate_usd: dbUsd,
        exchange_rate_eur: dbEur,
        items: [
          { id: "ia_tokens", name: "Consumo de Tokens IA", description: "Inferencia y respuestas 24/7", provider: "OpenAI / Claude API", kind: "costo", amount_mxn: Math.round(qPrice * 0.25), amount_usd: Math.round((qPrice * 0.25) / dbUsd), markup_percent: 20 },
          { id: "cloud_infra", name: "Infraestructura Cloud", description: "Servidores cloud y base de datos", provider: "Supabase / AWS", kind: "costo", amount_mxn: Math.round(qPrice * 0.15), amount_usd: Math.round((qPrice * 0.15) / dbUsd), markup_percent: 15 },
          { id: "lic_crm", name: "Licencia CRM Kinexting Core", description: "Acceso multiusuario a CRM", provider: "Kinexting Core", kind: "servicio", amount_mxn: Math.round(qPrice * 0.40), amount_usd: Math.round((qPrice * 0.40) / dbUsd), markup_percent: 0 },
          { id: "support_srv", name: "Soporte Técnico Especializado", description: "Supervisión proactiva continua", provider: "Kinexting Soporte", kind: "servicio", amount_mxn: Math.round(qPrice * 0.20), amount_usd: Math.round((qPrice * 0.20) / dbUsd), markup_percent: 0 },
        ],
      },
      annual: {
        target_price_mxn: aPrice,
        markup_percentage: 20.0,
        exchange_rate_usd: dbUsd,
        exchange_rate_eur: dbEur,
        items: [
          { id: "ia_tokens_yr", name: "Bolsa Anual Tokens IA", description: "Inferencia anual multicanal", provider: "OpenAI / Claude API", kind: "costo", amount_mxn: Math.round(aPrice * 0.25), amount_usd: Math.round((aPrice * 0.25) / dbUsd), markup_percent: 20 },
          { id: "cloud_infra_yr", name: "Infraestructura Cloud Anual", description: "Alojamiento dedicado y backups", provider: "Supabase / AWS", kind: "costo", amount_mxn: Math.round(aPrice * 0.15), amount_usd: Math.round((aPrice * 0.15) / dbUsd), markup_percent: 15 },
          { id: "lic_crm_yr", name: "Licencia Anual CRM", description: "Licencia anual de plataforma", provider: "Kinexting Core", kind: "servicio", amount_mxn: Math.round(aPrice * 0.40), amount_usd: Math.round((aPrice * 0.40) / dbUsd), markup_percent: 0 },
          { id: "support_srv_yr", name: "Soporte Técnico Anual", description: "Supervisión técnica prioritaria", provider: "Kinexting Soporte", kind: "servicio", amount_mxn: Math.round(aPrice * 0.20), amount_usd: Math.round((aPrice * 0.20) / dbUsd), markup_percent: 0 },
        ],
      },
    }

    // 5. Guardar en Supabase
    const { data: newPlan, error } = await supabaseAdmin
      .from("plans")
      .insert({
        id: id.trim().toLowerCase(),
        name: name.trim(),
        description,
        category,
        stripe_product_id: product.id,
        stripe_quarterly_price_id: priceQ.id,
        stripe_annual_price_id: priceA.id,
        price_quarterly_mxn: qPrice,
        price_annual_mxn: aPrice,
        currency: "MXN",
        features,
        budget_breakdown: initialBudget,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_email: "angelpordiez@gmail.com",
      action: "PLAN_CREATED_STRIPE_SYNCED",
      details: { plan_id: id, stripe_product_id: product.id, category },
    })

    return NextResponse.json({ success: true, plan: newPlan })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al crear plan" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, name, description, category, price_quarterly_mxn, price_annual_mxn, features, is_active } = body

    if (!id) {
      return NextResponse.json({ error: "ID del plan es requerido" }, { status: 400 })
    }

    // Obtener plan actual de Supabase
    const { data: currentPlan } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", id)
      .single()

    const stripe = getStripeServer()
    let stripeProductUpdated = false
    let newPriceQId = currentPlan?.stripe_quarterly_price_id
    let newPriceAId = currentPlan?.stripe_annual_price_id

    // 1. Si existe producto en Stripe, actualizar nombre / descripción / estado activo
    if (currentPlan?.stripe_product_id) {
      try {
        const stripeUpdates: any = {}
        if (name !== undefined) stripeUpdates.name = name.trim()
        if (description !== undefined) stripeUpdates.description = description.trim()
        if (is_active !== undefined) stripeUpdates.active = Boolean(is_active)
        if (category !== undefined) {
          stripeUpdates.metadata = {
            ...(currentPlan.metadata || {}),
            category,
          }
        }

        if (Object.keys(stripeUpdates).length > 0) {
          await stripe.products.update(currentPlan.stripe_product_id, stripeUpdates)
          stripeProductUpdated = true
        }

        // 2. Si el precio trimestral cambió, crear nuevo Price en Stripe
        if (
          price_quarterly_mxn !== undefined &&
          Number(price_quarterly_mxn) !== Number(currentPlan.price_quarterly_mxn)
        ) {
          const newPriceQ = await stripe.prices.create({
            product: currentPlan.stripe_product_id,
            unit_amount: Math.round(Number(price_quarterly_mxn) * 100),
            currency: "mxn",
            recurring: { interval: "month", interval_count: 3 },
            lookup_key: `kinexting_${id}_quarter_${Date.now()}`,
            metadata: { plan_id: id, period: "quarterly" },
          })
          newPriceQId = newPriceQ.id
        }

        // 3. Si el precio anual cambió, crear nuevo Price en Stripe
        if (
          price_annual_mxn !== undefined &&
          Number(price_annual_mxn) !== Number(currentPlan.price_annual_mxn)
        ) {
          const newPriceA = await stripe.prices.create({
            product: currentPlan.stripe_product_id,
            unit_amount: Math.round(Number(price_annual_mxn) * 100),
            currency: "mxn",
            recurring: { interval: "year", interval_count: 1 },
            lookup_key: `kinexting_${id}_annual_${Date.now()}`,
            metadata: { plan_id: id, period: "annual" },
          })
          newPriceAId = newPriceA.id
        }
      } catch (stripeErr) {
        console.error("Error actualizando en Stripe:", stripeErr)
      }
    }

    // 4. Actualizar en Supabase
    const updates: any = {
      updated_at: new Date().toISOString(),
    }
    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description
    if (category !== undefined) updates.category = category
    if (price_quarterly_mxn !== undefined) updates.price_quarterly_mxn = Number(price_quarterly_mxn)
    if (price_annual_mxn !== undefined) updates.price_annual_mxn = Number(price_annual_mxn)
    if (features !== undefined) updates.features = features
    if (is_active !== undefined) updates.is_active = Boolean(is_active)
    if (newPriceQId) updates.stripe_quarterly_price_id = newPriceQId
    if (newPriceAId) updates.stripe_annual_price_id = newPriceAId

    const { data: updatedPlan, error } = await supabaseAdmin
      .from("plans")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_email: "angelpordiez@gmail.com",
      action: is_active !== undefined && Object.keys(updates).length <= 2 ? "PLAN_STATUS_TOGGLED" : "PLAN_UPDATED_STRIPE_SYNCED",
      details: { plan_id: id, updates, stripe_product_updated: stripeProductUpdated },
    })

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      stripe_synced: stripeProductUpdated,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al actualizar plan" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID del plan es requerido" }, { status: 400 })
    }

    // Obtener plan
    const { data: currentPlan } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", id)
      .single()

    if (!currentPlan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    // Desactivar en Stripe si existe
    if (currentPlan.stripe_product_id) {
      try {
        const stripe = getStripeServer()
        await stripe.products.update(currentPlan.stripe_product_id, { active: false })
      } catch (stripeErr) {
        console.error("Error desactivando en Stripe:", stripeErr)
      }
    }

    // Marcar como inactivo en Supabase
    const { data: disabledPlan, error } = await supabaseAdmin
      .from("plans")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_email: "angelpordiez@gmail.com",
      action: "PLAN_DEACTIVATED_STRIPE_SYNCED",
      details: { plan_id: id, stripe_product_id: currentPlan.stripe_product_id },
    })

    return NextResponse.json({
      success: true,
      message: `Plan ${currentPlan.name} inhabilitado en Supabase y archivado en Stripe`,
      plan: disabledPlan,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al inhabilitar plan" }, { status: 500 })
  }
}
