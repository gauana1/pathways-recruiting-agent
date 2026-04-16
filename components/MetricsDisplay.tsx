"use client";

import type { BasketballMetrics } from "@/lib/types";

interface MetricsDisplayProps {
  metrics: BasketballMetrics;
  className?: string;
}

export default function MetricsDisplay({
  metrics,
  className = "",
}: MetricsDisplayProps) {
  const entries = Object.entries(metrics.measurements);

  return (
    <div className={className}>
      {metrics.summary && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-800">
          {metrics.summary}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map(([key, measurement]) => (
          <div
            key={key}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-1"
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {measurement.label}
            </p>

            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-gray-900">
                {typeof measurement.value === "boolean"
                  ? measurement.value
                    ? "Yes"
                    : "No"
                  : typeof measurement.value === "number"
                  ? Number.isInteger(measurement.value)
                    ? measurement.value.toString()
                    : measurement.value.toFixed(2)
                  : measurement.value}
              </span>
              {measurement.unit && (
                <span className="text-sm text-gray-500">{measurement.unit}</span>
              )}
            </div>

            {measurement.description && (
              <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                {measurement.description}
              </p>
            )}

            {measurement.benchmark && (
              <p className="text-xs text-indigo-500 mt-1 italic">
                {measurement.benchmark}
              </p>
            )}

            {measurement.confidence !== undefined && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                  <span>Confidence</span>
                  <span>{Math.round(measurement.confidence * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-indigo-400 h-1.5 rounded-full"
                    style={{
                      width: `${Math.round(measurement.confidence * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
