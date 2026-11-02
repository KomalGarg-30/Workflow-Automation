import { NextResponse } from 'next/server'
import { createSession, verifyPassword } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Enter your email and password.' },
      { status: 400 }
    )
  }

  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    })
    if (
      !user?.passwordHash ||
      !(await verifyPassword(password, user.passwordHash))
    ) {
      return NextResponse.json(
        { error: 'Email or password is incorrect.' },
        { status: 401 }
      )
    }

    await createSession(user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Unable to sign in:', error)
    return NextResponse.json(
      {
        error:
          'The database is unavailable. Check your DATABASE_URL and Neon connection, then try again.',
      },
      { status: 503 }
    )
  }
}
