"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Zap, ShieldCheck, Mail, Lock, ArrowRight, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import ThemeToggle from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Forgot password dialog state
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        throw new Error(error.message || "Credenciales incorrectas")
      }

      if (data.user) {
        // Guardar indicador de sesión local
        localStorage.setItem("kinexting_admin_session", JSON.stringify({
          userId: data.user.id,
          email: data.user.email,
          role: "admin",
          timestamp: Date.now(),
        }))

        toast.success("Acceso autorizado. Bienvenido, Ángel.")
        window.location.href = "/admin/clientes"
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setErrorMsg(err.message || "Error al autenticar con Supabase")
      toast.error(err.message || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "No se pudo enviar el correo de recuperación")
      }

      setResetSuccess(true)
      toast.success("Correo de restablecimiento enviado con éxito")
    } catch (err: any) {
      toast.error(err.message || "Error al enviar solicitud")
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-primary group-hover:border-primary transition-colors">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-sm text-foreground">Kinexting</span>
        </Link>
        <ThemeToggle />
      </div>

      <Card className="border-border/60 bg-card/80 backdrop-blur-md shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-primary/10 text-primary border border-primary/20">
                Acceso Admin
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Supabase Auth
              </span>
            </div>
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Command Center Login
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Ingresa con tus credenciales de administrador para gestionar la flota de clientes, planes de Stripe y facturación SAT.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-0">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium">
                Correo Electrónico
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kinexting.com"
                  required
                  className="pl-9 h-10 text-sm bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium">
                  Contraseña
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setResetSuccess(false)
                    setResetDialogOpen(true)
                  }}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="pl-9 h-10 text-sm bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  <span>Verificando acceso...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Acceder al Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>

            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
            >
              ← Regresar al sitio principal
            </Link>
          </CardFooter>
        </form>
      </Card>

      {/* Forgot Password Modal */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md border-border/60 bg-card">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
              <KeyRound className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Restablecer Contraseña vía Supabase
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enviaremos un correo seguro mediante el servicio de autenticación de Supabase con un enlace directo para actualizar tu clave de acceso.
            </DialogDescription>
          </DialogHeader>

          {resetSuccess ? (
            <div className="py-4 space-y-3">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block font-semibold">Correo enviado con éxito</strong>
                  <p>
                    Revisa la bandeja de entrada de <strong>{resetEmail}</strong> (y la carpeta de spam si es necesario). Haz clic en el enlace para asignar una nueva contraseña.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setResetDialogOpen(false)}
                className="w-full text-xs"
              >
                Cerrar y volver al login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-xs font-medium">
                  Correo registrado
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="angelpordiez@gmail.com"
                    required
                    className="pl-9 h-10 text-sm bg-background border-border/60"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetDialogOpen(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={resetLoading} className="text-xs font-semibold">
                  {resetLoading ? "Enviando correo..." : "Enviar enlace de recuperación"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
