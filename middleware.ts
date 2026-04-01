import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const isPortalRoute =
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/inventory') ||
    req.nextUrl.pathname.startsWith('/invoices') ||
    req.nextUrl.pathname.startsWith('/reports') ||
    req.nextUrl.pathname.startsWith('/settings') ||
    req.nextUrl.pathname.startsWith('/truck-intake') ||
    req.nextUrl.pathname.startsWith('/calculator') ||
    req.nextUrl.pathname.startsWith('/Tutorial')

  if (isPortalRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/inventory/:path*',
    '/invoices/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/truck-intake/:path*',
    '/calculator/:path*',
    '/Tutorial/:path*',
  ]
}
