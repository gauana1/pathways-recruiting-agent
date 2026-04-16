import type {
  PoseFrame,
  PoseKeypoint,
  BasketballMetrics,
  MetricMeasurement,
  JsonObject,
} from "../types";

export type ComputeBasketballMetrics = typeof computeBasketballMetrics;

function getKeypoint(
  frame: PoseFrame,
  name: string
): PoseKeypoint | undefined {
  return frame.keypoints.find((kp) => kp.name === name);
}

function angleBetweenThreePoints(
  a: PoseKeypoint,
  b: PoseKeypoint,
  c: PoseKeypoint
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let degrees = Math.abs(radians * (180 / Math.PI));
  if (degrees > 180) degrees = 360 - degrees;
  return degrees;
}

function distance2D(a: PoseKeypoint, b: PoseKeypoint): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

export function computeBasketballMetrics(
  frames: PoseFrame[]
): BasketballMetrics {
  if (frames.length === 0) {
    const empty: Record<string, MetricMeasurement> = {
      frame_count: {
        label: "Frames Analyzed",
        value: 0,
        description: "Total frames processed",
      },
      avg_visibility: {
        label: "Average Visibility",
        value: 0,
        unit: "score",
        description: "Average keypoint visibility across all frames",
      },
    };
    return {
      sport: "basketball",
      summary: "No frames available for analysis.",
      measurements: empty,
      raw: { frame_count: 0, avg_visibility: 0 },
    };
  }

  // --- Hip trajectory (normalized y, lower y = higher in frame) ---
  const hipTrajectory: { frame: number; y: number }[] = [];
  for (const frame of frames) {
    const lHip = getKeypoint(frame, "left_hip");
    const rHip = getKeypoint(frame, "right_hip");
    if (lHip && rHip) {
      hipTrajectory.push({
        frame: frame.frame_index,
        y: (lHip.y + rHip.y) / 2,
      });
    }
  }

  // --- Jump height ---
  let jumpHeightInches = 0;
  let jumpConfidence = 0;
  if (hipTrajectory.length > 1) {
    const ys = hipTrajectory.map((h) => h.y);
    const maxY = Math.max(...ys);
    const minY = Math.min(...ys);
    // Normalized displacement (0-1 range) converted to rough inches (assuming ~60in body height visible)
    const displacementNorm = maxY - minY;
    jumpHeightInches = Math.round(displacementNorm * 60 * 10) / 10;
    jumpConfidence = Math.min(1, hipTrajectory.length / frames.length);
  }

  // --- Right elbow angles ---
  const rightElbowAngles: number[] = [];
  for (const frame of frames) {
    const shoulder = getKeypoint(frame, "right_shoulder");
    const elbow = getKeypoint(frame, "right_elbow");
    const wrist = getKeypoint(frame, "right_wrist");
    if (shoulder && elbow && wrist) {
      rightElbowAngles.push(angleBetweenThreePoints(shoulder, elbow, wrist));
    }
  }
  const avgElbowAngle =
    rightElbowAngles.length > 0
      ? Math.round(
          (rightElbowAngles.reduce((a, b) => a + b, 0) /
            rightElbowAngles.length) *
            10
        ) / 10
      : 0;

  // --- Hip rotation range ---
  const hipAngles: number[] = [];
  for (const frame of frames) {
    const lHip = getKeypoint(frame, "left_hip");
    const rHip = getKeypoint(frame, "right_hip");
    if (lHip && rHip) {
      const angle =
        Math.atan2(rHip.y - lHip.y, rHip.x - lHip.x) * (180 / Math.PI);
      hipAngles.push(angle);
    }
  }
  let hipRotationRange = 0;
  if (hipAngles.length > 0) {
    hipRotationRange =
      Math.round((Math.max(...hipAngles) - Math.min(...hipAngles)) * 10) / 10;
  }

  // --- Lateral quickness (left hip horizontal movement) ---
  const leftHipXPositions: number[] = [];
  for (const frame of frames) {
    const lHip = getKeypoint(frame, "left_hip");
    if (lHip) leftHipXPositions.push(lHip.x);
  }
  let lateralQuickness = 0;
  if (leftHipXPositions.length > 1 && frames.length > 1) {
    let totalDx = 0;
    for (let i = 1; i < leftHipXPositions.length; i++) {
      totalDx += Math.abs(leftHipXPositions[i] - leftHipXPositions[i - 1]);
    }
    const totalTimeMs = frames[frames.length - 1].timestamp_ms - frames[0].timestamp_ms;
    lateralQuickness =
      totalTimeMs > 0
        ? Math.round((totalDx / totalTimeMs) * 1000 * 1000) / 1000
        : 0;
  }

  // --- Stance width (ankle distance / shoulder distance) ---
  const stanceRatios: number[] = [];
  for (const frame of frames) {
    const lAnkle = getKeypoint(frame, "left_ankle");
    const rAnkle = getKeypoint(frame, "right_ankle");
    const lShoulder = getKeypoint(frame, "left_shoulder");
    const rShoulder = getKeypoint(frame, "right_shoulder");
    if (lAnkle && rAnkle && lShoulder && rShoulder) {
      const ankleWidth = distance2D(lAnkle, rAnkle);
      const shoulderWidth = distance2D(lShoulder, rShoulder);
      if (shoulderWidth > 0) {
        stanceRatios.push(ankleWidth / shoulderWidth);
      }
    }
  }
  const avgStanceWidth =
    stanceRatios.length > 0
      ? Math.round(
          (stanceRatios.reduce((a, b) => a + b, 0) / stanceRatios.length) *
            100
        ) / 100
      : 0;

  // --- Balance score (variance of hip midpoint y) ---
  let balanceScore = 0;
  if (hipTrajectory.length > 1) {
    const ys = hipTrajectory.map((h) => h.y);
    const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
    const variance = ys.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / ys.length;
    // Lower variance = more stable = higher score
    balanceScore = Math.round(Math.max(0, Math.min(100, 100 - variance * 10000)));
  }

  // --- Avg visibility ---
  let totalVis = 0;
  let visCount = 0;
  for (const frame of frames) {
    for (const kp of frame.keypoints) {
      if (kp.visibility !== undefined) {
        totalVis += kp.visibility;
        visCount++;
      }
    }
  }
  const avgVisibility =
    visCount > 0 ? Math.round((totalVis / visCount) * 1000) / 1000 : 0;

  const measurements: Record<string, MetricMeasurement> = {
    jump_height: {
      label: "Vertical Jump Height",
      value: jumpHeightInches,
      unit: "inches",
      description: "Estimated vertical jump height from hip midpoint displacement",
      benchmark: "D1: 28+ inches, D2: 24+ inches, D3: 20+ inches",
      confidence: Math.round(jumpConfidence * 100) / 100,
    },
    shooting_elbow_angle: {
      label: "Shooting Elbow Angle",
      value: avgElbowAngle,
      unit: "degrees",
      description: "Average right elbow angle during motion",
      benchmark: "Ideal: 90 degrees at set point",
      confidence: rightElbowAngles.length > 0 ? Math.min(1, rightElbowAngles.length / frames.length) : 0,
    },
    hip_rotation_range: {
      label: "Hip Rotation Range",
      value: hipRotationRange,
      unit: "degrees",
      description: "Total hip rotation range across all frames",
      benchmark: "Elite: 45+ degrees",
      confidence: hipAngles.length > 0 ? Math.min(1, hipAngles.length / frames.length) : 0,
    },
    lateral_quickness: {
      label: "Lateral Quickness",
      value: lateralQuickness,
      unit: "units",
      description: "Horizontal movement speed estimate (normalized pixels/ms)",
      benchmark: "Elite: 0.8+ units",
      confidence: leftHipXPositions.length > 0 ? Math.min(1, leftHipXPositions.length / frames.length) : 0,
    },
    stance_width: {
      label: "Stance Width",
      value: avgStanceWidth,
      unit: "x shoulder width",
      description: "Average ankle-to-ankle distance relative to shoulder width",
      benchmark: "Ideal: 1.0–1.5x shoulder width",
      confidence: stanceRatios.length > 0 ? Math.min(1, stanceRatios.length / frames.length) : 0,
    },
    balance_score: {
      label: "Balance Score",
      value: balanceScore,
      unit: "/ 100",
      description: "Center of mass stability based on hip midpoint variance",
      benchmark: "Elite: 85+",
      confidence: hipTrajectory.length > 0 ? Math.min(1, hipTrajectory.length / frames.length) : 0,
    },
    frame_count: {
      label: "Frames Analyzed",
      value: frames.length,
      description: "Total number of frames processed",
    },
    avg_visibility: {
      label: "Average Visibility",
      value: avgVisibility,
      unit: "score",
      description: "Average keypoint visibility score across all frames (0–1)",
    },
  };

  const raw: JsonObject = {
    frame_count: frames.length,
    avg_visibility: avgVisibility,
    hip_trajectory: hipTrajectory as unknown as JsonObject[],
    right_elbow_angles: rightElbowAngles,
    left_hip_x_positions: leftHipXPositions,
  };

  const summary = `Analyzed ${frames.length} frames. Estimated jump height: ${jumpHeightInches} in. Balance score: ${balanceScore}/100. Avg elbow angle: ${avgElbowAngle}°.`;

  return {
    sport: "basketball",
    summary,
    measurements,
    raw,
  };
}
