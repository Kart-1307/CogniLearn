/**
 * 5-Point Facial Similarity Alignment & Quality Gating Engine for Deep Biometric Embeddings
 * Uses Umeyama similarity transform to crop and align a 112x112 face canvas for MobileFaceNet/ArcFace.
 */

import { NormalizedLandmark } from '@mediapipe/tasks-vision';

// Standard reference coordinates for 112x112 aligned face crop (InsightFace / ArcFace convention)
export const ARCFACE_112_TARGET_PTS: [number, number][] = [
  [38.2946, 51.6963], // Left Eye pupil / iris
  [73.5318, 51.5014], // Right Eye pupil / iris
  [56.0252, 71.7366], // Nose tip
  [41.5493, 92.3655], // Left mouth corner
  [70.7299, 92.2041], // Right mouth corner
];

export interface QualityGateResult {
  isQualityGood: boolean;
  reason?: string;
  blurVariance: number;
}

/**
 * Evaluates whether a detected face passes geometric and optical quality gates
 * before triggering ONNX deep embedding inference.
 */
export function checkFaceQualityGate(
  landmarks: NormalizedLandmark[],
  imageWidth: number,
  imageHeight: number,
  yawDegrees: number,
  pitchDegrees: number,
  faceWidthPx: number,
  canvasSource?: HTMLCanvasElement | HTMLVideoElement | null
): QualityGateResult {
  // 1. Pose Angle Gate: Reject extreme profile or tilted angles
  if (Math.abs(yawDegrees) > 30) {
    return { isQualityGood: false, reason: 'Head yaw exceeded ±30° threshold', blurVariance: 0 };
  }
  if (Math.abs(pitchDegrees) > 25) {
    return { isQualityGood: false, reason: 'Head pitch exceeded ±25° threshold', blurVariance: 0 };
  }

  // 2. Minimum Resolution Gate: Must be at least 80 pixels wide in the camera view
  if (faceWidthPx < 80) {
    return { isQualityGood: false, reason: 'Face width is below 80px resolution threshold', blurVariance: 0 };
  }

  // 3. Laplacian Variance Sharpness / Blur Check
  let blurVariance = 80; // Default pass if canvas not provided
  if (canvasSource) {
    try {
      const nose = landmarks[1];
      const cx = Math.round(nose.x * imageWidth);
      const cy = Math.round(nose.y * imageHeight);
      const sampleSize = 48;
      const sx = Math.max(0, cx - sampleSize / 2);
      const sy = Math.max(0, cy - sampleSize / 2);

      const off = document.createElement('canvas');
      off.width = sampleSize;
      off.height = sampleSize;
      const ctx = off.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvasSource, sx, sy, sampleSize, sampleSize, 0, 0, sampleSize, sampleSize);
        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

        // Convert to grayscale
        const gray = new Float32Array(sampleSize * sampleSize);
        for (let i = 0; i < imgData.length; i += 4) {
          gray[i / 4] = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
        }

        // 3x3 Discrete Laplacian kernel: [0, 1, 0; 1, -4, 1; 0, 1, 0]
        let sum = 0;
        let sqSum = 0;
        let count = 0;

        for (let y = 1; y < sampleSize - 1; y++) {
          for (let x = 1; x < sampleSize - 1; x++) {
            const idx = y * sampleSize + x;
            const lap =
              gray[idx - 1] +
              gray[idx + 1] +
              gray[idx - sampleSize] +
              gray[idx + sampleSize] -
              4 * gray[idx];

            sum += lap;
            sqSum += lap * lap;
            count++;
          }
        }

        const mean = sum / count;
        blurVariance = Math.max(0, sqSum / count - mean * mean);

        if (blurVariance < 32) {
          return { isQualityGood: false, reason: 'Motion blur detected on face crop', blurVariance };
        }
      }
    } catch {
      // Fallback pass if canvas readback is restricted
    }
  }

  return { isQualityGood: true, blurVariance };
}

/**
 * Computes 2D similarity transform (Umeyama algorithm for 5 points)
 * Returns 2x3 affine matrix [a, -b, tx; b, a, ty]
 */
export function estimateSimilarityTransform(
  srcPts: [number, number][],
  dstPts: [number, number][] = ARCFACE_112_TARGET_PTS
): { a: number; b: number; tx: number; ty: number } {
  const n = srcPts.length;
  let srcMeanX = 0, srcMeanY = 0, dstMeanX = 0, dstMeanY = 0;

  for (let i = 0; i < n; i++) {
    srcMeanX += srcPts[i][0];
    srcMeanY += srcPts[i][1];
    dstMeanX += dstPts[i][0];
    dstMeanY += dstPts[i][1];
  }
  srcMeanX /= n;
  srcMeanY /= n;
  dstMeanX /= n;
  dstMeanY /= n;

  let srcVar = 0;
  let numA = 0;
  let numB = 0;

  for (let i = 0; i < n; i++) {
    const sX = srcPts[i][0] - srcMeanX;
    const sY = srcPts[i][1] - srcMeanY;
    const dX = dstPts[i][0] - dstMeanX;
    const dY = dstPts[i][1] - dstMeanY;

    srcVar += sX * sX + sY * sY;
    numA += sX * dX + sY * dY;
    numB += sX * dY - sY * dX;
  }

  const s = srcVar > 1e-4 ? 1 / srcVar : 1;
  const a = numA * s;
  const b = numB * s;
  const tx = dstMeanX - (a * srcMeanX - b * srcMeanY);
  const ty = dstMeanY - (b * srcMeanX + a * srcMeanY);

  return { a, b, tx, ty };
}

/**
 * Extracts a normalized 112x112 face crop aligned via 5 key landmark anchors
 */
export function alignFaceCrop112(
  videoOrCanvas: HTMLVideoElement | HTMLCanvasElement,
  landmarks: NormalizedLandmark[],
  imageWidth: number,
  imageHeight: number
): HTMLCanvasElement | null {
  if (!landmarks || landmarks.length < 478) return null;

  // Extract 5 keypoints in pixel space
  const leftEye: [number, number] = [
    (landmarks[468]?.x ?? (landmarks[33].x + landmarks[133].x) / 2) * imageWidth,
    (landmarks[468]?.y ?? (landmarks[33].y + landmarks[133].y) / 2) * imageHeight,
  ];
  const rightEye: [number, number] = [
    (landmarks[473]?.x ?? (landmarks[263].x + landmarks[362].x) / 2) * imageWidth,
    (landmarks[473]?.y ?? (landmarks[263].y + landmarks[362].y) / 2) * imageHeight,
  ];
  const nose: [number, number] = [landmarks[1].x * imageWidth, landmarks[1].y * imageHeight];
  const leftMouth: [number, number] = [landmarks[61].x * imageWidth, landmarks[61].y * imageHeight];
  const rightMouth: [number, number] = [landmarks[291].x * imageWidth, landmarks[291].y * imageHeight];

  const srcPts: [number, number][] = [leftEye, rightEye, nose, leftMouth, rightMouth];
  const { a, b, tx, ty } = estimateSimilarityTransform(srcPts, ARCFACE_112_TARGET_PTS);

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = 112;
  cropCanvas.height = 112;
  const ctx = cropCanvas.getContext('2d');
  if (!ctx) return null;

  ctx.save();
  ctx.setTransform(a, b, -b, a, tx, ty);
  ctx.drawImage(videoOrCanvas, 0, 0);
  ctx.restore();

  return cropCanvas;
}

/**
 * Converts a 112x112 aligned canvas into a normalized [1, 3, 112, 112] NCHW Float32Array
 * for ONNX Runtime MobileFaceNet inference: (pixel - 127.5) / 128.0
 */
export function preprocessCropToFloat32Array(cropCanvas: HTMLCanvasElement): Float32Array {
  const ctx = cropCanvas.getContext('2d');
  const imgData = ctx ? ctx.getImageData(0, 0, 112, 112).data : new Uint8ClampedArray(112 * 112 * 4);

  const float32 = new Float32Array(1 * 3 * 112 * 112);
  const numPixels = 112 * 112;

  for (let i = 0; i < numPixels; i++) {
    const r = imgData[i * 4];
    const g = imgData[i * 4 + 1];
    const b = imgData[i * 4 + 2];

    // Standard ArcFace / MobileFaceNet normalization to [-1, 1] range: (x - 127.5) / 128.0
    float32[i] = (r - 127.5) / 128.0;               // Channel R
    float32[numPixels + i] = (g - 127.5) / 128.0;   // Channel G
    float32[2 * numPixels + i] = (b - 127.5) / 128.0; // Channel B
  }

  return float32;
}

/**
 * Normalizes a 512-D vector to unit L2 norm
 */
export function l2Normalize(vector: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1e-6;
  const normalized = new Array(vector.length);
  for (let i = 0; i < vector.length; i++) {
    normalized[i] = vector[i] / norm;
  }
  return normalized;
}
