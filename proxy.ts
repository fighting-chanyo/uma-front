import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

export async function proxy(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.delete(name)
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.delete(name)
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ログインページと認証関連のルート以外でセッションがない場合は、ログインページにリダイレクト
  if (!user && req.nextUrl.pathname !== "/login" && !req.nextUrl.pathname.startsWith("/auth")) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/login"
    return NextResponse.redirect(redirectUrl)
  }

  // ログイン済みでプロフィールが未設定の場合、プロフィール設定ページにリダイレクト
  if (user && req.nextUrl.pathname !== "/profile/setup") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()

    if (!profile?.display_name) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/profile/setup"
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
