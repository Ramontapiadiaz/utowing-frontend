export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          uTowing
        </h1>

        <p className="mt-4 text-xl text-zinc-300">
          Real-time roadside assistance dispatch for towing, tire service,
          jump starts, lockouts, EV rescue, fleet recovery, and heavy-duty support.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <a
            href="/customer"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black"
          >
            Request Service
          </a>

          <a
            href="/admin"
            className="rounded-xl border border-white px-6 py-3 font-semibold"
          >
            Dispatch Dashboard
          </a>
        </div>
      </section>

      <section className="grid gap-4 px-6 pb-24 md:grid-cols-4">
        {[
          "Towing",
          "Mobile Tire",
          "Jump Start",
          "Lockout",
          "EV Charging Rescue",
          "Fleet Recovery",
          "Heavy Duty",
          "Insurance Claims",
        ].map((service) => (
          <div
            key={service}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
          >
            <h3 className="text-lg font-semibold">{service}</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Fast roadside dispatch with live driver tracking and status updates.
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
