import WaitlistForm from "@/components/WaitlistForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16 sm:px-10">
        <div className="max-w-3xl space-y-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Recruiting Agent
          </p>

          <h1 className="text-5xl font-black uppercase leading-[0.92] tracking-tight sm:text-7xl">
            Get better.
            <br />
            Get recruited.
          </h1>

          <p className="max-w-xl text-base font-medium text-zinc-600 sm:text-lg">
            Built for athletes who outwork the room and want real opportunities.
          </p>

          <WaitlistForm />
        </div>
      </section>
    </main>
  );
}
