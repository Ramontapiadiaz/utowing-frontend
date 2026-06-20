'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const BACKEND_URL =
  'https://utowing-backend.onrender.com';

export default function LoginPage() {
  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const login = async () => {
    setLoading(true);

    try {
      const response =
        await axios.post(
          `${BACKEND_URL}/auth/login`,
          {
            email,
            password,
          },
        );

      const token =
        response.data.access_token;

      const user =
  response.data.user || {
    email,
    role: 'unknown',
  };

localStorage.setItem('token', token);

localStorage.setItem(
  'user',
  JSON.stringify(user),
);

if (user.role === 'admin') {
  router.push('/admin');
} else if (user.role === 'driver') {
  router.push('/driver');
} else {
  router.push('/customer');
}

      console.log(
        'LOGIN SUCCESS:',
        response.data,
      );
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
          Login
        </h1>

        <p className="mt-2 text-zinc-400">
          Access your uTowing account
        </p>

        <div className="mt-8 grid gap-4">
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
            onClick={login}
            disabled={loading}
            className="rounded-xl bg-white p-4 font-semibold text-black"
          >
            {loading
              ? 'Logging in...'
              : 'Login'}
          </button>
        </div>
      </div>
    </main>
  );
}
