"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Loader2, LockKeyhole } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { waitlistSchema } from "@/lib/waitlist"

export default function WaitlistForm() {
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setError("")
    const data = new FormData(event.currentTarget)
    const values = { email: String(data.get("email") || ""), whatsapp: String(data.get("whatsapp") || ""), consent: data.get("consent") === "on", website: String(data.get("website") || "") }
    const parsed = waitlistSchema.safeParse(values)
    if (!parsed.success) { setError(parsed.error.issues[0].message); return }
    setPending(true)
    try {
      const response = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "No pudimos guardar tu registro.")
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revisa tu conexión e inténtalo de nuevo.")
    } finally { setPending(false) }
  }

  if (success) return <div role="status" className="py-10 text-center"><CheckCircle2 className="mx-auto mb-5 h-12 w-12 text-emerald-600 dark:text-emerald-400" /><h3 className="text-2xl font-bold">¡Ya estás en la lista!</h3><p className="mt-3 text-muted-foreground">Si tus datos ya estaban registrados, tu lugar sigue reservado. Te avisaremos cuando el Plan gestor esté listo y te contaremos cómo activar tu beneficio.</p><p className="mt-5 text-sm font-medium text-indigo-600 dark:text-cyan-400">Tu negocio está a un paso de su siguiente etapa.</p></div>

  return <form onSubmit={submit} className="space-y-5" aria-label="Registro a la lista de espera" noValidate>
    <div><Label htmlFor="waitlist-email">Correo electrónico</Label><Input id="waitlist-email" name="email" type="email" autoComplete="email" maxLength={254} placeholder="tu@negocio.com" className="mt-2 h-12" aria-describedby="contact-help" /></div>
    <div><Label htmlFor="waitlist-whatsapp">Número de WhatsApp</Label><Input id="waitlist-whatsapp" name="whatsapp" type="tel" autoComplete="tel" maxLength={40} placeholder="+52 998 123 4567" className="mt-2 h-12" aria-describedby="contact-help phone-help" /><p id="phone-help" className="mt-2 text-xs text-muted-foreground">Incluye + y el código de tu país.</p></div>
    <p id="contact-help" className="text-sm text-muted-foreground">Déjanos tu correo, tu WhatsApp o ambos. Tú eliges.</p>
    <div className="hidden" aria-hidden="true"><label htmlFor="website">Sitio web</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
    <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"><input type="checkbox" name="consent" className="mt-1 h-4 w-4 shrink-0 accent-indigo-600" /><span>Acepto el <Link href="/legal/privacidad" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4">aviso de privacidad</Link> y recibir información sobre el lanzamiento y el beneficio del Plan gestor por los medios que proporcioné.</span></label>
    {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    <Button disabled={pending} type="submit" className="h-12 w-full bg-indigo-600 text-base text-white hover:bg-indigo-700 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300">{pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando tu lugar…</> : <>Quiero estar en la lista<ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
    <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" />Sin pago ni compromiso de suscripción.</p>
  </form>
}
