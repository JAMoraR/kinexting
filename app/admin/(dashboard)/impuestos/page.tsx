"use client"

import { useState, useEffect } from "react"
import {
  Percent,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Copy,
  RotateCcw,
  Sliders,
  DollarSign,
  TrendingDown,
  Info,
} from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { TaxRule } from "@/lib/types/admin"
import { toast } from "sonner"

export default function AdminImpuestosPage() {
  const [taxRules, setTaxRules] = useState<TaxRule[]>([])
  const [loading, setLoading] = useState(true)

  // Simulator state
  const [subtotal, setSubtotal] = useState("10000")
  const [regimeType, setRegimeType] = useState<"pm" | "pfae" | "resico">("pm")
  const [applyLocalTax, setApplyLocalTax] = useState(false)

  const loadTaxRules = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/fiscal")
      const data = await res.json()
      if (data.taxRules) {
        setTaxRules(data.taxRules)
      }
    } catch {
      toast.error("Error al cargar reglas fiscales")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTaxRules()
  }, [])

  const handleToggleRule = async (rule: TaxRule) => {
    try {
      const res = await fetch("/api/admin/fiscal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxRuleUpdate: { id: rule.id, is_active: !rule.is_active },
        }),
      })

      if (!res.ok) throw new Error("Error al actualizar regla")
      toast.success(`Regla "${rule.rule_name}" ${!rule.is_active ? "activada" : "desactivada"}`)
      loadTaxRules()
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar")
    }
  }

  // Simulator calculations
  const numSubtotal = Number(subtotal) || 0
  const ivaRate = 0.16
  const ivaAmount = numSubtotal * ivaRate

  // Retenciones según régimen
  let retIvaRate = 0
  let retIsrRate = 0

  if (regimeType === "pfae") {
    retIvaRate = 10.6667 / 100 // Dos terceras partes del 16%
    retIsrRate = 0.10 // 10% ISR
  } else if (regimeType === "resico") {
    retIvaRate = 10.6667 / 100
    retIsrRate = 0.0125 // 1.25% RESICO
  } else {
    // PM a PM tradicional
    retIvaRate = 0
    retIsrRate = 0
  }

  const retIvaAmount = numSubtotal * retIvaRate
  const retIsrAmount = numSubtotal * retIsrRate
  const localTaxAmount = applyLocalTax ? numSubtotal * 0.03 : 0
  const totalNeto = numSubtotal + ivaAmount - retIvaAmount - retIsrAmount + localTaxAmount

  const handleCopyBreakdown = () => {
    const text = `Simulación Fiscal Kinexting:
Subtotal: $${numSubtotal.toLocaleString("es-MX")} MXN
(+) IVA (16%): $${ivaAmount.toFixed(2)} MXN
(-) Retención IVA (${(retIvaRate * 100).toFixed(2)}%): -$${retIvaAmount.toFixed(2)} MXN
(-) Retención ISR (${(retIsrRate * 100).toFixed(2)}%): -$${retIsrAmount.toFixed(2)} MXN
(=) Total Neto: $${totalNeto.toFixed(2)} MXN`
    navigator.clipboard.writeText(text)
    toast.success("Desglose fiscal copiado al portapapeles")
  }

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Retenciones e Impuestos Locales"
        subtitle="Reglas fiscales federales de retención (LIVA / LISR), tasas estatales y simulador en tiempo real."
        breadcrumbs={[{ label: "Fiscal" }, { label: "Impuestos & Retenciones" }]}
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Col 1: Reglas Fiscales Activas */}
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Percent className="w-4 h-4 text-primary" />
                  Reglas de Retención Federal (LIVA / LISR)
                </h3>
                <span className="text-[11px] font-mono text-muted-foreground">SAT Oficial</span>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Cargando reglas fiscales...
                  </p>
                ) : (
                  taxRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-3.5 rounded-lg bg-muted/30 border border-border/40 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground truncate">
                            {rule.rule_name}
                          </span>
                          <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">
                            {Number(rule.rate).toFixed(2)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                          {rule.description}
                        </p>
                      </div>

                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggleRule(rule)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/40 text-xs text-muted-foreground flex items-start gap-3">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-foreground block font-semibold">Criterio Legal Art. 1-A LIVA</strong>
                <p>
                  Cuando una Persona Moral adquiere servicios de plataformas de software prestados por Personas Físicas, debe retenerse dos terceras partes del IVA y el 10% o 1.25% (RESICO) de ISR.
                </p>
              </div>
            </div>
          </div>

          {/* Col 2: Simulador Fiscal Interactivo */}
          <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-500" />
                Simulador Fiscal & Conciliación en Vivo
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyBreakdown}
                className="h-7 px-2 text-[11px] text-primary gap-1"
              >
                <Copy className="w-3 h-3" />
                Copiar Desglose
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs">Monto Subtotal de Servicio (MXN)</Label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="number"
                    value={subtotal}
                    onChange={(e) => setSubtotal(e.target.value)}
                    className="pl-9 h-9 text-sm font-mono"
                    placeholder="10000"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Régimen Fiscal del Receptor / Emisor</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegimeType("pm")}
                    className={`p-2 rounded-lg text-center font-medium transition-colors border ${
                      regimeType === "pm"
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Persona Moral
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegimeType("resico")}
                    className={`p-2 rounded-lg text-center font-medium transition-colors border ${
                      regimeType === "resico"
                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-500"
                        : "bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    RESICO (1.25%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegimeType("pfae")}
                    className={`p-2 rounded-lg text-center font-medium transition-colors border ${
                      regimeType === "pfae"
                        ? "bg-purple-500/10 border-purple-500 text-purple-500"
                        : "bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    PFAE (10%)
                  </button>
                </div>
              </div>

              {/* Resultado del Desglose */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border/50 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal Base:</span>
                  <span className="font-semibold text-foreground">
                    ${numSubtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>(+) IVA Trasladado (16%):</span>
                  <span className="text-cyan-500">
                    +${ivaAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>

                {retIvaAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>(-) Retención LIVA (10.66%):</span>
                    <span className="text-amber-500">
                      -${retIvaAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                    </span>
                  </div>
                )}

                {retIsrAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      (-) Retención LISR ({regimeType === "resico" ? "1.25%" : "10%"}):
                    </span>
                    <span className="text-destructive">
                      -${retIsrAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-border/40 flex justify-between font-bold text-sm text-foreground">
                  <span>Monto Total a Liquidar:</span>
                  <span className="text-emerald-500 font-mono">
                    ${totalNeto.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
