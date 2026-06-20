export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center">
        <h1 className="text-4xl font-bold">
          Payment Successful
        </h1>

        <p className="mt-4 text-zinc-400">
          Your roadside assistance payment was processed successfully.
        </p>

        <a
          href="/customer"
          className="mt-8 inline-block rounded-xl bg-white px-6 py-4 font-semibold text-black"
        >
          Track My Request
        </a>
      </div>
    </main>
  );
}
