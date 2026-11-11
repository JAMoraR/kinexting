import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getStripeServer } from "@/lib/stripe"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get("plan_id")

    if (!planId) {
      return NextResponse.json({ error: "plan_id es requerido" }, { status: 400 })
    }

    const { data: plan, error: planErr } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single()

    if (planErr || !plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    if (!plan.stripe_product_id) {
      return NextResponse.json({ prices: [], default_price_id: null })
    }

    const stripe = getStripeServer()

    // Obtener detalles del producto y lista de precios
    const [product, stripePrices, subsRes] = await Promise.all([
      stripe.products.retrieve(plan.stripe_product_id),
      stripe.prices.list({
        product: plan.stripe_product_id,
        limit: 50,
      }),
      supabaseAdmin
        .from("subscriptions")
        .select("stripe_price_id, status")
        .eq("status", "active"),
    ])

    const defaultPriceId = typeof product.default_price === "string" 
      ? product.default_price 
      : product.default_price?.id || null

    const subsByPrice = (subsRes.data || []).reduce((acc: Record<string, number>, s) => {
      if (s.stripe_price_id) {
        acc[s.stripe_price_id] = (acc[s.stripe_price_id] || 0) + 1
      }
      return acc
    }, {})

    // Ordenar: el precio predeterminado primero, luego por fecha de creación desc
    const sortedPrices = [...stripePrices.data].sort((a, b) => {
      if (a.id === defaultPriceId) return -1
      if (b.id === defaultPriceId) return 1
      return b.created - a.created
    })

    const formattedPrices = sortedPrices.map((p) => {
      return {
        id: p.id,
        unit_amount: p.unit_amount || 0,
        amount: (p.unit_amount || 0) / 100,
        currency: p.currency.toUpperCase(),
        type: p.type, // "recurring" | "one_time"
        interval: p.recurring?.interval || null,
        interval_count: p.recurring?.interval_count || 1,
        nickname: p.nickname || "",
        lookup_key: p.lookup_key || "",
        active: Boolean(p.active),
        created: p.created,
        is_default: p.id === defaultPriceId,
        tax_behavior: p.tax_behavior || "exclusive",
        subscriptions_count: subsByPrice[p.id] || 0,
      }
    })

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        default_price_id: defaultPriceId,
        active: product.active,
      },
      prices: formattedPrices,
    })
  } catch (err: any) {
    console.error("Error fetching plan prices:", err)
    return NextResponse.json({ error: err.message || "Error al obtener precios" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      plan_id,
      amount,
      currency = "mxn",
      type = "recurring", // "recurring" | "one_time"
      recurring_interval = "month", // "day" | "week" | "month" | "year"
      recurring_interval_count = 1,
      tax_behavior = "exclusive", // Los precios no incluyen IVA
      description,
      lookup_key,
      set_as_default = false,
    } = body

    if (!plan_id || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "plan_id y monto válido mayor a 0 son requeridos" }, { status: 400 })
    }

    const { data: plan, error: planErr } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .single()

    if (planErr || !plan || !plan.stripe_product_id) {
      return NextResponse.json({ error: "Plan o Producto de Stripe no encontrado" }, { status: 404 })
    }

    const stripe = getStripeServer()

    const priceParams: any = {
      product: plan.stripe_product_id,
      unit_amount: Math.round(Number(amount) * 100),
      currency: currency.toLowerCase(),
      tax_behavior: "exclusive", // Sin IVA incluido en el precio base
      nickname: description ? description.trim() : undefined,
      metadata: {
        plan_id,
        iva_included: "false",
        created_from: "kinexting_admin_dynamic_pricing",
      },
    }

    if (lookup_key && lookup_key.trim()) {
      priceParams.lookup_key = lookup_key.trim()
    }

    if (type === "recurring") {
      priceParams.recurring = {
        interval: recurring_interval,
        interval_count: Number(recurring_interval_count) || 1,
      }
    }

    const createdPrice = await stripe.prices.create(priceParams)

    // Si se solicitó como predeterminado o es el primer precio
    if (set_as_default) {
      await stripe.products.update(plan.stripe_product_id, {
        default_price: createdPrice.id,
      })
    }

    // Actualizar Supabase con los precios canónicos del plan
    const updates: any = { updated_at: new Date().toISOString() }
    if (type === "recurring" && recurring_interval === "month" && Number(recurring_interval_count) === 3) {
      updates.stripe_quarterly_price_id = createdPrice.id
      updates.price_quarterly_mxn = Number(amount)
    } else if (type === "recurring" && recurring_interval === "year" && Number(recurring_interval_count) === 1) {
      updates.stripe_annual_price_id = createdPrice.id
      updates.price_annual_mxn = Number(amount)
    }

    if (set_as_default && type === "recurring") {
      if (recurring_interval === "month" && Number(recurring_interval_count) === 3) {
        updates.price_quarterly_mxn = Number(amount)
        updates.stripe_quarterly_price_id = createdPrice.id
      }
    }

    await supabaseAdmin.from("plans").update(updates).eq("id", plan_id)

    await supabaseAdmin.from("audit_logs").insert({
      actor_email: "angelpordiez@gmail.com",
      action: "STRIPE_PRICE_CREATED",
      details: {
        plan_id,
        price_id: createdPrice.id,
        amount: Number(amount),
        currency,
        type,
        recurring_interval,
        recurring_interval_count,
        set_as_default,
        lookup_key,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Precio de $${Number(amount).toLocaleString("es-MX")} ${currency.toUpperCase()} creado exitosamente en Stripe`,
      price: createdPrice,
    })
  } catch (err: any) {
    console.error("Error creating price in Stripe:", err)
    return NextResponse.json({ error: err.message || "Error al crear precio en Stripe" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { action, price_id, plan_id, description, lookup_key } = body

    if (!price_id) {
      return NextResponse.json({ error: "price_id es requerido" }, { status: 400 })
    }

    const stripe = getStripeServer()

    // 1. Establecer como precio predeterminado
    if (action === "set_default") {
      if (!plan_id) return NextResponse.json({ error: "plan_id es requerido" }, { status: 400 })

      const { data: plan } = await supabaseAdmin.from("plans").select("*").eq("id", plan_id).single()
      if (!plan || !plan.stripe_product_id) {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
      }

      await stripe.products.update(plan.stripe_product_id, {
        default_price: price_id,
      })

      // Obtener el precio para actualizar la base de datos de Supabase si aplica
      const targetPrice = await stripe.prices.retrieve(price_id)
      const amt = (targetPrice.unit_amount || 0) / 100

      const updates: any = { updated_at: new Date().toISOString() }
      if (targetPrice.recurring?.interval === "month" && targetPrice.recurring?.interval_count === 3) {
        updates.stripe_quarterly_price_id = targetPrice.id
        updates.price_quarterly_mxn = amt
      } else if (targetPrice.recurring?.interval === "year" && targetPrice.recurring?.interval_count === 1) {
        updates.stripe_annual_price_id = targetPrice.id
        updates.price_annual_mxn = amt
      }

      if (Object.keys(updates).length > 1) {
        await supabaseAdmin.from("plans").update(updates).eq("id", plan_id)
      }

      await supabaseAdmin.from("audit_logs").insert({
        actor_email: "angelpordiez@gmail.com",
        action: "STRIPE_DEFAULT_PRICE_UPDATED",
        details: { plan_id, price_id, amount: amt },
      })

      return NextResponse.json({
        success: true,
        message: "Precio configurado como predeterminado en Stripe y Supabase",
      })
    }

    // 2. Archivar precio
    if (action === "archive") {
      const updated = await stripe.prices.update(price_id, { active: false })
      return NextResponse.json({
        success: true,
        message: "Precio archivado exitosamente en Stripe",
        price: updated,
      })
    }

    // 3. Reactivar precio
    if (action === "activate") {
      const updated = await stripe.prices.update(price_id, { active: true })
      return NextResponse.json({
        success: true,
        message: "Precio reactivado en Stripe",
        price: updated,
      })
    }

    // 4. Editar metadatos del precio
    if (action === "edit_meta") {
      const updateData: any = {}
      if (description !== undefined) updateData.nickname = description.trim()
      if (lookup_key !== undefined) updateData.lookup_key = lookup_key.trim() || undefined

      const updated = await stripe.prices.update(price_id, updateData)
      return NextResponse.json({
        success: true,
        message: "Metadatos del precio actualizados en Stripe",
        price: updated,
      })
    }

    // 5. Crear enlace de pago Stripe
    if (action === "create_payment_link") {
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: price_id, quantity: 1 }],
      })

      return NextResponse.json({
        success: true,
        message: "Enlace de pago generado con éxito",
        url: paymentLink.url,
      })
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 })
  } catch (err: any) {
    console.error("Error modifying price in Stripe:", err)
    return NextResponse.json({ error: err.message || "Error al modificar precio" }, { status: 500 })
  }
}
