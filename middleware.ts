import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === "/__nextjs_original-stack-frames") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store",
      },
    })
  }

  // Protección de rutas administrativas
  if (pathname.startsWith("/admin")) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const isAuthRoute =
      pathname === "/admin/login" || pathname === "/admin/reset-password"

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      })

      const {
        data: { user },
      } = await supabase.auth.getUser()

      // 1. Si no está autenticado y no está en /admin/login o /admin/reset-password, redirigir a login
      if (!user && !isAuthRoute) {
        const loginUrl = new URL("/admin/login", request.url)
        return NextResponse.redirect(loginUrl)
      }

      // 2. Si ya está autenticado y entra a /admin/login o /admin/reset-password, redirigir al panel
      if (user && isAuthRoute) {
        const dashboardUrl = new URL("/admin/clientes", request.url)
        return NextResponse.redirect(dashboardUrl)
      }

      // 3. Si entra exactamente a /admin estando autenticado, redirigir a /admin/clientes
      if (user && pathname === "/admin") {
        const dashboardUrl = new URL("/admin/clientes", request.url)
        return NextResponse.redirect(dashboardUrl)
      }

      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/__nextjs_original-stack-frames",
  ],
}
