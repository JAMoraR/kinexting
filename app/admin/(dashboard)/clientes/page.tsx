"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Users,
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Database,
  Building,
  MoreVertical,
  ExternalLink,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  Copy,
  ChevronRight,
  DollarSign,
  TrendingUp,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Client, Plan } from "@/lib/types/admin"
import { toast } from "sonner"

export default function AdminClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [syncingStripe, setSyncingStripe] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [planFilter, setPlanFilter] = useState("todos")

  // Modal Nuevo Cliente
  const [newClientOpen, setNewClientOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    email: "",
    phone: "+52 ",
    rfc: "",
    domain: "",
    current_plan_id: "asistente",
    billing_cycle: "quarterly",
    monthly_amount: "651",
    notes: "",
    create_in_stripe: true, // Si es true, se crea en Stripe
  })

  // Cargar clientes y planes desde Supabase
  const fetchData = async () => {
    setLoading(true)
    try {
      const [cliRes, planRes] = await Promise.all([
        fetch("/api/admin/clients"),
        fetch("/api/admin/plans"),
      ])
      const [cliData, planData] = await Promise.all([cliRes.json(), planRes.json()])

      if (cliData.clients) setClients(cliData.clients)
      if (planData.plans) setPlans(planData.plans)
    } catch (err) {
      console.error("Error fetching clients:", err)
      toast.error("Error al cargar clientes de Supabase")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Sincronizar clientes existentes desde Stripe
  const handleSyncStripeCustomers = async () => {
    setSyncingStripe(true)
    try {
      const res = await fetch("/api/admin/clients/sync", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Fallo en sincronización")
      toast.success(data.message || "Clientes de Stripe sincronizados")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Error al sincronizar con Stripe")
    } finally {
      setSyncingStripe(false)
    }
  }

  // Filtrado reactivo
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        searchQuery === "" ||
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.rfc && client.rfc.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (client.stripe_customer_id && client.stripe_customer_id.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "activos" && client.status === "active") ||
        (statusFilter === "trial" && client.status === "trial") ||
        (statusFilter === "pausados" && client.status === "paused") ||
        (statusFilter === "cancelados" && client.status === "cancelled")

      const matchesPlan =
        planFilter === "todos" || client.current_plan_id === planFilter

      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [clients, searchQuery, statusFilter, planFilter])

  // Crear cliente (con sincronización opcional en Stripe)
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          is_test: !formData.create_in_stripe,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Error al crear cliente")
      }

      if (data.stripe_synced) {
        toast.success(`Cliente ${formData.name} creado en Supabase y sincronizado con Stripe`)
      } else {
        toast.success(`Cliente de prueba ${formData.name} registrado en Supabase`)
      }

      setNewClientOpen(false)
      setFormData({
        name: "",
        legal_name: "",
        email: "",
        phone: "+52 ",
        rfc: "",
        domain: "",
        current_plan_id: "asistente",
        billing_cycle: "quarterly",
        monthly_amount: "651",
        notes: "",
        create_in_stripe: true,
      })
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Error al guardar")
    } finally {
      setCreating(false)
    }
  }

  // Exportar CSV
  const handleExportCSV = () => {
    if (clients.length === 0) return
    const headers = ["ID", "Nombre", "Email", "RFC", "Plan", "Estado", "Monto MXN", "Ciclo", "Stripe ID"]
    const rows = filteredClients.map((c) => [
      c.id,
      `"${c.name}"`,
      c.email,
      c.rfc || "",
      c.current_plan_id || "",
      c.status,
      c.monthly_amount,
      c.billing_cycle,
      c.stripe_customer_id || "",
    ])
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `kinexting_clientes_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV exportado exitosamente")
  }

  // Enviar correo de restablecimiento de contraseña vía Supabase
  const handleSendResetMail = async (email: string) => {
    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error("Fallo al enviar correo")
      toast.success(`Correo de restablecimiento enviado a ${email}`)
    } catch {
      toast.error("No se pudo enviar el correo de recuperación")
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Clientes & Cuentas Activas"
        subtitle="Orquestación integral de infraestructura SaaS, reconciliación Stripe y estado relacional en Supabase."
        breadcrumbs={[{ label: "Gestión" }, { label: "Clientes" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncStripeCustomers}
              disabled={syncingStripe}
              className="h-9 gap-1.5 text-xs border-border/60 hover:text-cyan-400"
            >
              <RotateCw className={`w-3.5 h-3.5 ${syncingStripe ? "animate-spin text-cyan-400" : ""}`} />
              <span>Sincronizar Stripe</span>
            </Button>
            <Button
              onClick={() => setNewClientOpen(true)}
              className="h-9 gap-1.5 text-xs font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Bento Grid: Telemetry KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Clientes */}
          <div className="p-5 rounded-xl bg-card border border-border/50 hover:border-border transition-all duration-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Clientes
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {clients.length}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                Live Fleet
              </span>
            </div>
            <div className="mt-3 w-full bg-muted/50 h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: "85%" }}></div>
            </div>
          </div>

          {/* Card 2: MRR Activo */}
          <div className="p-5 rounded-xl bg-card border border-border/50 hover:border-border transition-all duration-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                MRR Recurrente
              </span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                ${clients.reduce((acc, c) => acc + Number(c.monthly_amount || 0), 0).toLocaleString("es-MX")}{" "}
                <span className="text-xs font-normal text-muted-foreground">MXN</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Stripe Sync
              </span>
            </div>
            <div className="mt-3 w-full bg-muted/50 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full" style={{ width: "70%" }}></div>
            </div>
          </div>

          {/* Card 3: Supabase Sync */}
          <div className="p-5 rounded-xl bg-card border border-border/50 hover:border-border transition-all duration-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Supabase Replicas
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground">100%</span>
              <span className="text-[11px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                32ms ping
              </span>
            </div>
            <div className="mt-3 w-full bg-muted/50 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: "100%" }}></div>
            </div>
          </div>

          {/* Card 4: Churn Rate */}
          <div className="p-5 rounded-xl bg-card border border-border/50 hover:border-border transition-all duration-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Churn Rate Global
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground">0.8%</span>
              <span className="text-[11px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                -0.3% vs Q2
              </span>
            </div>
            <div className="mt-3 w-full bg-muted/50 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: "15%" }}></div>
            </div>
          </div>
        </div>

        {/* Tactical Control Bar */}
        <div className="p-3.5 rounded-xl bg-card border border-border/50 flex flex-col lg:flex-row items-center justify-between gap-3 shadow-sm">
          {/* Omni Search with Cmd+K */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, email, RFC, Stripe ID..."
              className="pl-9 pr-12 h-9 text-xs bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
              ⌘K
            </span>
          </div>

          {/* Filters & Export */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Estado:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="todos">Todos los Estados</option>
                <option value="activos">Activos</option>
                <option value="trial">Con Trial</option>
                <option value="pausados">Pausados</option>
                <option value="cancelados">Cancelados</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Plan Stripe:</span>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="h-9 px-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="todos">Todos los Planes Activos</option>
                {plans
                  .filter((p) => p.is_active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 gap-1.5 text-xs border-border/60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </Button>
          </div>
        </div>

        {/* Tactical Data Table */}
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Cliente / Contacto</th>
                  <th className="py-3 px-4">Plan Actual</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Stripe & Supabase ID</th>
                  <th className="py-3 px-4">Ciclo</th>
                  <th className="py-3 px-4">Monto Mensual</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Cargando flota de clientes desde Supabase...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No se encontraron clientes con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const initials = client.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()

                    const isStripeSync =
                      client.stripe_customer_id &&
                      client.stripe_customer_id.startsWith("cus_") &&
                      !client.stripe_customer_id.startsWith("cus_test_mock_")

                    return (
                      <tr
                        key={client.id}
                        className="hover:bg-muted/30 transition-colors duration-150 group"
                      >
                        {/* Cliente */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0 text-xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Link
                                  href={`/admin/clientes/${client.id}`}
                                  className="font-semibold text-foreground hover:text-primary transition-colors truncate"
                                >
                                  {client.name}
                                </Link>
                                <span className="text-[10px] font-mono px-1 rounded bg-muted text-muted-foreground border border-border/40">
                                  {client.country}
                                </span>
                                {(client.metadata?.is_test || client.stripe_customer_id?.startsWith("cus_test_mock_")) && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                    Prueba (Sandbox)
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground block truncate">
                                {client.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                            <Zap className="w-3 h-3" />
                            {client.plan?.name || client.current_plan_id || "Plan Asistente"}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-4">
                          {client.status === "active" && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Activo
                            </span>
                          )}
                          {client.status === "trial" && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                              En Trial
                            </span>
                          )}
                          {client.status === "paused" && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Pausado
                            </span>
                          )}
                          {client.status === "cancelled" && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                              Cancelado
                            </span>
                          )}
                        </td>

                        {/* IDs */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span className={`text-[10px] font-semibold ${isStripeSync ? "text-emerald-500" : "text-amber-500"}`}>
                                {isStripeSync ? "STRIPE_LIVE:" : "TEST_ID:"}
                              </span>
                              <span className="text-foreground truncate max-w-[120px]">
                                {client.stripe_customer_id || "cus_pending"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span className="text-[10px] text-primary">PG_UUID:</span>
                              <span className="truncate max-w-[120px] text-muted-foreground">
                                {client.id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Ciclo */}
                        <td className="py-3.5 px-4">
                          <span className="text-muted-foreground capitalize">
                            {client.billing_cycle === "quarterly" ? "Trimestral" : "Anual"}
                          </span>
                        </td>

                        {/* Monto */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                          ${Number(client.monthly_amount || 0).toLocaleString("es-MX")}{" "}
                          <span className="text-[10px] font-normal text-muted-foreground">MXN</span>
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/clientes/${client.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1"
                              >
                                <span>Ver 360</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                            </Link>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs">
                                <DropdownMenuLabel>Acciones de Cuenta</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/clientes/${client.id}`}>
                                    Ver Detalle 360
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSendResetMail(client.email)}
                                >
                                  Enviar enlace cambiar contraseña
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    navigator.clipboard.writeText(client.id)
                                    toast.success("UUID copiado al portapapeles")
                                  }}
                                >
                                  Copiar Supabase UUID
                                </DropdownMenuItem>
                                {client.stripe_customer_id && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      navigator.clipboard.writeText(client.stripe_customer_id!)
                                      toast.success("Stripe Customer ID copiado")
                                    }}
                                  >
                                    Copiar Stripe Customer ID
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Crear Cliente */}
      <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
        <DialogContent className="sm:max-w-lg border-border/60 bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Aprovisionar Nuevo Cliente (Supabase & Stripe)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Registra una nueva cuenta de cliente con sincronización bidireccional directa a la pasarela de Stripe.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateClient} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-name" className="text-xs">
                  Nombre Comercial *
                </Label>
                <Input
                  id="c-name"
                  required
                  placeholder="Ej. Clínica Dental Sonrisas"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-legal" className="text-xs">
                  Razón Social
                </Label>
                <Input
                  id="c-legal"
                  placeholder="Ej. Odontología Sonrisas S.A.S."
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-email" className="text-xs">
                  Correo Electrónico *
                </Label>
                <Input
                  id="c-email"
                  type="email"
                  required
                  placeholder="contacto@empresa.mx"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-phone" className="text-xs">
                  WhatsApp / Teléfono
                </Label>
                <Input
                  id="c-phone"
                  placeholder="+52 55 1234 5678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-rfc" className="text-xs">
                  RFC Fiscal (SAT)
                </Label>
                <Input
                  id="c-rfc"
                  placeholder="CDS201015AB3"
                  value={formData.rfc}
                  onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                  className="h-9 text-xs font-mono uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-domain" className="text-xs">
                  Dominio Web
                </Label>
                <Input
                  id="c-domain"
                  placeholder="empresa.mx"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Plan Stripe *</Label>
                <select
                  value={formData.current_plan_id}
                  onChange={(e) => {
                    const selectedPlan = plans.find((p) => p.id === e.target.value)
                    const newAmount =
                      formData.billing_cycle === "annual"
                        ? selectedPlan?.price_annual_mxn || 2334
                        : selectedPlan?.price_quarterly_mxn || 614
                    setFormData({
                      ...formData,
                      current_plan_id: e.target.value,
                      monthly_amount: String(newAmount),
                    })
                  }}
                  className="w-full h-9 px-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground"
                >
                  {plans.length > 0 ? (
                    plans.map((p) => (
                      <option key={p.id} value={p.id} disabled={!p.is_active}>
                        {p.name} {!p.is_active ? "(Inhabilitado en Stripe)" : "(Activo)"}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="asistente">Plan Asistente (Activo)</option>
                      <option value="recepcionista" disabled>Plan Omnicanal (Inhabilitado)</option>
                      <option value="soporte-tecnico" disabled>Plan Web App (Inhabilitado)</option>
                      <option value="a-medida" disabled>Plan Chatbot + Web App (Inhabilitado)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Ciclo de Cobro</Label>
                <select
                  value={formData.billing_cycle}
                  onChange={(e) => {
                    const cycle = e.target.value
                    const selectedPlan = plans.find((p) => p.id === formData.current_plan_id)
                    const newAmount =
                      cycle === "annual"
                        ? selectedPlan?.price_annual_mxn || 2334
                        : selectedPlan?.price_quarterly_mxn || 614
                    setFormData({
                      ...formData,
                      billing_cycle: cycle,
                      monthly_amount: String(newAmount),
                    })
                  }}
                  className="w-full h-9 px-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground"
                >
                  <option value="quarterly">Trimestral (3 meses)</option>
                  <option value="annual">Anual (12 meses)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-amount" className="text-xs">
                  Monto Recurrente (MXN)
                </Label>
                <Input
                  id="c-amount"
                  type="number"
                  value={formData.monthly_amount}
                  onChange={(e) => setFormData({ ...formData, monthly_amount: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            {/* Checkbox Sincronizar en Stripe */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="stripe-toggle" className="text-xs font-semibold cursor-pointer">
                  Sincronizar y crear cliente en Stripe
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Registra el Customer ID directamente en Stripe con sus metadatos.
                </p>
              </div>
              <input
                id="stripe-toggle"
                type="checkbox"
                checked={formData.create_in_stripe}
                onChange={(e) => setFormData({ ...formData, create_in_stripe: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-notes" className="text-xs">
                Notas Operativas
              </Label>
              <Input
                id="c-notes"
                placeholder="Observaciones de configuración o integración"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewClientOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creating} className="text-xs font-semibold">
                {creating ? "Guardando en Supabase & Stripe..." : "Aprovisionar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
