// middleware.ts
import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const isDev = process.env.NODE_ENV !== "production"

  // Security headers you already had
  res.headers.set("X-Frame-Options", "DENY")
  res.headers.set("X-Content-Type-Options", "nosniff")
  res.headers.set("X-XSS-Protection", "1; mode=block")
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  res.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  )

  // ✅ Relaxed CSP for Next.js + your inline styles
  // - Allow inline scripts (Next’s small bootstraps) and eval in dev (HMR)
  // - Allow inline styles because you use style attributes
  // - Allow wss: for HMR, https: for API calls (GitHub/Discord/etc.)
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${isDev ? "'unsafe-eval' 'unsafe-inline'" : "'unsafe-inline'"} https:`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")

  res.headers.set("Content-Security-Policy", csp)
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
