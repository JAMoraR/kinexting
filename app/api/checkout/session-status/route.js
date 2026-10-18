import { NextResponse } from "next/server"
import { Stripe } from "stripe"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({ error: "Falta el parámetro session_id" }, { status: 400 })
    }

    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: "Falta STRIPE_SECRET_KEY en el servidor" }, { status: 500 })
    }

    const stripe = new Stripe(secretKey)

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer"],
    })

    const customerObj = session.customer && typeof session.customer !== "string" ? session.customer : null

    return NextResponse.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email || customerObj?.email || "",
      customer_name: session.customer_details?.name || customerObj?.name || "",
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: session.metadata || {},
      created: session.created,
    })
  } catch (error) {
    console.error("Error al consultar sesión de Stripe:", error)
    const message = process.env.NODE_ENV !== "production" && error instanceof Error ? error.message : "No fue posible consultar la sesión de pago"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
