import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getStripeServer } from "@/lib/stripe"

export async function POST() {
  try {
    const stripe = getStripeServer()
    const customersRes = await stripe.customers.list({ limit: 50 })
    const customers = customersRes.data

    let importedCount = 0

    for (const c of customers) {
      if (!c.email) continue

      // Verificar si ya existe en Supabase
      const { data: existing } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("email", c.email.toLowerCase())
        .single()

      if (!existing) {
        await supabaseAdmin.from("clients").insert({
          name: c.name || c.email.split("@")[0],
          legal_name: c.name || null,
          email: c.email.toLowerCase(),
          phone: c.phone || null,
          rfc: (c.metadata?.rfc as string) || null,
          country: "MX",
          domain: (c.metadata?.domain as string) || null,
          status: "active",
          current_plan_id: (c.metadata?.plan_id as string) || "asistente",
          monthly_amount: 614,
          billing_cycle: (c.metadata?.billing_cycle as any) || "quarterly",
          stripe_customer_id: c.id,
        })
        importedCount++
      } else {
        // Actualizar stripe_customer_id si no lo tenía
        await supabaseAdmin
          .from("clients")
          .update({ stripe_customer_id: c.id })
          .eq("id", existing.id)
      }
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_email: "angelpordiez@gmail.com",
      action: "STRIPE_CUSTOMERS_SYNCED",
      details: { total_stripe: customers.length, imported: importedCount },
    })

    return NextResponse.json({
      success: true,
      message: `Clientes de Stripe sincronizados con Supabase (${importedCount} nuevos importados)`,
      total_in_stripe: customers.length,
      imported: importedCount,
    })
  } catch (err: any) {
    console.error("Error syncing customers from Stripe:", err)
    return NextResponse.json({ error: err.message || "Error al sincronizar clientes" }, { status: 500 })
  }
}
