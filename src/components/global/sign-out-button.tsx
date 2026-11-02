'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function SignOutButton() {
  const router = useRouter()

  async function signOut() {
    const response = await fetch('/api/auth/sign-out', { method: 'POST' })
    if (!response.ok) throw new Error('Unable to sign out.')
    router.push('/')
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={signOut}>
      Sign out
    </Button>
  )
}
