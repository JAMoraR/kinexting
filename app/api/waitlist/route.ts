import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { waitlistSchema } from "@/lib/waitlist"

export async function POST(request: Request) {
  const origin = request.headers.get("origin")
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 })
  }
  if (Number(request.headers.get("content-length")) > 4096) {
    return NextResponse.json({ error: "Solicitud demasiado grande." }, { status: 413 })
  }
  let body: unknown
  try {
    const raw = await request.text()
    if (raw.length > 4096) return NextResponse.json({ error: "Solicitud demasiado grande." }, { status: 413 })
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 })
  }
  const parsed = waitlistSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  if (parsed.data.website) return NextResponse.json({ success: true })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: "El registro no está disponible por el momento. Inténtalo más tarde." }, { status: 503 })
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await supabase.from("plan_gestor_waitlist").insert({
    email: parsed.data.email || null,
    whatsapp: parsed.data.whatsapp || null,
    consent_version: "waitlist-v1",
  })
  // No revelamos si un contacto ya está registrado ni modificamos sus datos sin verificarlo.
  if (error && error.code !== "23505") {
    console.error("Waitlist insert failed:", error.code)
    return NextResponse.json({ error: "No pudimos guardar tu registro. Inténtalo de nuevo." }, { status: 503 })
  }
  return NextResponse.json({ success: true })
}
