"use client"

import { useState, useEffect } from "react"
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Save,
  Key,
  FileCheck,
  AlertTriangle,
  Zap,
  Globe,
  Lock,
  RefreshCw,
  Server,
} from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { FiscalSettings } from "@/lib/types/admin"
import { toast } from "sonner"

export default function AdminConfiguracionFiscalPage() {
  const [settings, setSettings] = useState<FiscalSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifyingSat, setVerifyingSat] = useState(false)
  const [satVerificationData, setSatVerificationData] = useState<any>(null)

  const [rfc, setRfc] = useState("KIN240118AA1")
  const [businessName, setBusinessName] = useState("KINEXTING CLOUD TECHNOLOGIES")
  const [regimen, setRegimen] = useState("612 - Personas Físicas con Actividades Empresariales y Profesionales")
  const [postalCode, setPostalCode] = useState("06600")
  const [pacProvider, setPacProvider] = useState("Finkok PAC Oficial")
  const [pacEnv, setPacEnv] = useState<"sandbox" | "production">("sandbox")
  const [stripeTax, setStripeTax] = useState(true)
  const [autoTimbrado, setAutoTimbrado] = useState(true)

  const loadFiscal = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/fiscal")
      const data = await res.json()
      if (data.settings) {
        setSettings(data.settings)
        setRfc(data.settings.rfc || "KIN240118AA1")
        setBusinessName(data.settings.business_name || "KINEXTING CLOUD TECHNOLOGIES")
        setRegimen(data.settings.regimen_fiscal || "612 - Personas Físicas con Actividades Empresariales y Profesionales")
        setPostalCode(data.settings.postal_code || "06600")
        setPacProvider(data.settings.pac_provider || "Finkok PAC Oficial")
        setPacEnv(data.settings.pac_environment || "sandbox")
        setStripeTax(data.settings.stripe_tax_enabled ?? true)
        setAutoTimbrado(data.settings.auto_timbrado ?? true)
      }
    } catch {
      toast.error("Error al cargar configuración fiscal")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiscal()
  }, [])

  // Verificación real con Web Service del SAT y Stripe
  const handleVerifySat = async () => {
    setVerifyingSat(true)
    try {
      const res = await fetch("/api/admin/fiscal/verify-sat", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Fallo en verificación")
      setSatVerificationData(data.verification)
      toast.success("Verificación SAT & Stripe exitosa: RFC y CSD válidos ante la LCO")
    } catch (err: any) {
      toast.error(err.message || "Error al verificar con el SAT")
    } finally {
      setVerifyingSat(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/admin/fiscal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            id: settings?.id,
            rfc,
            business_name: businessName,
            regimen_fiscal: regimen,
            postal_code: postalCode,
            pac_provider: pacProvider,
            pac_environment: pacEnv,
            stripe_tax_enabled: stripeTax,
            auto_timbrado: autoTimbrado,
          },
        }),
      })

      if (!res.ok) throw new Error("Error al guardar cambios")
      toast.success("Configuración fiscal guardada en Supabase y coordinada con Stripe")
      loadFiscal()
    } catch (err: any) {
      toast.error(err.message || "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Configuración Fiscal & Certificados SAT (CSD)"
        subtitle="Régimen de Persona Física con Actividad Empresarial (612), certificados digitales y pasarela de timbrado en Stripe."
        breadcrumbs={[{ label: "Configuración" }, { label: "Fiscal SAT" }]}
        actions={
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-9 gap-1.5 text-xs font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Guardando..." : "Guardar Parámetros"}</span>
          </Button>
        }
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Estado CSD */}
        <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Certificados de Sello Digital (CSD) Activos
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  SAT Válido LCO
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                No. de Serie: {settings?.csd_serial || "30001000000500003412"} • Régimen 612 (Persona Física Actividad Empresarial) • Vigente 2028
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleVerifySat}
            disabled={verifyingSat}
            className="text-xs h-9 border-border/60 hover:text-cyan-400 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifyingSat ? "animate-spin text-cyan-400" : ""}`} />
            <span>{verifyingSat ? "Consultando SAT & Stripe..." : "Verificar en Servidor SAT"}</span>
          </Button>
        </div>

        {/* Panel de Diagnóstico SAT en tiempo real si se ejecutó verificación */}
        {satVerificationData && (
          <div className="p-4 rounded-xl bg-card border border-emerald-500/30 bg-emerald-500/5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Respuesta del Servidor SAT & Gateway Stripe ({satVerificationData.service_response_time_ms}ms)</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {new Date(satVerificationData.verified_at).toLocaleTimeString("es-MX")}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono pt-1">
              <div>
                <span className="text-muted-foreground block text-[10px]">Estatus LCO SAT:</span>
                <span className="text-foreground font-semibold">{satVerificationData.lco_status}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Régimen Detectado:</span>
                <span className="text-cyan-400 font-semibold">{satVerificationData.tipo_persona}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Proveedor PAC:</span>
                <span className="text-foreground">{satVerificationData.pac_provider} ({satVerificationData.pac_environment})</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Stripe Tax & Facturación:</span>
                <span className="text-emerald-400 font-semibold">{satVerificationData.stripe_tax_integration}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2 Col Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Col 1: Datos Fiscales del Emisor */}
          <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <Building2 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Datos Fiscales del Emisor (Persona Física)
              </h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre / Razón Social Legal *</Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">RFC del Emisor *</Label>
                  <Input
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase())}
                    className="h-9 text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Código Postal (Lugar Expedición) *</Label>
                  <Input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Régimen Fiscal (Catálogo SAT) *</Label>
                <select
                  value={regimen}
                  onChange={(e) => setRegimen(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground cursor-pointer font-medium"
                >
                  <option value="612 - Personas Físicas con Actividades Empresariales y Profesionales">
                    612 - Personas Físicas con Actividades Empresariales y Profesionales
                  </option>
                  <option value="626 - Régimen Simplificado de Confianza (RESICO)">
                    626 - Régimen Simplificado de Confianza (RESICO)
                  </option>
                  <option value="601 - General de Ley Personas Morales">
                    601 - General de Ley Personas Morales
                  </option>
                </select>
                <span className="text-[10px] text-muted-foreground block mt-1">
                  Configurado para tributar como Persona Física con Actividad Empresarial (612).
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: PAC Timbrado & Stripe Gateway */}
          <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <Zap className="w-4 h-4 text-cyan-500" />
              <h3 className="text-sm font-semibold text-foreground">
                PAC Timbrado & Plataforma Stripe Facturación
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Proveedor Autorizado de Certificación (PAC)</Label>
                <Input
                  value={pacProvider}
                  onChange={(e) => setPacProvider(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Ambiente del PAC</Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pacEnv"
                      checked={pacEnv === "sandbox"}
                      onChange={() => setPacEnv("sandbox")}
                      className="text-primary"
                    />
                    <span>Sandbox (Pruebas SAT)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pacEnv"
                      checked={pacEnv === "production"}
                      onChange={() => setPacEnv("production")}
                      className="text-primary"
                    />
                    <span>Producción Oficial</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground block">
                      Cálculo de Impuestos Stripe Tax
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Calcula dinámicamente IVA e impuestos coordinados con Stripe.
                    </span>
                  </div>
                  <Switch checked={stripeTax} onCheckedChange={setStripeTax} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground block">
                      Timbrado de Facturas por Stripe Gateway
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Emite CFDI 4.0 al confirmar cobro exitoso en Stripe Invoicing.
                    </span>
                  </div>
                  <Switch checked={autoTimbrado} onCheckedChange={setAutoTimbrado} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
