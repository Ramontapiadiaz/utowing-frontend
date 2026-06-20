'use client';

import { useState } from 'react';

import axios from 'axios';

import { useRouter } from 'next/navigation';

const BACKEND_URL =
  'https://utowing-backend.onrender.com';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const register = async () => {
    setLoading(true);

    try {
      const response =
        await axios.post(
          `${BACKEND_URL}/auth/register`,
          {
            name,
            email,
            phone,
            password,
            role: 'customer',
          },
        );

      const token =
        response.data.access_token;

      const user =
        response.data.user;

      localStorage.setItem(
        'token',
        token,
      );

      localStorage.setItem(
        'user',
        JSON.stringify(user),
      );

      alert(
        'Account created successfully',
      );

      router.push('/customer');
    } catch (error: any) {
      alert(
        JSON.stringify(
          error.response?.data ||
            error.message,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="text-4xl font-bold">
          Create Account
        </h1>

        <p className="mt-2 text-zinc-400">
          Join uTowing
        </p>

        <div className="mt-8 grid gap-4">
          <input
            value={name}
            onChange={(event) =>
              setName(
                event.target.value,
              )
            }
            placeholder="Full Name"
            className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
          />

          <input
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value,
              )
            }
            placeholder="Email"
            className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
          />

          <input
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value,
              )
            }
            placeholder="Phone Number"
            className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
          />

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value,
              )
            }
            placeholder="Password"
            className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
          />

          <button
            onClick={register}
            disabled={loading}
            className="rounded-xl bg-white p-4 font-semibold text-black"
          >
            {loading
              ? 'Creating Account...'
              : 'Create Account'}
          </button>
        </div>
      </div>
    </main>
  );
}
