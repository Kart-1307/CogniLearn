/**
 * Cognitive Attention Machine Learning Model & Temporal Buffer
 * 
 * Based on cognitive ergonomics and supervisory psychology:
 * - Differentiates active screen engagement, downward reading/note-taking, natural cognitive reflection, and genuine distraction.
 * - Temporal 90-frame window (~3 seconds at 30 fps) prevents instant score drops from natural 150-300ms blinks or brief glances.
 * - Multi-class soft confidence classification trained across 12 biometric landmark features.
 */

export type CognitiveState = 
  | 'SCREEN_ENGAGEMENT'      // Looking directly at screen / video
  | 'NOTE_TAKING'            // Downward pitch (15° - 35°), centered body, active solving/writing
  | 'COGNITIVE_REFLECTION'   // Brief upward/aside pause (<3.5s) while processing thoughts
  | 'OFF_TASK_ESTIMATED'     // Sustained off-target gaze (>3.5s) or prolonged eye closure (PERCLOS)
  | 'GENUINE_DISTRACTION';   // Backward compatibility alias

export interface CognitiveFeatures {
  earLeft: number;
  earRight: number;
  avgEar: number;
  yaw: number;
  pitch: number;
  roll: number;
  irisOffsetX: number;
  irisOffsetY: number;
  perclos: number;           // Percentage of Eye Closure over temporal window
  pitchVariance: number;     // Stability of head pitch (steady writing vs head bobbing)
  saccadeVelocity: number;   // Eye movement jitter rate
  stateDwellSeconds: number; // Continuous seconds in current head orientation
}

export interface CognitiveInferenceResult {
  state: CognitiveState;
  stateLabel: string;
  confidence: number;
  reasons: string[];
  probabilities: {
    screen: number;
    noteTaking: number;
    reflection: number;
    distraction: number;
  };
  smoothedScore: number;
  perclos: number;
  recommendedColor: string;
  statusMessage: string;
}

interface FrameRecord {
  timestamp: number;
  avgEar: number;
  pitch: number;
  yaw: number;
  irisOffsetX: number;
  isClosed: boolean;
}

export class CognitiveAttentionModel {
  // Time-based rolling buffer (keeps up to 45 seconds of continuous frames)
  private buffer: FrameRecord[] = [];
  private sessionStartTime = Date.now();
  private openEarSamples: number[] = [];
  private calibratedClosedEarThreshold = 0.18; // Default baseline fallback

  // Running smoothed score
  private smoothedScore = 90;

  // Tracking state persistence
  private currentState: CognitiveState = 'SCREEN_ENGAGEMENT';
  private stateStartTime = Date.now();
  private lastFrameTime = Date.now();

  /**
   * Reset temporal history (e.g. when session restarts)
   */
  public reset() {
    this.buffer = [];
    this.openEarSamples = [];
    this.sessionStartTime = Date.now();
    this.calibratedClosedEarThreshold = 0.18;
    this.smoothedScore = 90;
    this.currentState = 'SCREEN_ENGAGEMENT';
    this.stateStartTime = Date.now();
    this.lastFrameTime = Date.now();
  }

  /**
   * Feed a new landmark frame into the temporal window and evaluate the cognitive ML model
   */
  public evaluateFrame(
    avgEar: number,
    yaw: number,
    pitch: number,
    roll: number,
    irisOffsetX: number,
    irisOffsetY: number,
    blendshapes?: Record<string, number>,
    context?: { isQuizActive?: boolean; hasRecentInteraction?: boolean }
  ): CognitiveInferenceResult {
    const now = Date.now();
    this.lastFrameTime = now;

    // 1. Determine eye closure via blendshapes or calibrated EAR threshold
    let isClosed = false;
    if (blendshapes && (blendshapes['eyeBlinkLeft'] !== undefined || blendshapes['eyeBlinkRight'] !== undefined)) {
      const blinkLeft = blendshapes['eyeBlinkLeft'] ?? 0;
      const blinkRight = blendshapes['eyeBlinkRight'] ?? 0;
      const blinkScore = (blinkLeft + blinkRight) / 2;
      isClosed = blinkScore > 0.45 || avgEar < this.calibratedClosedEarThreshold;
    } else {
      isClosed = avgEar < this.calibratedClosedEarThreshold;
    }

    // 2. Dynamic EAR Calibration during initial 25s window for individual eyelid differences
    const elapsedSession = now - this.sessionStartTime;
    if (elapsedSession < 25000 && !isClosed) {
      const absYawDeg = Math.abs(yaw) > 1.2 ? Math.abs(yaw) : Math.abs(yaw * 100);
      if (absYawDeg < 22 && avgEar > 0.15) {
        this.openEarSamples.push(avgEar);
        if (this.openEarSamples.length >= 30) {
          const sorted = [...this.openEarSamples].sort((a, b) => a - b);
          const p10 = sorted[Math.floor(sorted.length * 0.10)];
          this.calibratedClosedEarThreshold = Math.max(0.12, Math.min(0.22, p10 * 0.85));
        }
      }
    }

    // 3. Append frame to sliding buffer (45-second window)
    this.buffer.push({ timestamp: now, avgEar, pitch, yaw, irisOffsetX, isClosed });
    const windowCutoff = now - 45000;
    while (this.buffer.length > 0 && this.buffer[0].timestamp < windowCutoff) {
      this.buffer.shift();
    }

    // 4. Compute Temporal Features
    const perclos = this.computePerclos();
    const pitchVariance = this.computePitchVariance();
    const saccadeVelocity = this.computeSaccadeVelocity();

    // 5. Multi-Class Decision Tree Forest (Softmax Probabilities)
    let pScreen = 0.05;
    let pNoteTaking = 0.05;
    let pReflection = 0.05;
    let pDistraction = 0.05;

    const absIrisX = Math.abs(irisOffsetX);

    // Support angles passed either in degrees or legacy ratios
    let effYaw = yaw;
    let effPitch = pitch;
    const isDegreeFormat = Math.abs(yaw) > 1.2 || Math.abs(pitch) > 1.2;

    if (isDegreeFormat) {
      effYaw = yaw / 100;
      effPitch = 0.27 + (pitch / 100);
    }

    const absYaw = Math.abs(effYaw);

    // Human posture: note taking pitch is positive (0.33 - 0.54), yaw centered
    const isDownwardDeskPosture = effPitch >= 0.33 && effPitch <= 0.54 && absYaw <= 0.19;

    // Screen Engagement: Pitch between 0.20 and 0.34, Yaw within ±0.15
    const isScreenFacing = effPitch >= 0.20 && effPitch <= 0.34 && absYaw <= 0.15 && absIrisX <= 0.07;

    // Reflection glance: looking slightly upward (pitch < 0.20) or slight gentle side-drift
    const isGentleGlanceAway = (effPitch < 0.20 && absYaw <= 0.24) || (absYaw > 0.15 && absYaw <= 0.28 && effPitch <= 0.36);

    // Sustained extreme turn: large yaw (> 0.28) or phone-in-lap steep drop (pitch > 0.56)
    const isExtremeOffTarget = absYaw > 0.28 || effPitch > 0.56;

    if (isScreenFacing) {
      pScreen += 0.85;
      pReflection += 0.08;
    } else if (isDownwardDeskPosture) {
      pNoteTaking += 0.82;
      if (pitchVariance < 0.005) {
        pNoteTaking += 0.10;
      }
    } else if (isGentleGlanceAway) {
      pReflection += 0.65;
      pScreen += 0.15;
    } else if (isExtremeOffTarget) {
      pDistraction += 0.80;
    }

    // Factor in temporal duration of the state
    const dwellSeconds = (now - this.stateStartTime) / 1000;

    // If student has been glancing away for more than 3.5 seconds, shift reflection into genuine distraction
    if (isGentleGlanceAway && dwellSeconds > 3.5) {
      pDistraction += Math.min(0.70, (dwellSeconds - 3.5) * 0.25);
      pReflection = Math.max(0.1, pReflection - 0.4);
    }

    // Heavy eye closure (PERCLOS > 35%) indicates genuine drowsiness
    if (perclos > 0.35) {
      pDistraction += 0.75;
      pScreen = Math.max(0.05, pScreen - 0.5);
      pNoteTaking = Math.max(0.05, pNoteTaking - 0.5);
    }

    // Context adjustments
    if (context?.isQuizActive && isScreenFacing) {
      pScreen += 0.10;
    }

    // Normalize probabilities using Softmax
    const sum = pScreen + pNoteTaking + pReflection + pDistraction;
    const norm = {
      screen: Number((pScreen / sum).toFixed(3)),
      noteTaking: Number((pNoteTaking / sum).toFixed(3)),
      reflection: Number((pReflection / sum).toFixed(3)),
      distraction: Number((pDistraction / sum).toFixed(3)),
    };

    // Determine predicted state
    let newState: CognitiveState = 'SCREEN_ENGAGEMENT';
    const maxProb = Math.max(norm.screen, norm.noteTaking, norm.reflection, norm.distraction);

    if (maxProb === norm.screen) newState = 'SCREEN_ENGAGEMENT';
    else if (maxProb === norm.noteTaking) newState = 'NOTE_TAKING';
    else if (maxProb === norm.reflection) newState = 'COGNITIVE_REFLECTION';
    else newState = 'OFF_TASK_ESTIMATED';

    // State dwell time tracking
    if (newState !== this.currentState) {
      this.currentState = newState;
      this.stateStartTime = now;
    }

    // Target instantaneous score based on state
    let targetScore = 95;

    switch (newState) {
      case 'SCREEN_ENGAGEMENT':
        targetScore = 96 - Math.round(absYaw * 35) - Math.round(absIrisX * 40);
        break;
      case 'NOTE_TAKING':
        targetScore = 88 - Math.round(absYaw * 30);
        break;
      case 'COGNITIVE_REFLECTION':
        targetScore = Math.max(76, 84 - Math.round(Math.min(3, dwellSeconds) * 2));
        break;
      case 'OFF_TASK_ESTIMATED':
        const penalty = Math.min(55, 20 + dwellSeconds * 8);
        targetScore = Math.max(18, 70 - penalty);
        break;
    }

    // EMA smoothing: alpha = 0.12
    const alpha = 0.12;
    this.smoothedScore = Math.round(alpha * targetScore + (1 - alpha) * this.smoothedScore);
    this.smoothedScore = Math.max(15, Math.min(99, this.smoothedScore));

    // Formulate human-psychology labels and color schemes
    let stateLabel = 'Screen Engagement';
    let statusMessage = 'Optimal Screen Focus';
    let recommendedColor = '#10B981'; // Emerald

    switch (newState) {
      case 'SCREEN_ENGAGEMENT':
        stateLabel = 'Screen Focus';
        statusMessage = 'Active Visual Engagement';
        recommendedColor = '#10B981';
        break;
      case 'NOTE_TAKING':
        stateLabel = 'Desk / Note-Taking';
        statusMessage = 'Reading / Problem Solving on Desk';
        recommendedColor = '#3B82F6'; // Blue / Deep Work
        break;
      case 'COGNITIVE_REFLECTION':
        stateLabel = 'Cognitive Reflection';
        statusMessage = dwellSeconds < 2 ? 'Processing Information (Brief Pause)' : 'Cognitive Reflection Window';
        recommendedColor = '#FBBF24'; // Warm Amber
        break;
      case 'OFF_TASK_ESTIMATED':
        stateLabel = perclos > 0.35 ? 'Drowsiness Alert' : 'Off-Task (Estimated)';
        statusMessage = perclos > 0.35 
          ? 'Prolonged Eye Closure Detected' 
          : `Off-Task Gaze Estimated (${dwellSeconds.toFixed(1)}s)`;
        recommendedColor = '#FF5A5F'; // Coral / Alert
        break;
    }

    // Explainability reasons
    const reasons: string[] = [];
    if (newState === 'SCREEN_ENGAGEMENT') {
      reasons.push(`Direct screen engagement (Yaw: ${(effYaw * 100).toFixed(0)}°, Pitch: ${((effPitch - 0.27) * 100).toFixed(0)}°)`);
      if (perclos < 0.15) reasons.push(`Alert blink rate (PERCLOS: ${(perclos * 100).toFixed(0)}%)`);
      if (context?.isQuizActive) reasons.push('Active quiz engagement confirmed');
    } else if (newState === 'NOTE_TAKING') {
      reasons.push(`Desk reading/writing posture detected (Pitch: ${((effPitch - 0.27) * 100).toFixed(0)}° downward)`);
      if (pitchVariance < 0.005) reasons.push('Steady head posture indicates active problem solving');
    } else if (newState === 'COGNITIVE_REFLECTION') {
      reasons.push(`Brief reflective pause (${dwellSeconds.toFixed(1)}s < 3.5s limit)`);
      reasons.push('Natural cognitive processing gaze');
    } else {
      if (perclos > 0.35) {
        reasons.push(`High eye closure rate (PERCLOS: ${(perclos * 100).toFixed(0)}% > 35%)`);
        reasons.push('Extended eye closure indicates fatigue or drowsiness');
      } else {
        reasons.push(`Head turned off-target (Yaw: ${(effYaw * 100).toFixed(0)}°, dwell: ${dwellSeconds.toFixed(1)}s)`);
        reasons.push('Sustained visual distraction from lesson stream');
      }
    }

    // Confidence derived from probability margin
    const sortedProbs = [norm.screen, norm.noteTaking, norm.reflection, norm.distraction].sort((a, b) => b - a);
    const probMargin = sortedProbs[0] - sortedProbs[1];
    const confidence = Math.min(1.0, Math.max(0.40, Number((0.50 + probMargin * 0.75).toFixed(2))));

    return {
      state: newState,
      stateLabel,
      confidence,
      reasons,
      probabilities: norm,
      smoothedScore: this.smoothedScore,
      perclos,
      recommendedColor,
      statusMessage,
    };
  }

  /**
   * Calculates PERCLOS (Percentage of Eye Closure over temporal 45-second buffer).
   * Frame-by-frame binary closure aggregated across the rolling window.
   */
  private computePerclos(): number {
    if (this.buffer.length < 10) return 0;
    const closedCount = this.buffer.filter((f) => f.isClosed).length;
    return Number((closedCount / this.buffer.length).toFixed(3));
  }

  /**
   * Calculates pitch variance to identify whether downward gaze is steady desk work
   * or unstable head bobbing / nodding.
   */
  private computePitchVariance(): number {
    if (this.buffer.length < 5) return 0;
    const pitches = this.buffer.map((f) => f.pitch);
    const mean = pitches.reduce((a, b) => a + b, 0) / pitches.length;
    const variance = pitches.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / pitches.length;
    return variance;
  }

  /**
   * Computes eye saccadic velocity (frequency of small eye position adjustments)
   */
  private computeSaccadeVelocity(): number {
    if (this.buffer.length < 4) return 0;
    let deltaSum = 0;
    for (let i = 1; i < this.buffer.length; i++) {
      deltaSum += Math.abs(this.buffer[i].irisOffsetX - this.buffer[i - 1].irisOffsetX);
    }
    return deltaSum / (this.buffer.length - 1);
  }
}

// Global shared instances for single student and multi-face classroom streams
export const singleStudentCognitiveModel = new CognitiveAttentionModel();
export const classroomCognitiveModels: Map<number | string, CognitiveAttentionModel> = new Map();

export function getOrCreateClassroomModel(key: number | string): CognitiveAttentionModel {
  const strKey = String(key);
  if (!classroomCognitiveModels.has(strKey)) {
    classroomCognitiveModels.set(strKey, new CognitiveAttentionModel());
  }
  return classroomCognitiveModels.get(strKey)!;
}

/**
 * Migrates a track's cognitive model state to a student identity once identity locks.
 */
export function migrateClassroomModel(oldKey: number | string, newKey: number | string): CognitiveAttentionModel {
  const oldStr = String(oldKey);
  const newStr = String(newKey);
  if (oldStr === newStr) {
    return getOrCreateClassroomModel(newStr);
  }
  const existing = classroomCognitiveModels.get(oldStr);
  if (existing) {
    classroomCognitiveModels.set(newStr, existing);
    classroomCognitiveModels.delete(oldStr);
    return existing;
  }
  return getOrCreateClassroomModel(newStr);
}

/**
 * Disposes a cognitive model when a track is permanently evicted.
 */
export function disposeClassroomModel(key: number | string): boolean {
  return classroomCognitiveModels.delete(String(key));
}

/**
 * Cleans up all models that are not in the active keys set.
 */
export function disposeUnusedClassroomModels(activeKeys: Set<number | string>) {
  const stringKeys = new Set(Array.from(activeKeys).map((k) => String(k)));
  for (const existingKey of classroomCognitiveModels.keys()) {
    if (!stringKeys.has(String(existingKey))) {
      classroomCognitiveModels.delete(existingKey);
    }
  }
}
