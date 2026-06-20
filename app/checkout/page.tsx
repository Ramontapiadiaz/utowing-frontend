'use client';

export const dynamic = 'force-dynamic';

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';

import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import { Suspense,  useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const BACKEND_URL = 'https://utowing-backend.onrender.com';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
);

function CheckoutForm({
  requestId,
  clientSecret,
}: {
  requestId: string | null;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    if (!stripe || !elements) return;

    if (!requestId) {
      alert('Missing request ID. Please create a request before paying.');
      return;
    }

    setLoading(true);

    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (result.error) {
      alert(result.error.message);
      setLoading(false);
      return;
    }
    console.log('REQUEST ID:', requestId);

    await axios.patch(
      `${BACKEND_URL}/tow-requests/${requestId}/paid`,
      {
        stripePaymentIntentId: clientSecret.split('_secret_')[0],
      },
    );

    window.location.href = '/checkout/success';
  };

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
      <h1 className="text-4xl font-bold">Complete Payment</h1>

      <p className="mt-3 text-zinc-400">
        Secure payment powered by Stripe.
      </p>

      <p className="mt-4 text-2x1 front-bold">
         Total: $75.00 CAD
      </p>

      <div className="mt-8 rounded-xl border border-zinc-700 bg-zinc-950 p-4">
        <PaymentElement />
      </div>

      <button
        onClick={pay}
        disabled={loading}
        className="mt-8 w-full rounded-xl bg-white p-4 font-semibold text-black"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
}

  function CheckoutContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');

  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount] = useState(7500);
 
useEffect(() => {
  const createIntent = async () => {
    if (!requestId) return;

    const requestRes = await axios.get(
      `${BACKEND_URL}/tow-requests/${requestId}`
    );

    const realAmount =
      Math.round(requestRes.data.estimatedPrice * 100);

    setAmount(realAmount);

    const response = await axios.post(
      `${BACKEND_URL}/payments/create-payment-intent`,
      {
        amount: realAmount,
      }
    );

    setClientSecret(response.data.clientSecret);
  };

  createIntent();
}, [requestId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-xl">
        {clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'night',
              },
            }}
          >
            <CheckoutForm
              requestId={requestId}
              clientSecret={clientSecret}
            />
          </Elements>
        ) : (
          <p className="text-zinc-400">Preparing payment...</p>
        )}
      </div>
    </main>
  );
}
export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
