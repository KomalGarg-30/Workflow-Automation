import { NextResponse } from 'next/server'
import { createSession, hashPassword } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json(
      { error: 'Password must be between 8 and 128 characters.' },
      { status: 400 }
    )
  }

  try {
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        {
          error: existingUser.passwordHash
            ? 'An account with this email already exists. Please sign in.'
            : 'This email belongs to an existing account. Contact the administrator to migrate it safely.',
        },
        { status: 409 }
      )
    }

    const user = await db.user.create({
      data: {
        name: name || null,
        email,
        passwordHash: await hashPassword(password),
      },
      select: { id: true },
    })
    await createSession(user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Unable to create account:', error)
    return NextResponse.json(
      {
        error:
          'The database is unavailable. Check your DATABASE_URL and Neon connection, then try again.',
      },
      { status: 503 }
    )
  }
}
