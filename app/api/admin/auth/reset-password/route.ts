import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "El correo electrónico es requerido" }, { status: 400 })
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://www.kinexting.com"
    const redirectTo = `${origin}/admin/reset-password`

    const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    })

    if (error) {
      console.error("Error al enviar correo de recuperación:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Registrar en log de auditoría
    await supabaseAdmin.from("audit_logs").insert({
      actor_email: email,
      action: "PASSWORD_RESET_REQUESTED",
      details: { email, redirectTo, timestamp: new Date().toISOString() },
    })

    return NextResponse.json({
      success: true,
      message: "Se ha enviado el enlace de restablecimiento a tu correo electrónico vía Supabase.",
      data,
    })
  } catch (err: any) {
    console.error("Error en reset-password route:", err)
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 })
  }
}
