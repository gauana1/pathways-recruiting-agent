"use client";

import { useEffect, useMemo, useState } from "react";

type FeedbackMode = "haptic" | "actuator";

type SimulationState = {
  id: "too-wide" | "adjust-angle" | "good-form";
  label: string;
  cues: Record<FeedbackMode, string>;
  upperArmAngle: number;
  forearmAngle: number;
  toneClasses: {
    stroke: string;
    badge: string;
    accent: string;
    marker: string;
  };
};

const SHOULDER_POINT = { x: 34, y: 84 };
const UPPER_ARM_LENGTH = 56;
const FOREARM_LENGTH = 48;

const FEEDBACK_MODES: { id: FeedbackMode; label: string; guidance: string }[] = [
  {
    id: "haptic",
    label: "Haptic Feedback",
    guidance: "Vibration cue for each correction.",
  },
  {
    id: "actuator",
    label: "Haptic + Actuator",
    guidance: "Vibration plus directional nudge.",
  },
];

const SIMULATION_STATES: SimulationState[] = [
  {
    id: "too-wide",
    label: "Too wide",
    cues: {
      haptic: "Double pulse: bring your elbow in.",
      actuator: "Inward nudge + pulse: bring your elbow in.",
    },
    upperArmAngle: -20,
    forearmAngle: -60,
    toneClasses: {
      stroke: "bg-zinc-900",
      badge: "border-zinc-900 bg-zinc-900 text-white",
      accent: "text-zinc-900",
      marker: "bg-zinc-900",
    },
  },
  {
    id: "adjust-angle",
    label: "Adjust angle",
    cues: {
      haptic: "Rising buzz: lift your release path.",
      actuator: "Lift nudge + buzz: raise your path slightly.",
    },
    upperArmAngle: -40,
    forearmAngle: -82,
    toneClasses: {
      stroke: "bg-zinc-700",
      badge: "border-zinc-700 bg-zinc-700 text-white",
      accent: "text-zinc-700",
      marker: "bg-zinc-700",
    },
  },
  {
    id: "good-form",
    label: "Good form",
    cues: {
      haptic: "Single tap: keep this motion.",
      actuator: "Light hold + tap: repeat this motion.",
    },
    upperArmAngle: -56,
    forearmAngle: -104,
    toneClasses: {
      stroke: "bg-zinc-500",
      badge: "border-zinc-500 bg-zinc-500 text-white",
      accent: "text-zinc-600",
      marker: "bg-zinc-500",
    },
  },
];

function projectPoint(point: { x: number; y: number }, length: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: point.x + length * Math.cos(radians),
    y: point.y + length * Math.sin(radians),
  };
}

export default function RealtimeFeedbackSimulation() {
  const [stateIndex, setStateIndex] = useState(0);
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>("haptic");

  useEffect(() => {
    const timer = setInterval(() => {
      setStateIndex((current) => (current + 1) % SIMULATION_STATES.length);
    }, 2200);

    return () => clearInterval(timer);
  }, []);

  const currentState = SIMULATION_STATES[stateIndex];
  const currentMode = FEEDBACK_MODES.find((mode) => mode.id === feedbackMode) ?? FEEDBACK_MODES[0];
  const currentCue = currentState.cues[feedbackMode];

  const { elbowPoint, wristPoint, elbowAngle } = useMemo(() => {
    const elbow = projectPoint(
      SHOULDER_POINT,
      UPPER_ARM_LENGTH,
      currentState.upperArmAngle,
    );
    const wrist = projectPoint(elbow, FOREARM_LENGTH, currentState.forearmAngle);
    const angle = Math.round(Math.abs(currentState.forearmAngle - currentState.upperArmAngle));

    return { elbowPoint: elbow, wristPoint: wrist, elbowAngle: angle };
  }, [currentState]);

  return (
    <section className="w-full max-w-md border border-zinc-900 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Realtime Form Feedback
        </h3>
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-900" aria-hidden />
          Live
        </span>
      </div>

      <div className="space-y-3 border border-zinc-200 p-3">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Feedback mode
          </p>
          <div
            className="inline-flex w-full border border-zinc-300 bg-zinc-100 p-0.5"
            role="tablist"
            aria-label="Feedback mode selector"
          >
            {FEEDBACK_MODES.map((mode) => (
              <button
                key={mode.id}
                id={`feedback-mode-tab-${mode.id}`}
                role="tab"
                type="button"
                aria-selected={feedbackMode === mode.id}
                aria-controls={`feedback-mode-panel-${mode.id}`}
                onClick={() => setFeedbackMode(mode.id)}
                className={`flex-1 border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  feedbackMode === mode.id
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300 bg-white text-zinc-700"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            {currentMode.guidance}
          </p>
        </div>

        <p
          className={`inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] ${currentState.toneClasses.badge}`}
          aria-live="polite"
        >
          Feedback: {currentState.label}
        </p>

        <div className="relative h-32 overflow-hidden border border-zinc-200 bg-zinc-50">
          <div className="absolute bottom-6 left-4 right-4 h-px bg-zinc-300" aria-hidden />
          <div className="absolute left-[34px] bottom-6 top-4 w-px bg-zinc-200" aria-hidden />

          <div
            className={`absolute h-[3px] origin-left transition-all duration-700 ease-in-out ${currentState.toneClasses.stroke}`}
            style={{
              left: `${SHOULDER_POINT.x}px`,
              top: `${SHOULDER_POINT.y}px`,
              width: `${UPPER_ARM_LENGTH}px`,
              transform: `rotate(${currentState.upperArmAngle}deg)`,
            }}
            aria-hidden
          />

          <div
            className={`absolute h-[3px] origin-left transition-all duration-700 ease-in-out ${currentState.toneClasses.stroke}`}
            style={{
              left: `${elbowPoint.x}px`,
              top: `${elbowPoint.y}px`,
              width: `${FOREARM_LENGTH}px`,
              transform: `rotate(${currentState.forearmAngle}deg)`,
            }}
            aria-hidden
          />

          <div
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-900 bg-white transition-all duration-700 ease-in-out"
            style={{ left: `${SHOULDER_POINT.x}px`, top: `${SHOULDER_POINT.y}px` }}
            aria-hidden
          />
          <div
            className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white transition-all duration-700 ease-in-out ${currentState.toneClasses.marker}`}
            style={{ left: `${elbowPoint.x}px`, top: `${elbowPoint.y}px` }}
            aria-hidden
          />
          <div
            className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-700 ease-in-out ${currentState.toneClasses.marker} animate-pulse`}
            style={{ left: `${wristPoint.x}px`, top: `${wristPoint.y}px` }}
            aria-hidden
          />

          <div
            className="absolute rounded-full border border-dashed border-zinc-300 transition-all duration-700 ease-in-out"
            style={{
              left: `${elbowPoint.x - 18}px`,
              top: `${elbowPoint.y - 18}px`,
              width: "36px",
              height: "36px",
            }}
            aria-hidden
          />
        </div>

        <div
          id={`feedback-mode-panel-${feedbackMode}`}
          role="tabpanel"
          aria-labelledby={`feedback-mode-tab-${feedbackMode}`}
          className="space-y-0.5 text-xs font-semibold uppercase tracking-[0.12em]"
        >
          <p className={currentState.toneClasses.accent}>Cue: {currentCue}</p>
          <p className="text-zinc-500">
            Signal: {feedbackMode === "haptic" ? "Vibration cue" : "Vibration + directional assist"}
          </p>
          <p className="text-zinc-500">Elbow angle: {elbowAngle}°</p>
        </div>

        <div className="flex items-center gap-1.5" aria-label="Simulation state progress">
          {SIMULATION_STATES.map((state, index) => (
            <span
              key={state.id}
              className={`h-1.5 flex-1 border border-zinc-900 transition-all duration-500 ${
                index === stateIndex ? "bg-zinc-900" : "bg-white"
              }`}
              aria-hidden
            />
          ))}
        </div>
      </div>
    </section>
  );
}
