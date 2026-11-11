import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const { data: settings } = await supabaseAdmin.from("fiscal_settings").select("*").limit(1).single()
    const { data: taxRules } = await supabaseAdmin.from("tax_rules").select("*").order("rate", { ascending: false })

    return NextResponse.json({
      settings: settings || null,
      taxRules: taxRules || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al obtener configuración fiscal" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { settings, taxRuleUpdate } = body

    if (settings) {
      const { id, ...updates } = settings
      updates.updated_at = new Date().toISOString()
      await supabaseAdmin.from("fiscal_settings").update(updates).eq("id", id)
    }

    if (taxRuleUpdate) {
      const { id, is_active } = taxRuleUpdate
      await supabaseAdmin.from("tax_rules").update({ is_active }).eq("id", id)
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_email: "angelpordiez@gmail.com",
      action: "FISCAL_CONFIG_UPDATED",
      details: { timestamp: new Date().toISOString() },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al actualizar configuración" }, { status: 500 })
  }
}
