/**
 * Configurable thresholds for multi-face identity assignment and hysteresis latching
 */

export interface IdentityMatchingConfig {
  acquireThreshold: number;          // Minimum cosine similarity to acquire identity (default: 0.45)
  acquireMargin: number;             // Minimum margin over second-best candidate (default: 0.08)
  acquireSustainedFrames: number;    // Consecutive frames required to acquire (default: 10)
  releaseThreshold: number;          // Minimum similarity to maintain identity (default: 0.30)
  releaseTimeoutMs: number;          // Inactivity duration before releasing identity (default: 2000ms)
  challengerMargin: number;          // Margin a challenger must hold over incumbent (default: 0.10)
  challengerSustainedFrames: number; // Frames challenger must sustain lead to switch (default: 15)
}

export const DEFAULT_IDENTITY_CONFIG: IdentityMatchingConfig = {
  acquireThreshold: 0.45,
  acquireMargin: 0.08,
  acquireSustainedFrames: 10,
  releaseThreshold: 0.30,
  releaseTimeoutMs: 2000,
  challengerMargin: 0.10,
  challengerSustainedFrames: 15,
};
