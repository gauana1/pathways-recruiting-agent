"use client";

import { useState, useRef, useCallback } from "react";
import type { FilmAnalysisResult, FilmContext } from "@/lib/types";
import { initMediaPipe, extractPoseFrames } from "@/lib/mediapipe";
import { computeBasketballMetrics } from "@/lib/metrics/basketball";

interface VideoAnalyzerProps {
  athleteId: string;
  onComplete: (result: FilmAnalysisResult) => void;
  onError?: (error: Error) => void;
}

type AnalysisStatus = "idle" | "analyzing" | "complete" | "error";

const CONTEXT_LABELS: Record<FilmContext, string> = {
  game_film: "Game Film",
  practice: "Practice",
  drill: "Drill",
};

export default function VideoAnalyzer({
  athleteId,
  onComplete,
  onError,
}: VideoAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sport] = useState<"basketball">("basketball");
  const [context, setContext] = useState<FilmContext>("game_film");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (selected: File | null) => {
      if (!selected) return;
      if (!selected.type.startsWith("video/")) {
        setErrorMessage("Please select a valid video file.");
        setStatus("error");
        return;
      }
      setFile(selected);
      setStatus("idle");
      setErrorMessage(null);
      setProgress(0);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      handleFileChange(dropped ?? null);
    },
    [handleFileChange]
  );

  const handleAnalyze = useCallback(async () => {
    if (!file) return;

    setStatus("analyzing");
    setProgress(0);
    setErrorMessage(null);

    try {
      await initMediaPipe();

      const keypoint_frames = await extractPoseFrames(file, (p) => {
        setProgress(p);
      });

      const metrics = computeBasketballMetrics(keypoint_frames);

      const result: FilmAnalysisResult = {
        athlete_id: athleteId,
        sport: "basketball",
        context,
        status: "completed",
        analyzed_at: new Date().toISOString(),
        frame_count: keypoint_frames.length,
        keypoint_frames,
        metrics,
      };

      setStatus("complete");
      onComplete(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setStatus("error");
      setErrorMessage(error.message);
      onError?.(error);
    }
  }, [file, athleteId, context, onComplete, onError]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 w-full max-w-xl mx-auto">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Film Analysis
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        Upload a video to extract pose keypoints and compute performance metrics.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors mb-4 ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : file
            ? "border-green-400 bg-green-50"
            : "border-gray-300 hover:border-gray-400 bg-gray-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <div className="text-green-600 mb-2">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {(file.size / 1024 / 1024).toFixed(1)} MB — click to replace
            </p>
          </>
        ) : (
          <>
            <div className="text-gray-400 mb-2">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-1">
              MP4, MOV, AVI, WEBM supported
            </p>
          </>
        )}
      </div>

      {/* Sport & Context */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Sport
          </label>
          <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 capitalize">
            {sport}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Film Context
          </label>
          <select
            value={context}
            onChange={(e) => setContext(e.target.value as FilmContext)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {(Object.keys(CONTEXT_LABELS) as FilmContext[]).map((c) => (
              <option key={c} value={c}>
                {CONTEXT_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress bar */}
      {status === "analyzing" && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Analyzing frames…</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {status === "error" && errorMessage && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Success */}
      {status === "complete" && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
          Analysis complete! Results are ready.
        </div>
      )}

      {/* Action button */}
      <button
        onClick={handleAnalyze}
        disabled={!file || status === "analyzing"}
        className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white"
      >
        {status === "analyzing" ? "Analyzing…" : "Analyze Video"}
      </button>
    </div>
  );
}
