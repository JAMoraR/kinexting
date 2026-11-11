"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Zap, KeyRound, Lock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import ThemeToggle from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        throw new Error(error.message || "Error al actualizar la contraseña")
      }

      setIsSuccess(true)
      toast.success("Contraseña actualizada con éxito en Supabase")
    } catch (err: any) {
      console.error("Update password error:", err)
      setErrorMsg(err.message || "Error al actualizar la contraseña")
      toast.error(err.message || "Error al actualizar")
    } finally {
      setLoading(false)
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
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
            <KeyRound className="w-5 h-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Asignar Nueva Contraseña
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Ingresa tu nueva contraseña para acceder al panel de administración de Kinexting.
          </CardDescription>
        </CardHeader>

        {isSuccess ? (
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">¡Contraseña restablecida!</strong>
                <p>Tu clave ha sido actualizada en la base de datos de Supabase. Ya puedes iniciar sesión con tu nueva contraseña.</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/admin/login")}
              className="w-full text-xs font-semibold"
            >
              Ir a Iniciar Sesión
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <CardContent className="space-y-4 pt-0">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium">
                  Nueva Contraseña
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="pl-9 h-10 text-sm bg-background border-border/60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-xs font-medium">
                  Confirmar Contraseña
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    required
                    className="pl-9 h-10 text-sm bg-background border-border/60"
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
                {loading ? "Guardando en Supabase..." : "Guardar Nueva Contraseña"}
              </Button>
              <Link
                href="/admin/login"
                className="text-xs text-muted-foreground hover:text-foreground text-center"
              >
                Volver al login
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
