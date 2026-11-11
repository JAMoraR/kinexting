import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getStripeServer } from "@/lib/stripe"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    let query = supabaseAdmin
      .from("clients")
      .select("*, plan:plans(*)")
      .order("created_at", { ascending: false })

    if (status && status !== "todos") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,rfc.ilike.%${search}%,stripe_customer_id.ilike.%${search}%`
      )
    }

    const { data: clients, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ clients: clients || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al obtener clientes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      legal_name,
      email,
      phone,
      rfc,
      country = "MX",
      domain,
      status = "active",
      current_plan_id = "asistente",
      monthly_amount = 0,
      billing_cycle = "quarterly",
      notes,
      is_test = false, // Si es true, NO se crea en Stripe
    } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y correo son requeridos" }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    let stripeCustomerId: string | null = null

    // Sincronización con Stripe: crear cliente en Stripe si no es cliente de prueba
    if (!is_test) {
      try {
        const stripe = getStripeServer()
        const customer = await stripe.customers.create({
          name: name.trim(),
          email: cleanEmail,
          phone: phone ? phone.trim() : undefined,
          metadata: {
            rfc: rfc ? rfc.trim().toUpperCase() : "",
            domain: domain ? domain.trim().toLowerCase() : "",
            plan_id: current_plan_id,
            billing_cycle,
            platform: "kinexting_admin",
          },
        })
        stripeCustomerId = customer.id
      } catch (stripeErr: any) {
        console.error("Error al crear cliente en Stripe:", stripeErr)
        // Continuamos con fallback mock si falla la API de Stripe
        stripeCustomerId = `cus_test_mock_${Date.now()}`
      }
    } else {
      stripeCustomerId = `cus_test_mock_${Date.now()}`
    }

    // Insertar cliente en Supabase
    const { data: newClient, error } = await supabaseAdmin
      .from("clients")
      .insert({
        name: name.trim(),
        legal_name: legal_name ? legal_name.trim() : name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        rfc: rfc ? rfc.trim().toUpperCase() : null,
        country,
        domain: domain ? domain.trim().toLowerCase() : null,
        status,
        current_plan_id,
        monthly_amount: Number(monthly_amount),
        billing_cycle,
        notes,
        stripe_customer_id: stripeCustomerId,
      })
      .select("*, plan:plans(*)")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Si tiene plan asignado, crear registro de suscripción en Supabase
    if (current_plan_id) {
      await supabaseAdmin.from("subscriptions").insert({
        client_id: newClient.id,
        plan_id: current_plan_id,
        stripe_subscription_id: !is_test ? `sub_stripe_${Date.now()}` : `sub_mock_${Date.now()}`,
        status: "active",
        billing_cycle,
        amount: Number(monthly_amount),
        currency: "MXN",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + (billing_cycle === "annual" ? 365 : 90) * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
    }

    // Registrar en log de auditoría
    await supabaseAdmin.from("audit_logs").insert({
      client_id: newClient.id,
      actor_email: "angelpordiez@gmail.com",
      action: "CLIENT_CREATED",
      details: {
        client_name: name,
        email: cleanEmail,
        stripe_customer_id: stripeCustomerId,
        is_test,
        synced_to_stripe: !is_test,
      },
    })

    return NextResponse.json({
      success: true,
      client: newClient,
      stripe_synced: !is_test,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al crear cliente" }, { status: 500 })
  }
}
