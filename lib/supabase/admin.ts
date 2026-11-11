import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ikejgukgkjrrkwcswhgg.supabase.co"
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZWpndWtna2pycmt3Y3N3aGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzAxMDgsImV4cCI6MjA5NzIwNjEwOH0.XmSy3uYgQeiXU9j3F9K0dxKCayjyaydcbS2kKovu5H4"

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
