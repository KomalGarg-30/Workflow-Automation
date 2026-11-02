import { NextRequest, NextResponse } from 'next/server'
import { authCookieName } from '@/lib/auth-cookie'

const publicPaths = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/auth/sign-in',
  '/api/auth/sign-up',
  '/api/auth/sign-out',
  '/api/drive-activity/notification',
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

// https://www.googleapis.com/auth/userinfo.email
// https://www.googleapis.com/auth/userinfo.profile
// https://www.googleapis.com/auth/drive.activity.readonly
// https://www.googleapis.com/auth/drive.metadata
// https://www.googleapis.com/auth/drive.readonly
