import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getStripeServer } from "@/lib/stripe"
import { PlanBudgetBreakdown } from "@/lib/types/admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get("plan_id")

    if (planId) {
      const { data: plan, error } = await supabaseAdmin
        .from("plans")
        .select("id, name, category, price_quarterly_mxn, price_annual_mxn, budget_breakdown, stripe_product_id, is_active")
        .eq("id", planId)
        .single()

      if (error || !plan) {
        return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
      }

      return NextResponse.json({ success: true, plan })
    }

    // Retorna todos los planes con sus presupuestos
    const { data: plans, error } = await supabaseAdmin
      .from("plans")
      .select("id, name, category, price_quarterly_mxn, price_annual_mxn, budget_breakdown, stripe_product_id, is_active")
      .order("is_active", { ascending: false })
      .order("price_quarterly_mxn", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, plans: plans || [] })
  } catch (err: any) {
    console.error("Error fetching budget breakdowns:", err)
    return NextResponse.json({ error: err.message || "Error al obtener presupuestos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      plan_id,
      cycle = "quarterly", // "quarterly" | "annual"
      budget_breakdown,
      sync_stripe_price = false,
      confirmed = false, // Segunda confirmación
    } = body

    if (!plan_id || !budget_breakdown) {
      return NextResponse.json({ error: "plan_id y budget_breakdown son requeridos" }, { status: 400 })
    }

    const { data: currentPlan, error: fetchErr } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .single()

    if (fetchErr || !currentPlan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    // Actualizar objeto de desglose presupuestario en Supabase
    const updatedBudget: PlanBudgetBreakdown = {
      ...(currentPlan.budget_breakdown || {}),
      ...budget_breakdown,
    }

    const cycleData = budget_breakdown[cycle] || updatedBudget[cycle]
    const targetPriceMxn = Number(cycleData?.target_price_mxn)

    const updates: any = {
      budget_breakdown: updatedBudget,
      updated_at: new Date().toISOString(),
    }

    let updatedStripePriceId: string | null = null

    // Si se solicitó sincronizar precio con Stripe y pasó la segunda confirmación
    if (sync_stripe_price && confirmed && targetPriceMxn && targetPriceMxn > 0 && currentPlan.stripe_product_id) {
      const stripe = getStripeServer()

      const interval = cycle === "annual" ? "year" : "month"
      const intervalCount = cycle === "annual" ? 1 : 3

      // Crear nuevo precio en Stripe con el monto recalculado
      const newStripePrice = await stripe.prices.create({
        product: currentPlan.stripe_product_id,
        unit_amount: Math.round(targetPriceMxn * 100),
        currency: "mxn",
        tax_behavior: "exclusive",
        recurring: {
          interval,
          interval_count: intervalCount,
        },
        nickname: `Cuota ${cycle === "annual" ? "anual" : "trimestral"} ${currentPlan.name} (Presupuesto)`,
        lookup_key: `kinexting_${plan_id}_${cycle}_budget_${Date.now()}`,
        metadata: {
          plan_id,
          cycle,
          source: "budget_breakdown_sync",
        },
      })

      updatedStripePriceId = newStripePrice.id

      // Si es trimestral o el plan no tiene default, podemos actualizar default_price
      if (cycle === "quarterly") {
        updates.price_quarterly_mxn = targetPriceMxn
        updates.stripe_quarterly_price_id = newStripePrice.id
        await stripe.products.update(currentPlan.stripe_product_id, {
          default_price: newStripePrice.id,
        })
      } else if (cycle === "annual") {
        updates.price_annual_mxn = targetPriceMxn
        updates.stripe_annual_price_id = newStripePrice.id
      }
    } else if (targetPriceMxn && targetPriceMxn > 0) {
      if (cycle === "quarterly") {
        updates.price_quarterly_mxn = targetPriceMxn
      } else if (cycle === "annual") {
        updates.price_annual_mxn = targetPriceMxn
      }
    }

    const { data: updatedPlan, error: updateErr } = await supabaseAdmin
      .from("plans")
      .update(updates)
      .eq("id", plan_id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_email: "angelpordiez@gmail.com",
      action: "PLAN_BUDGET_UPDATED",
      details: {
        plan_id,
        cycle,
        target_price_mxn: targetPriceMxn,
        stripe_synced: Boolean(updatedStripePriceId),
        stripe_price_id: updatedStripePriceId,
      },
    })

    return NextResponse.json({
      success: true,
      message: updatedStripePriceId
        ? `Presupuesto guardado y precio actualizado en Stripe a $${targetPriceMxn.toLocaleString("es-MX")} MXN`
        : "Presupuesto actualizado exitosamente en Supabase",
      plan: updatedPlan,
      stripe_price_id: updatedStripePriceId,
    })
  } catch (err: any) {
    console.error("Error saving plan budget:", err)
    return NextResponse.json({ error: err.message || "Error al guardar presupuesto" }, { status: 500 })
  }
}
