'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = { mode: 'sign-in' | 'sign-up' }

export default function AuthForm({ mode }: Props) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          password: formData.get('password'),
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Authentication failed.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Unable to reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      {isSignUp && (
        <Input name="name" autoComplete="name" placeholder="Name (optional)" />
      )}
      <Input
        name="email"
        type="email"
        autoComplete="email"
        placeholder="Email"
        required
      />
      <Input
        name="password"
        type="password"
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        placeholder="Password"
        minLength={8}
        maxLength={128}
        required
      />
      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
      </Button>
      <p className="text-sm text-muted-foreground">
        {isSignUp ? 'Already have an account?' : 'Need an account?'}{' '}
        <Link
          className="text-primary underline"
          href={isSignUp ? '/sign-in' : '/sign-up'}
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </Link>
      </p>
    </form>
  )
}
