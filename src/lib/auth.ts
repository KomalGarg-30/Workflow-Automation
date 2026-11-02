import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { authCookieName } from '@/lib/auth-cookie'

const scrypt = promisify(scryptCallback)
const SESSION_DAYS = 30

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex')

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(':')
  if (!salt || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(storedHash)) {
    return false
  }

  const expected = Buffer.from(storedHash, 'hex')
  const actual = (await scrypt(password, salt, expected.length)) as Buffer
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  })

  cookies().set(authCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

export async function deleteSession() {
  const token = cookies().get(authCookieName)?.value
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } })
  }
  cookies().delete(authCookieName)
}

export async function getCurrentUser() {
  const token = cookies().get(authCookieName)?.value
  if (!token) return null

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { userId: true, expiresAt: true },
  })

  if (!session || session.expiresAt <= new Date()) return null

  return db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      authId: true,
      name: true,
      email: true,
      profileImage: true,
      tier: true,
      credits: true,
    },
  })
}
