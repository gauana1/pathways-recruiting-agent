import RealtimeFeedbackSimulation from "@/components/RealtimeFeedbackSimulation";
import WaitlistForm from "@/components/WaitlistForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <section className="mx-auto flex min-h-[88vh] w-full max-w-6xl items-center px-6 py-12 sm:px-10 sm:py-14">
        <div className="max-w-4xl space-y-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Pathways Basketball Hardware · Pre-Launch
          </p>

          <h1 className="text-5xl font-black uppercase leading-[0.92] tracking-tight sm:text-7xl">
            Rewire your shot
            <br />
            in real time.
          </h1>

          <p className="max-w-2xl text-base font-medium text-zinc-600 sm:text-lg">
            Pathways gives on-arm haptic feedback during live reps, so you correct
            on the next release, not the next session.
          </p>

          <p className="max-w-2xl text-sm font-semibold uppercase tracking-[0.12em] text-zinc-900 sm:text-base">
            Train your nervous system, not just rep volume.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="#waitlist"
              className="inline-flex h-11 items-center bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-zinc-700 focus:outline-none"
            >
              Join the Waitlist
            </a>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Early access is limited.
            </p>
          </div>

          <div id="waitlist" className="space-y-4 border-t border-zinc-200 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Built for real-time correction
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-700 sm:text-xs">
              <span className="border border-zinc-300 px-3 py-2">
                Haptic Feedback Edition
              </span>
              <span className="border border-zinc-300 px-3 py-2">
                Haptic + Actuator Edition
              </span>
            </div>
            <ol className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-900 sm:grid-cols-3">
              <li className="border border-zinc-900 px-3 py-2">
                On-arm haptic cues on every rep.
              </li>
              <li className="border border-zinc-900 px-3 py-2">
                Correct from the cue or add actuator assist.
              </li>
              <li className="border border-zinc-900 px-3 py-2">
                Keep miss and correction in the same rep.
              </li>
            </ol>
            <WaitlistForm />
          </div>

          <RealtimeFeedbackSimulation />
        </div>
      </section>

      <section className="border-t border-zinc-200">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-10 sm:py-14">
          <div className="max-w-4xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Self-correcting loop
            </p>
            <h2 className="text-3xl font-black uppercase leading-tight tracking-tight sm:text-5xl">
              Motion truth. Haptic cue. Repeat.
            </h2>
            <p className="max-w-3xl text-base font-medium text-zinc-600 sm:text-lg">
              Haptic cues catch timing and path errors instantly. On the actuator
              edition, guided correction can help alignment before the rep ends.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-900 sm:text-sm">
              <span className="border border-zinc-900 px-4 py-2">Motion</span>
              <span className="text-zinc-500">→</span>
              <span className="border border-zinc-900 px-4 py-2">Detection</span>
              <span className="text-zinc-500">→</span>
              <span className="border border-zinc-900 px-4 py-2">Haptic Cue</span>
              <span className="text-zinc-500">→</span>
              <span className="border border-zinc-900 px-4 py-2">
                Athlete Response / Actuator Assist
              </span>
              <span className="text-zinc-500">→</span>
              <span className="border border-zinc-900 px-4 py-2">Repeat</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
