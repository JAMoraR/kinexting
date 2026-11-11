import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("currency_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle()

    if (error) {
      console.error("[CURRENCY_GET_ERROR]", error)
      return NextResponse.json({
        exchange_rate_usd: 20.00,
        exchange_rate_eur: 21.40,
      })
    }

    return NextResponse.json({
      exchange_rate_usd: Number(data?.exchange_rate_usd) || 20.00,
      exchange_rate_eur: Number(data?.exchange_rate_eur) || 21.40,
      updated_at: data?.updated_at || null,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al obtener tipos de cambio" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawUsd = parseFloat(body.exchange_rate_usd)
    const rawEur = parseFloat(body.exchange_rate_eur)
    const planId = body.plan_id ? String(body.plan_id).trim() : null

    if (isNaN(rawUsd) || rawUsd <= 0 || isNaN(rawEur) || rawEur <= 0) {
      return NextResponse.json(
        { error: "Los tipos de cambio deben ser valores numéricos positivos con hasta 2 decimales" },
        { status: 400 }
      )
    }

    const safeUsd = Math.round(rawUsd * 100) / 100
    const safeEur = Math.round(rawEur * 100) / 100

    // 1. Guardar en base de datos para presupuestos futuros (tabla currency_settings)
    const { error: upsertErr } = await supabaseAdmin
      .from("currency_settings")
      .upsert(
        {
          id: "default",
          exchange_rate_usd: safeUsd,
          exchange_rate_eur: safeEur,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )

    if (upsertErr) {
      console.error("[CURRENCY_UPSERT_ERROR]", upsertErr)
      return NextResponse.json(
        { error: `Error al guardar divisas: ${upsertErr.message}` },
        { status: 500 }
      )
    }

    let updatedPlanData = null

    // 2. Si hay un presupuesto/plan abierto, actualizar sus ciclos e ítems en la BD
    if (planId) {
      const { data: plan, error: planErr } = await supabaseAdmin
        .from("plans")
        .select("*")
        .eq("id", planId)
        .maybeSingle()

      if (!planErr && plan && plan.budget_breakdown) {
        const bb = { ...plan.budget_breakdown }
        for (const cycleKey of ["quarterly", "annual"]) {
          if (bb[cycleKey]) {
            bb[cycleKey].exchange_rate_usd = safeUsd
            bb[cycleKey].exchange_rate_eur = safeEur
            if (Array.isArray(bb[cycleKey].items)) {
              bb[cycleKey].items = bb[cycleKey].items.map((it: any) => ({
                ...it,
                amount_usd: Math.round((Number(it.amount_mxn || 0) / safeUsd) * 100) / 100,
                amount_eur: Math.round((Number(it.amount_mxn || 0) / safeEur) * 100) / 100,
              }))
            }
          }
        }

        const { data: savedPlan, error: savePlanErr } = await supabaseAdmin
          .from("plans")
          .update({
            budget_breakdown: bb,
            updated_at: new Date().toISOString(),
          })
          .eq("id", planId)
          .select()
          .single()

        if (!savePlanErr) {
          updatedPlanData = savedPlan
        }
      }
    }

    // 3. Registrar en audit logs
    try {
      await supabaseAdmin.from("audit_logs").insert({
        actor_email: "angelpordiez@gmail.com",
        action: "CURRENCY_RATES_UPDATED",
        details: {
          exchange_rate_usd: safeUsd,
          exchange_rate_eur: safeEur,
          plan_id: planId || "global",
          timestamp: new Date().toISOString(),
        },
      })
    } catch {
      // Ignorar fallo de audit log
    }

    return NextResponse.json({
      success: true,
      exchange_rate_usd: safeUsd,
      exchange_rate_eur: safeEur,
      plan_id: planId,
      updated_plan: updatedPlanData,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al actualizar tipos de cambio" },
      { status: 500 }
    )
  }
}
