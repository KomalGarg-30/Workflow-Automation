import { NextRequest, NextResponse } from 'next/server'
import { authCookieName } from '@/lib/auth-cookie'

const publicPaths = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/auth/sign-in',
  '/api/auth/sign-up',
  '/api/auth/sign-out',
]

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (publicPaths.includes(pathname) || request.cookies.has(authCookieName)) {
    return NextResponse.next()
  }

  const signInUrl = new URL('/sign-in', request.url)
  signInUrl.searchParams.set('redirect_url', pathname)
  return NextResponse.redirect(signInUrl)
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
