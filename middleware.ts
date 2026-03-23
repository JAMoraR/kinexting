import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/__nextjs_original-stack-frames") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store",
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/__nextjs_original-stack-frames"],
}
