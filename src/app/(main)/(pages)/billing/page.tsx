import React from 'react'
import Stripe from 'stripe'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import BillingDashboard from './_components/billing-dashboard'

type Props = {
  searchParams?: { [key: string]: string | undefined }
}

const Billing = async (props: Props) => {
  const { session_id } = props.searchParams ?? {
    session_id: '',
  }
  if (session_id) {
    const stripe = new Stripe(process.env.STRIPE_SECRET!, {
      typescript: true,
      apiVersion: '2023-10-16',
    })

    const user = await getCurrentUser()
    if (user) {
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id)
      if (
        checkoutSession.client_reference_id === user.authId &&
        checkoutSession.payment_status === 'paid'
      ) {
        const session = await stripe.checkout.sessions.listLineItems(session_id)
        const description = session.data[0]?.description
        if (description) {
          await db.user.update({
            where: {
              authId: user.authId,
            },
            data: {
              tier: description,
              credits:
                description === 'Unlimited'
                  ? 'Unlimited'
                  : description === 'Pro'
                  ? '100'
                  : '10',
            },
          })
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        <span>Billing</span>
      </h1>
      <BillingDashboard />
    </div>
  )
}

export default Billing
