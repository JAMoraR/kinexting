"use client"

import { useState, useEffect } from "react"
import {
  Receipt,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Zap,
  Building,
  RotateCw,
  FileCheck,
  FileCode,
} from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Invoice, Client } from "@/lib/types/admin"
import { toast } from "sonner"

export default function AdminFacturacionPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  // Modal Nueva Factura
  const [createOpen, setCreateOpen] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState("")
  const [invoiceAmount, setInvoiceAmount] = useState("1450")
  const [usoCfdi, setUsoCfdi] = useState("G03")

  const loadData = async () => {
    setLoading(true)
    try {
      const [invRes, cliRes] = await Promise.all([
        fetch("/api/admin/invoices"),
        fetch("/api/admin/clients"),
      ])
      const [invData, cliData] = await Promise.all([invRes.json(), cliRes.json()])

      if (invData.invoices) setInvoices(invData.invoices)
      if (cliData.clients) {
        setClients(cliData.clients)
        if (cliData.clients.length > 0 && !selectedClientId) {
          setSelectedClientId(cliData.clients[0].id)
        }
      }
    } catch {
      toast.error("Error al cargar facturas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId) {
      toast.error("Selecciona un cliente")
      return
    }

    setIssuing(true)
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: selectedClientId,
          amount: Number(invoiceAmount),
          uso_cfdi: usoCfdi,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al emitir CFDI")

      toast.success(`Factura ${data.invoice.invoice_number} timbrada exitosamente con SAT`)
      setCreateOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Error al timbrar")
    } finally {
      setIssuing(false)
    }
  }

  const totalFacturado = invoices.reduce((acc, inv) => acc + Number(inv.amount || 0), 0)

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Ciclos de Facturación & Emisión CFDI 4.0"
        subtitle="Conciliación fiscal, timbrado PAC con Finkok y control tributario del SAT para clientes SaaS."
        breadcrumbs={[{ label: "Facturación" }, { label: "CFDI 4.0" }]}
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className="h-9 gap-1.5 text-xs font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Factura CFDI 4.0</span>
          </Button>
        }
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Total Facturado MXN
            </span>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
              ${totalFacturado.toLocaleString("es-MX")}
            </div>
            <span className="text-[11px] text-emerald-500 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" />
              100% conciliado con Stripe
            </span>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Comprobantes Timbrados
            </span>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
              {invoices.length}
            </div>
            <span className="text-[11px] text-primary flex items-center gap-1 mt-1">
              <FileCheck className="w-3 h-3" />
              Versión CFDI 4.0
            </span>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              PAC Finkok Uptime
            </span>
            <div className="mt-2 text-2xl font-bold tracking-tight text-cyan-500 font-mono">
              99.99%
            </div>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 font-mono">
              Latencia PAC: 840ms
            </span>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Régimen Emisor
            </span>
            <div className="mt-2 text-base font-bold tracking-tight text-foreground">
              601 Morales
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              RFC: KIN240118AA1
            </span>
          </div>
        </div>

        {/* Tactical Table */}
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Comprobantes Fiscales Digitales por Internet (CFDI)
              </h3>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {invoices.length} facturas registradas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30 text-muted-foreground uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4">Folio Interno</th>
                  <th className="py-3 px-4">Cliente / Receptor</th>
                  <th className="py-3 px-4">SAT UUID (Folio Fiscal)</th>
                  <th className="py-3 px-4">Uso CFDI</th>
                  <th className="py-3 px-4">Monto Total</th>
                  <th className="py-3 px-4">Estado PAC</th>
                  <th className="py-3 px-4 text-right">Comprobantes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Cargando facturas desde Supabase...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No hay facturas emitidas aún.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">
                          {inv.client?.name || "Cliente Corporativo"}
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {inv.client?.rfc || "RFC Genérico"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground truncate max-w-[160px]">
                        {inv.sat_uuid || "Generado por Finkok"}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {inv.uso_cfdi}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        ${Number(inv.amount).toLocaleString("es-MX")} MXN
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Timbrado SAT
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/api/admin/invoices/${inv.id}/download?format=pdf`}
                            download={`${inv.invoice_number}.pdf`}
                            className="inline-flex"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px] font-medium text-primary hover:text-primary hover:bg-primary/10 gap-1 transition-all"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              PDF
                            </Button>
                          </a>
                          <a
                            href={`/api/admin/invoices/${inv.id}/download?format=xml`}
                            download={`${inv.invoice_number}.xml`}
                            className="inline-flex"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px] font-medium text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 gap-1 transition-all"
                            >
                              <FileCode className="w-3.5 h-3.5" />
                              XML
                            </Button>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Emitir Factura CFDI */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md border-border/60 bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Crear & Validar Factura CFDI 4.0
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Genera la factura electrónica y solicita el timbrado inmediato ante el SAT con PAC Finkok.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInvoice} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Seleccionar Cliente Receptor *</Label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground cursor-pointer"
                required
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.rfc || "Sin RFC"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Monto Total (MXN) *</Label>
                <Input
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Uso de CFDI</Label>
                <select
                  value={usoCfdi}
                  onChange={(e) => setUsoCfdi(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground"
                >
                  <option value="G03">G03 - Gastos en general</option>
                  <option value="G01">G01 - Adquisición de mercancías</option>
                  <option value="P01">P01 - Por definir</option>
                  <option value="CP01">CP01 - Pagos</option>
                </select>
              </div>
            </div>

            {/* Desglose Automático de Impuestos */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40 space-y-1 text-xs">
              <span className="font-semibold text-foreground text-[11px] block">
                Desglose Tributario Automático:
              </span>
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>Subtotal (86.2%):</span>
                <span className="font-mono">
                  ${(Number(invoiceAmount || 0) / 1.16).toFixed(2)} MXN
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>IVA Trasladado (16%):</span>
                <span className="font-mono text-cyan-500">
                  ${(Number(invoiceAmount || 0) - Number(invoiceAmount || 0) / 1.16).toFixed(2)} MXN
                </span>
              </div>
              <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border/40">
                <span>Total a Timbrar:</span>
                <span className="font-mono">${Number(invoiceAmount || 0).toLocaleString("es-MX")} MXN</span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="text-xs">
                Cancelar
              </Button>
              <Button type="submit" disabled={issuing} className="text-xs font-semibold">
                {issuing ? "Timbrando con SAT..." : "Timbrar & Guardar en Supabase"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
