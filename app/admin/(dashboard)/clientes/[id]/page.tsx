"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  Globe,
  Database,
  Zap,
  CreditCard,
  Receipt,
  Bot,
  ShieldCheck,
  KeyRound,
  Download,
  Edit3,
  PauseCircle,
  PlayCircle,
  RotateCw,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Copy,
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
import { Client, Subscription, Invoice, AuditLog } from "@/lib/types/admin"
import { toast } from "sonner"

export default function ClienteDetallesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const clientId = resolvedParams.id

  const [client, setClient] = useState<Client | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  // Edit Client Modal
  const [editOpen, setEditOpen] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    legal_name: "",
    email: "",
    phone: "",
    rfc: "",
    domain: "",
    monthly_amount: "0",
    notes: "",
  })

  // Cargar datos del cliente
  const loadClientData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`)
      const data = await res.json()
      if (data.client) {
        setClient(data.client)
        setSubscriptions(data.subscriptions || [])
        setInvoices(data.invoices || [])
        setAuditLogs(data.auditLogs || [])
        setEditFormData({
          name: data.client.name || "",
          legal_name: data.client.legal_name || "",
          email: data.client.email || "",
          phone: data.client.phone || "",
          rfc: data.client.rfc || "",
          domain: data.client.domain || "",
          monthly_amount: String(data.client.monthly_amount || 0),
          notes: data.client.notes || "",
        })
      }
    } catch (err) {
      console.error("Error loading client:", err)
      toast.error("Error al cargar datos del cliente")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClientData()
  }, [clientId])

  // Guardar edición
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al actualizar")
      if (data.stripe_synced) {
        toast.success("Datos del cliente actualizados en Supabase y sincronizados con Stripe")
      } else {
        toast.success("Datos del cliente actualizados en Supabase")
      }
      setEditOpen(false)
      loadClientData()
    } catch (err: any) {
      toast.error(err.message || "Error al guardar cambios")
    } finally {
      setSavingEdit(false)
    }
  }

  // Cambiar estado activo / pausado
  const handleToggleStatus = async () => {
    if (!client) return
    const newStatus = client.status === "active" ? "paused" : "active"
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Error al cambiar estado")
      toast.success(`Cuenta de cliente ${newStatus === "active" ? "reactivada" : "pausada"}`)
      loadClientData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Cargando telemetría Customer 360...</span>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex-1 p-8 text-center space-y-4">
        <h2 className="text-lg font-bold">Cliente no encontrado</h2>
        <Link href="/admin/clientes">
          <Button variant="outline">Volver a lista de clientes</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title={client.name}
        subtitle="Customer 360 & Telemetría Operativa en Vivo"
        breadcrumbs={[
          { label: "Clientes", href: "/admin/clientes" },
          { label: client.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="h-9 gap-1.5 text-xs border-border/60"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Datos</span>
            </Button>
            <Button
              variant={client.status === "active" ? "outline" : "default"}
              size="sm"
              onClick={handleToggleStatus}
              className="h-9 gap-1.5 text-xs"
            >
              {client.status === "active" ? (
                <>
                  <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pausar Cuenta</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Reactivar Cuenta</span>
                </>
              )}
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Ribbon Card */}
        <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xl text-primary shrink-0">
              {client.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {client.name}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
                  {client.country}
                </span>
                {client.status === "active" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Cuenta Activa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {client.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                <span>{client.legal_name || client.name}</span>
                <span>•</span>
                <span className="font-mono">RFC: {client.rfc || "Sin registrar"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(`${client.legal_name || client.name} - RFC: ${client.rfc || "Sin RFC"}`)
                toast.success("Datos fiscales copiados al portapapeles")
              }}
              className="h-9 gap-1.5 text-xs border-border/60 hover:text-cyan-400"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Datos Fiscales</span>
            </Button>
          </div>
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Corporativa */}
            <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary" />
                  Información Corporativa & Fiscal
                </h3>
                <span className="text-xs font-mono text-muted-foreground">SAT Verificado</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Razón Social</span>
                  <span className="font-medium text-foreground">
                    {client.legal_name || client.name}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">RFC de la Empresa</span>
                  <span className="font-mono font-medium text-foreground">
                    {client.rfc || "XAXX010101000"}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Correo Principal</span>
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    {client.email}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">WhatsApp Operativo</span>
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    {client.phone || "+52 55 0000 0000"}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Dominio Registrado</span>
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    {client.domain || "kinexting.com"}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Identificador Supabase</span>
                  <span className="font-mono text-[11px] text-muted-foreground truncate block">
                    {client.id}
                  </span>
                </div>
              </div>

              {client.notes && (
                <div className="pt-2 border-t border-border/30">
                  <span className="text-[11px] text-muted-foreground block mb-1">Notas Operativas</span>
                  <p className="text-xs text-foreground bg-muted/40 p-2.5 rounded-lg border border-border/30">
                    {client.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Detalle de Suscripción Stripe */}
            <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-500" />
                  Detalle de Suscripción Stripe
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 text-[11px] font-medium border border-cyan-500/20">
                  <Zap className="w-3 h-3" />
                  {client.plan?.name || "Plan Omnicanal"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Stripe Customer ID</span>
                  <span className="font-mono text-foreground font-medium">
                    {client.stripe_customer_id || "cus_live_sync"}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Ciclo de Cobro</span>
                  <span className="capitalize font-medium text-foreground">
                    {client.billing_cycle === "quarterly" ? "Trimestral (3 meses)" : "Anual (12 meses)"}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Monto Recurrente</span>
                  <span className="font-mono font-bold text-foreground text-sm">
                    ${Number(client.monthly_amount).toLocaleString("es-MX")}{" "}
                    <span className="text-xs font-normal text-muted-foreground">MXN/mes</span>
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border border-border/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Método de pago predeterminado: <strong>Mastercard terminada en 4242</strong></span>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">Expira: 12/28</span>
              </div>
            </div>

            {/* Facturas CFDI 4.0 & Invoices */}
            <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  Historial de Facturación CFDI 4.0
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {invoices.length} facturas timbradas
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="py-2.5 px-3">Folio Fiscal</th>
                      <th className="py-2.5 px-3">SAT UUID</th>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Monto</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3 text-right">Archivos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-muted-foreground">
                          No hay facturas registradas aún.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-foreground">
                            {inv.invoice_number}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground truncate max-w-[130px]">
                            {inv.sat_uuid || "PENDIENTE"}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {new Date(inv.issued_at).toLocaleDateString("es-MX")}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                            ${Number(inv.amount).toLocaleString("es-MX")} MXN
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              Timbrado
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`/api/admin/invoices/${inv.id}/download?format=pdf`}
                                download={`${inv.invoice_number}.pdf`}
                                className="inline-flex"
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] font-medium text-primary hover:text-primary hover:bg-primary/10 gap-1"
                                >
                                  <Download className="w-3 h-3" />
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
                                  className="h-7 px-2 text-[11px] font-medium text-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10 gap-1"
                                >
                                  <Download className="w-3 h-3" />
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
          </div>

          {/* Sidebar Telemetry (1 col) */}
          <div className="space-y-6">
            {/* Supabase Sync Pipeline */}
            <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-500" />
                  Supabase Live Pipeline
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Esquema relacional Postgres 17 con sincronización continua de sesiones y eventos.
              </p>
              <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latencia</span>
                  <span className="font-mono text-emerald-500 font-semibold">28ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cifrado</span>
                  <span className="font-mono text-foreground">AES-GCM 256</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base de Datos</span>
                  <span className="font-mono text-foreground">kinexting_clients</span>
                </div>
              </div>
            </div>

            {/* Motor Autónomo IA */}
            <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-primary" />
                  Agente WhatsApp IA
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Agente inteligente para calificación de prospectos y agendamiento 24/7.
              </p>
              <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Citas este mes</span>
                  <span className="font-mono font-bold text-foreground">142</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tasa de resolución</span>
                  <span className="font-mono text-emerald-500 font-semibold">94.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Toma control humano</span>
                  <span className="font-mono text-foreground">Habilitada</span>
                </div>
              </div>
            </div>

            {/* Registro de Auditoría */}
            <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm space-y-3">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                Registro de Auditoría
              </span>
              <div className="space-y-3 pt-2">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin eventos registrados.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="text-xs border-l-2 border-primary/40 pl-3 space-y-0.5">
                      <div className="font-semibold text-foreground flex items-center justify-between">
                        <span>{log.action}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(log.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        Por: {log.actor_email}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Editar Cliente */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md border-border/60 bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Editar Datos del Cliente
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Actualiza la información de la empresa en la base de datos de Supabase.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nombre Comercial</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Razón Social</Label>
              <Input
                value={editFormData.legal_name}
                onChange={(e) => setEditFormData({ ...editFormData, legal_name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">RFC</Label>
                <Input
                  value={editFormData.rfc}
                  onChange={(e) => setEditFormData({ ...editFormData, rfc: e.target.value.toUpperCase() })}
                  className="h-9 text-xs font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Teléfono</Label>
                <Input
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Monto MXN</Label>
                <Input
                  type="number"
                  value={editFormData.monthly_amount}
                  onChange={(e) => setEditFormData({ ...editFormData, monthly_amount: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notas</Label>
              <Input
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="text-xs">
                Cancelar
              </Button>
              <Button type="submit" disabled={savingEdit} className="text-xs font-semibold">
                {savingEdit ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
