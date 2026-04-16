"use client";

import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { PoseFrame, PoseKeypoint } from "./types";

const LANDMARK_NAMES = [
  "nose",
  "left_eye_inner",
  "left_eye",
  "left_eye_outer",
  "right_eye_inner",
  "right_eye",
  "right_eye_outer",
  "left_ear",
  "right_ear",
  "mouth_left",
  "mouth_right",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_pinky",
  "right_pinky",
  "left_index",
  "right_index",
  "left_thumb",
  "right_thumb",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
  "left_heel",
  "right_heel",
  "left_foot_index",
  "right_foot_index",
];

let poseLandmarker: PoseLandmarker | null = null;

export async function initMediaPipe(): Promise<PoseLandmarker> {
  if (poseLandmarker) return poseLandmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      delegate: "GPU",
    },
    runningMode: "IMAGE",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  return poseLandmarker;
}

export async function extractPoseFrames(
  videoFile: File,
  onProgress?: (progress: number) => void
): Promise<PoseFrame[]> {
  const landmarker = await initMediaPipe();

  const objectUrl = URL.createObjectURL(videoFile);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Could not get 2D canvas context");

  const video = document.createElement("video");
  video.src = objectUrl;
  video.muted = true;
  video.crossOrigin = "anonymous";

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Failed to load video"));
    });

    const duration = video.duration;
    const FRAME_INTERVAL_MS = 100;
    const totalFrames = Math.floor((duration * 1000) / FRAME_INTERVAL_MS);

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const frames: PoseFrame[] = [];

    for (let i = 0; i <= totalFrames; i++) {
      const timestampMs = i * FRAME_INTERVAL_MS;
      const timeSec = timestampMs / 1000;

      if (timeSec > duration) break;

      await seekVideo(video, timeSec);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const result = landmarker.detect(canvas);

      if (result.landmarks && result.landmarks.length > 0) {
        const rawLandmarks = result.landmarks[0];
        const keypoints: PoseKeypoint[] = rawLandmarks.map((lm, idx) => ({
          name: LANDMARK_NAMES[idx] ?? `landmark_${idx}`,
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        }));

        frames.push({
          frame_index: i,
          timestamp_ms: timestampMs,
          keypoints,
        });
      }

      if (onProgress) {
        onProgress(Math.round(((i + 1) / (totalFrames + 1)) * 100));
      }
    }

    return frames;
  } finally {
    URL.revokeObjectURL(objectUrl);
    video.src = "";
  }
}

function seekVideo(video: HTMLVideoElement, timeSec: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(new Error(`Seek failed at ${timeSec}s`));
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = timeSec;
  });
}
