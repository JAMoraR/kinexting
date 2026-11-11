import { ReactNode } from "react"
import { AdminSidebar } from "@/components/admin/admin-nav"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground antialiased selection:bg-cyan-500/20 selection:text-cyan-400">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
