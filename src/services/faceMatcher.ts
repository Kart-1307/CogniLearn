import { FaceLandmarker, FilesetResolver, NormalizedLandmark, Matrix } from '@mediapipe/tasks-vision';
import {
  RegisteredStudentProfile,
  MultiFaceMatchResult,
  FaceAnalysisResult,
  analyzeFaceLandmarks,
} from './faceTracker';
import {
  migrateClassroomModel,
  disposeClassroomModel,
} from './cognitiveModel';

export interface PreprocessedProfilePhoto {
  width: number;
  height: number;
  grayscaleVector: number[];
  normalizedFloatVector: number[];
  dataUrl: string;
  hasDetectedFace: boolean;
  landmarks?: NormalizedLandmark[];
  featureVector?: number[];
}

export interface MatchScoreResult {
  student: RegisteredStudentProfile;
  geometrySimilarity: number;
  grayscaleSimilarity: number;
  combinedConfidence: number;
  distance: number;
}

let imageFaceLandmarker: FaceLandmarker | null = null;
let imageLandmarkerPromise: Promise<FaceLandmarker | null> | null = null;

/**
 * Singleton instance of FaceLandmarker in 'IMAGE' mode for extracting exact 468 landmarks from static profile photos.
 */
export async function getImageFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (imageFaceLandmarker) return imageFaceLandmarker;
  if (imageLandmarkerPromise) return imageLandmarkerPromise;

  imageLandmarkerPromise = (async () => {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );

      const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numFaces: 1,
        minFaceDetectionConfidence: 0.35,
        minFacePresenceConfidence: 0.35,
      });

      imageFaceLandmarker = landmarker;
      return imageFaceLandmarker;
    } catch (err) {
      console.warn('FaceLandmarker IMAGE mode GPU init failed, falling back to CPU:', err);
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'IMAGE',
          numFaces: 1,
          minFaceDetectionConfidence: 0.35,
          minFacePresenceConfidence: 0.35,
        });
        imageFaceLandmarker = landmarker;
        return imageFaceLandmarker;
      } catch (cpuErr) {
        console.error('Failed to initialize Image FaceLandmarker:', cpuErr);
        return null;
      }
    }
  })();

  return imageLandmarkerPromise;
}

/**
 * Calculates scale-invariant 24-dimensional facial geometry ratio vector from MediaPipe 468 facial landmarks.
 * Includes 3D head yaw/pitch compensation, bilateral symmetry ratios, and inter-ocular proportions.
 */
export function extractFacialGeometryVector(
  landmarks: NormalizedLandmark[],
  imageWidth: number = 640,
  imageHeight: number = 480
): number[] {
  if (!landmarks || landmarks.length < 468) return [];

  // Convert landmarks to isotropic pixel coordinates before computing distance ratios
  const px = (pt: NormalizedLandmark) => ({
    x: pt.x * imageWidth,
    y: pt.y * imageHeight,
    z: (pt.z || 0) * imageWidth,
  });

  const leftEyeOuter = px(landmarks[33]);
  const rightEyeOuter = px(landmarks[263]);
  const leftEyeInner = px(landmarks[133]);
  const rightEyeInner = px(landmarks[362]);
  const noseTip = px(landmarks[1]);
  const chin = px(landmarks[152]);
  const mouthLeft = px(landmarks[61]);
  const mouthRight = px(landmarks[291]);
  const leftCheek = px(landmarks[234]);
  const rightCheek = px(landmarks[454]);
  const forehead = px(landmarks[10]);
  const noseBridge = px(landmarks[6]);
  const leftEyebrow = px(landmarks[70]);
  const rightEyebrow = px(landmarks[300]);
  const upperLip = px(landmarks[13]);
  const lowerLip = px(landmarks[14]);
  const leftEyeTop = px(landmarks[159]);
  const leftEyeBottom = px(landmarks[145]);
  const rightEyeTop = px(landmarks[386]);
  const rightEyeBottom = px(landmarks[374]);

  // Base Inter-pupillary / outer eye distance baseline in pixel space
  const rawEyeDist = Math.hypot(rightEyeOuter.x - leftEyeOuter.x, rightEyeOuter.y - leftEyeOuter.y) || 1;

  // Yaw & Pitch estimation for 3D Pose Normalization
  const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
  const eyeMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
  const yaw = (noseTip.x - eyeMidX) / rawEyeDist;
  const pitch = (noseTip.y - eyeMidY) / rawEyeDist;

  // Head turn foreshortening correction factor
  const yawFactor = Math.max(0.60, Math.cos(yaw * 1.30));
  const pitchFactor = Math.max(0.60, Math.cos((pitch - 0.28) * 1.30));
  const eyeDist = rawEyeDist / yawFactor;

  // 24 Scale-Invariant Biometric Ratios (computed in isotropic pixel coordinates)
  const v1 = (Math.hypot(noseTip.x - leftEyeOuter.x, noseTip.y - leftEyeOuter.y) / eyeDist) * (yaw < 0 ? 1 / yawFactor : 1);
  const v2 = (Math.hypot(noseTip.x - rightEyeOuter.x, noseTip.y - rightEyeOuter.y) / eyeDist) * (yaw > 0 ? 1 / yawFactor : 1);
  const v3 = (Math.hypot(noseTip.x - chin.x, noseTip.y - chin.y) / eyeDist) / pitchFactor;
  const v4 = Math.hypot(mouthRight.x - mouthLeft.x, mouthRight.y - mouthLeft.y) / eyeDist;
  const v5 = (Math.hypot(rightCheek.x - leftCheek.x, rightCheek.y - leftCheek.y) / eyeDist) / yawFactor;
  const v6 = (Math.hypot(chin.y - forehead.y, chin.x - forehead.x) / eyeDist) / pitchFactor;
  const v7 = Math.hypot(mouthLeft.x - leftEyeOuter.x, mouthLeft.y - leftEyeOuter.y) / eyeDist;
  const v8 = Math.hypot(mouthRight.x - rightEyeOuter.x, mouthRight.y - rightEyeOuter.y) / eyeDist;
  const v9 = (Math.hypot(noseBridge.x - chin.x, noseBridge.y - chin.y) / eyeDist) / pitchFactor;
  const v10 = Math.hypot(rightEyebrow.x - leftEyebrow.x, rightEyebrow.y - leftEyebrow.y) / eyeDist;
  const v11 = (Math.hypot(noseTip.x - forehead.x, noseTip.y - forehead.y) / eyeDist) / pitchFactor;
  const v12 = Math.hypot((mouthLeft.x + mouthRight.x) / 2 - noseTip.x, (mouthLeft.y + mouthRight.y) / 2 - noseTip.y) / eyeDist;
  const v13 = Math.hypot(rightEyeInner.x - leftEyeInner.x, rightEyeInner.y - leftEyeInner.y) / eyeDist;
  const v14 = Math.hypot(upperLip.x - lowerLip.x, upperLip.y - lowerLip.y) / eyeDist;
  const v15 = Math.hypot(leftEyebrow.x - leftEyeOuter.x, leftEyebrow.y - leftEyeOuter.y) / eyeDist;
  const v16 = Math.hypot(rightEyebrow.x - rightEyeOuter.x, rightEyebrow.y - rightEyeOuter.y) / eyeDist;
  const v17 = Math.hypot(noseBridge.x - noseTip.x, noseBridge.y - noseTip.y) / eyeDist;
  const v18 = Math.hypot(leftCheek.x - chin.x, leftCheek.y - chin.y) / eyeDist;
  const v19 = Math.hypot(rightCheek.x - chin.x, rightCheek.y - chin.y) / eyeDist;
  const v20 = Math.hypot(noseTip.x - leftEyeInner.x, noseTip.y - leftEyeInner.y) / eyeDist;
  const v21 = Math.hypot(noseTip.x - rightEyeInner.x, noseTip.y - rightEyeInner.y) / eyeDist;
  const v22 = Math.hypot(leftEyeTop.x - leftEyeBottom.x, leftEyeTop.y - leftEyeBottom.y) / eyeDist;
  const v23 = Math.hypot(rightEyeTop.x - rightEyeBottom.x, rightEyeTop.y - rightEyeBottom.y) / eyeDist;
  const v24 = (Math.hypot(mouthLeft.x - noseTip.x, mouthLeft.y - noseTip.y) / (Math.hypot(mouthRight.x - noseTip.x, mouthRight.y - noseTip.y) || 1));

  return [
    v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12,
    v13, v14, v15, v16, v17, v18, v19, v20, v21, v22, v23, v24
  ];
}

/**
 * Extracts 468 facial landmarks directly from a profile image source (data URL, image element, canvas)
 */
export async function extractFeaturesFromProfilePhoto(
  imageSource: string | HTMLImageElement | HTMLCanvasElement,
  targetSize: number = 320
): Promise<{ landmarks: NormalizedLandmark[] | null; featureVector: number[] | null; dataUrl: string }> {
  return new Promise((resolve) => {
    const processImageElement = async (imgEl: HTMLImageElement | HTMLCanvasElement) => {
      try {
        const landmarker = await getImageFaceLandmarker();
        let landmarks: NormalizedLandmark[] | null = null;
        let featureVector: number[] | null = null;

        if (landmarker) {
          const detection = landmarker.detect(imgEl);
          if (detection && detection.faceLandmarks && detection.faceLandmarks.length > 0) {
            landmarks = detection.faceLandmarks[0];
            featureVector = extractFacialGeometryVector(landmarks);
          }
        }

        // Generate dataUrl
        let dataUrl = '';
        if (imgEl instanceof HTMLCanvasElement) {
          dataUrl = imgEl.toDataURL('image/jpeg', 0.85);
        } else {
          const off = document.createElement('canvas');
          off.width = imgEl.naturalWidth || targetSize;
          off.height = imgEl.naturalHeight || targetSize;
          const ctx = off.getContext('2d');
          if (ctx) {
            ctx.drawImage(imgEl, 0, 0);
            dataUrl = off.toDataURL('image/jpeg', 0.85);
          }
        }

        resolve({ landmarks, featureVector, dataUrl });
      } catch (err) {
        console.warn('Profile photo landmark extraction error:', err);
        resolve({ landmarks: null, featureVector: null, dataUrl: '' });
      }
    };

    if (typeof imageSource === 'string') {
      if (!imageSource || imageSource.trim() === '') {
        resolve({ landmarks: null, featureVector: null, dataUrl: '' });
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        processImageElement(img);
      };
      img.onerror = () => {
        resolve({ landmarks: null, featureVector: null, dataUrl: '' });
      };
      img.src = imageSource;
    } else if (imageSource instanceof HTMLImageElement) {
      if (imageSource.complete) {
        processImageElement(imageSource);
      } else {
        imageSource.onload = () => processImageElement(imageSource);
        imageSource.onerror = () => resolve({ landmarks: null, featureVector: null, dataUrl: '' });
      }
    } else if (imageSource instanceof HTMLCanvasElement) {
      processImageElement(imageSource);
    } else {
      resolve({ landmarks: null, featureVector: null, dataUrl: '' });
    }
  });
}

/**
 * Preprocesses a list of registered students: extracts exact face landmarks from their uploaded profile photos.
 */
export async function preprocessStudentProfilesDatabase(
  students: RegisteredStudentProfile[],
  targetSize: number = 320
): Promise<RegisteredStudentProfile[]> {
  return Promise.all(
    students.map(async (student) => {
      // If student already has a calibrated feature vector, keep it
      if (student.featureVector && student.featureVector.length === 24) {
        return student;
      }

      if (!student.avatar || student.avatar.trim() === '') {
        return student;
      }

      try {
        const { featureVector, dataUrl } = await extractFeaturesFromProfilePhoto(
          student.avatar,
          targetSize
        );

        if (featureVector && featureVector.length > 0) {
          return {
            ...student,
            featureVector,
            preprocessedDataUrl: dataUrl || student.avatar,
          };
        }
        return student;
      } catch (err) {
        console.warn(`Landmark extraction failed for student ${student.name}:`, err);
        return student;
      }
    })
  );
}

/**
 * Enrolls live detected camera landmarks onto a student profile.
 */
export function enrollLiveFaceToStudent(
  student: RegisteredStudentProfile,
  landmarks: NormalizedLandmark[]
): RegisteredStudentProfile {
  const vec = extractFacialGeometryVector(landmarks);
  return {
    ...student,
    featureVector: vec,
  };
}

/**
 * Calculates Cosine Similarity between two numerical vectors.
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculates weighted biometric similarity (0-100) between a live face geometry vector and a student profile vector.
 * Supports both 512-D deep metric embeddings (MobileFaceNet/ArcFace) and 24-D geometric landmark ratios.
 */
export function computeBiometricSimilarity(liveVec: number[], refVec: number[]): { similarity: number; distance: number } {
  if (!liveVec || !refVec || liveVec.length === 0 || refVec.length === 0) {
    return { similarity: 0, distance: 999 };
  }

  // Deep Metric 512-D Embedding Comparison (Cosine metric)
  if (liveVec.length >= 128 && refVec.length >= 128 && liveVec.length === refVec.length) {
    const cosSim = calculateCosineSimilarity(liveVec, refVec);
    // In MobileFaceNet / ArcFace space, >= 0.40 indicates high confidence identity match
    // Map cosine similarity [0.15, 0.80] to [0, 99%]
    const scaledScore = Math.max(0, Math.min(99, Math.round(((cosSim - 0.15) / 0.65) * 100)));
    return { similarity: scaledScore, distance: Math.max(0, 1 - cosSim) };
  }

  // 24-D Geometric Ratio Comparison (Fallback)
  const len = Math.min(liveVec.length, refVec.length);
  let distSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < len; i++) {
    // Critical eye, nose, and chin distances have higher discriminative weights
    let weight = 1.0;
    if (i < 4) weight = 1.6;       // Nose to eyes
    else if (i === 4 || i === 5) weight = 1.4; // Cheek & facial height
    else if (i < 12) weight = 1.2;
    else if (i >= 21) weight = 1.1; // Eye aspect ratios

    distSum += weight * Math.pow(liveVec[i] - refVec[i], 2);
    totalWeight += weight;
  }

  const weightedDist = Math.sqrt(distSum / (totalWeight || 1));
  const cosSim = calculateCosineSimilarity(liveVec.slice(0, len), refVec.slice(0, len));

  // Convert distance and cosine similarity into a calibrated 0-100% confidence scale
  const distScore = Math.max(0, 1 - weightedDist / 0.85);
  const cosScore = Math.max(0, (cosSim - 0.70) / 0.30);

  const combined = 0.55 * distScore + 0.45 * cosScore;
  const similarity = Math.max(0, Math.min(99, Math.round(combined * 100)));

  return { similarity, distance: weightedDist };
}

import { BoundingBoxKalmanFilter, BoundingBox } from '../utils/kalmanFilter';
import { hungarianAlgorithm, computeIoU, BoxCoordinates } from '../utils/hungarian';

/**
 * Derives a deterministic baseline 24-D reference vector for a student profile
 * if they do not yet have an uploaded photo or calibrated embedding.
 */
export function getRegisteredStudent24DReferenceVector(student: RegisteredStudentProfile): number[] {
  if (student.featureVector && student.featureVector.length >= 12) {
    return student.featureVector;
  }

  let hash = 0;
  const str = `${student.id}-${student.name}-${student.rollNo}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  const baseline = [
    0.85, 0.85, 1.25, 0.72, 1.85, 2.10, 0.95, 0.95, 0.90, 0.65,
    0.98, 0.55, 0.40, 0.22, 0.42, 0.42, 0.48, 1.35, 1.35, 0.75,
    0.75, 0.28, 0.28, 1.00
  ];
  const vec: number[] = new Array(24);
  for (let i = 0; i < 24; i++) {
    const delta = (((seed >> (i % 16)) % 21) - 10) * 0.012;
    vec[i] = Number((baseline[i] + delta).toFixed(4));
  }
  return vec;
}

/**
 * DeepSORT-lite Tracked Face Session
 */
export interface TrackedFaceSession {
  trackId: number;
  state: 'TENTATIVE' | 'CONFIRMED' | 'LOST' | 'DELETED';
  hits: number;               // Consecutive detection hits (needs >=3 to become CONFIRMED)
  ageFrames: number;          // Total frames active
  timeSinceUpdate: number;    // Frames since last matched detection
  lastSeenTime: number;       // Epoch timestamp in ms
  kalman: BoundingBoxKalmanFilter;
  predictedBox: BoundingBox;  // Kalman state prediction
  bbox: BoundingBox;          // Current filtered bounding box
  rollingGallery: number[][]; // Recent embeddings/vectors
  // Identity locking & hysteresis
  lockedStudentId: string | number | null;
  lockedStudent: RegisteredStudentProfile | null;
  confidence: number;
  consecutiveMatchCount: number;
  candidateStudentId: string | number | null;
  candidateMatchCount: number;
  lastHighConfidenceTime: number;
  // Focus & telemetry
  smoothedFocusScore: number;
  blinkCount: number;
}

export class SpatialMultiFaceTracker {
  private tracks: Map<number, TrackedFaceSession> = new Map();
  private nextTrackId = 1;

  public update(
    detectedFacesLandmarks: NormalizedLandmark[][],
    registeredStudents: RegisteredStudentProfile[],
    imageWidth: number,
    imageHeight: number,
    transformationMatrixes?: (Matrix | number[])[],
    blendshapesList?: (Record<string, number> | null | undefined)[]
  ): MultiFaceMatchResult[] {
    const now = performance.now();
    const results: MultiFaceMatchResult[] = [];

    // Ensure all registered students have an eligible feature vector (using deterministic baselines if no photo uploaded)
    const eligibleStudents = registeredStudents.map((s) => ({
      ...s,
      featureVector: s.featureVector && s.featureVector.length >= 12
        ? s.featureVector
        : getRegisteredStudent24DReferenceVector(s),
    }));

    // 1. Predict next Kalman state for all existing tracks
    this.tracks.forEach((track) => {
      track.predictedBox = track.kalman.predict();
      track.ageFrames += 1;
      track.timeSinceUpdate += 1;
    });

    // 2. Process current frame's detected faces into pixel coordinates
    const currentDetections: Array<{
      faceIndex: number;
      landmarks: NormalizedLandmark[];
      matrix?: Matrix | number[] | null;
      blendshapes?: Record<string, number> | null;
      liveVector: number[];
      box: BoxCoordinates;
      cx: number;
      cy: number;
    }> = [];

    detectedFacesLandmarks.forEach((landmarks, fIdx) => {
      const matrix = transformationMatrixes && transformationMatrixes[fIdx] ? transformationMatrixes[fIdx] : null;
      const blendshapes = blendshapesList && blendshapesList[fIdx] ? blendshapesList[fIdx] : null;
      const liveVector = extractFacialGeometryVector(landmarks, imageWidth, imageHeight);

      let minX = imageWidth, maxX = 0, minY = imageHeight, maxY = 0;
      landmarks.forEach((pt) => {
        const pxX = pt.x * imageWidth;
        const pxY = pt.y * imageHeight;
        if (pxX < minX) minX = pxX;
        if (pxX > maxX) maxX = pxX;
        if (pxY < minY) minY = pxY;
        if (pxY > maxY) maxY = pxY;
      });

      const padX = 12;
      const padY = 16;
      const bx1 = Math.max(4, minX - padX);
      const by1 = Math.max(4, minY - padY);
      const bx2 = Math.min(imageWidth - 4, maxX + padX);
      const by2 = Math.min(imageHeight - 4, maxY + padY);
      const bw = bx2 - bx1;
      const bh = by2 - by1;
      const cx = bx1 + bw / 2;
      const cy = by1 + bh / 2;

      currentDetections.push({
        faceIndex: fIdx,
        landmarks,
        matrix,
        blendshapes,
        liveVector,
        box: { bx1, by1, bw, bh },
        cx,
        cy,
      });
    });

    // 3. Build Cost Matrix between Detections and Active Tracks
    const activeTrackList = Array.from(this.tracks.values()).filter((t) => t.state !== 'DELETED');
    const matchedTrackIds = new Set<number>();
    const assignedDetIndexes = new Set<number>();
    const GATED_COST = 1e5;

    if (currentDetections.length > 0 && activeTrackList.length > 0) {
      const costMatrix: number[][] = [];

      for (let d = 0; d < currentDetections.length; d++) {
        const det = currentDetections[d];
        const row: number[] = [];

        for (let t = 0; t < activeTrackList.length; t++) {
          const track = activeTrackList[t];
          const iou = computeIoU(det.box, track.predictedBox);
          const centroidDist = Math.hypot(det.cx - track.predictedBox.cx, det.cy - track.predictedBox.cy);
          const normDist = centroidDist / (track.predictedBox.bw || 1);

          // Spatial gating: if zero overlap AND centroid distance > 1.5x face width, forbid match
          if (iou === 0 && normDist > 1.5) {
            row.push(GATED_COST);
            continue;
          }

          // Embedding distance term (0 to 1)
          let embedDist = 0.5;
          if (track.rollingGallery.length > 0 && det.liveVector.length > 0) {
            const lastVec = track.rollingGallery[track.rollingGallery.length - 1];
            const sim = calculateCosineSimilarity(det.liveVector, lastVec);
            embedDist = Math.max(0, 1 - sim);
          }

          // Cost = 0.50*(1-IoU) + 0.20*(normDist) + 0.30*(embedDist)
          const cost = 0.50 * (1 - iou) + 0.20 * Math.min(1.5, normDist) + 0.30 * embedDist;
          row.push(cost);
        }
        costMatrix.push(row);
      }

      // Execute Hungarian Algorithm on Cost Matrix
      const hungarianMatches = hungarianAlgorithm(costMatrix, 0.95);

      hungarianMatches.forEach(({ row: dIdx, col: tIdx }) => {
        const det = currentDetections[dIdx];
        const track = activeTrackList[tIdx];

        // Update Kalman state with measurement
        track.bbox = track.kalman.update({
          cx: det.cx,
          cy: det.cy,
          w: det.box.bw,
          h: det.box.bh,
        });

        track.hits += 1;
        track.timeSinceUpdate = 0;
        track.lastSeenTime = now;

        if (track.state === 'TENTATIVE' && track.hits >= 3) {
          track.state = 'CONFIRMED';
        } else if (track.state === 'LOST') {
          track.state = 'CONFIRMED';
        }

        // Maintain rolling gallery of vectors
        if (det.liveVector.length > 0) {
          track.rollingGallery.push(det.liveVector);
          if (track.rollingGallery.length > 8) {
            track.rollingGallery.shift();
          }
        }

        matchedTrackIds.add(track.trackId);
        assignedDetIndexes.add(dIdx);
      });
    }

    // 4. Create new TENTATIVE tracks for unmatched detections
    currentDetections.forEach((det, dIdx) => {
      if (!assignedDetIndexes.has(dIdx)) {
        const newTrackId = this.nextTrackId++;
        const kalman = new BoundingBoxKalmanFilter({
          cx: det.cx,
          cy: det.cy,
          w: det.box.bw,
          h: det.box.bh,
        });

        const newTrack: TrackedFaceSession = {
          trackId: newTrackId,
          state: 'TENTATIVE',
          hits: 1,
          ageFrames: 1,
          timeSinceUpdate: 0,
          lastSeenTime: now,
          kalman,
          predictedBox: kalman.getBoundingBox(),
          bbox: kalman.getBoundingBox(),
          rollingGallery: det.liveVector.length > 0 ? [det.liveVector] : [],
          lockedStudentId: null,
          lockedStudent: null,
          confidence: 0,
          consecutiveMatchCount: 0,
          candidateStudentId: null,
          candidateMatchCount: 0,
          lastHighConfidenceTime: now,
          smoothedFocusScore: 90,
          blinkCount: 0,
        };

        this.tracks.set(newTrackId, newTrack);
        matchedTrackIds.add(newTrackId);
      }
    });

    // 5. Update lifecycle for unmatched tracks (transition CONFIRMED -> LOST -> DELETED)
    const tracksToDelete: number[] = [];
    this.tracks.forEach((track, tId) => {
      if (!matchedTrackIds.has(tId)) {
        if (track.state === 'CONFIRMED') {
          track.state = 'LOST';
          track.bbox = track.predictedBox; // Coast with Kalman prediction
        }

        // Evict tracks lost for more than 1.5 seconds (1500 ms)
        if (now - track.lastSeenTime > 1500) {
          track.state = 'DELETED';
          tracksToDelete.push(tId);
        }
      }
    });

    tracksToDelete.forEach((tId) => {
      disposeClassroomModel(tId);
      this.tracks.delete(tId);
    });

    // 6. Identity Assignment with Strict Hysteresis (Track <-> Student Hungarian matching)
    const confirmedTracks = Array.from(this.tracks.values()).filter(
      (t) => (t.state === 'CONFIRMED' || (t.state === 'TENTATIVE' && t.hits >= 2)) && t.rollingGallery.length > 0
    );

    const assignedStudentIdsInFrame = new Set<string | number>();

    if (confirmedTracks.length > 0 && eligibleStudents.length > 0) {
      // Build Score Matrix: [Track x Student]
      const scoreMatrix: Array<{
        track: TrackedFaceSession;
        candidates: Array<{ student: RegisteredStudentProfile; similarity: number; distance: number }>;
      }> = [];

      confirmedTracks.forEach((track) => {
        // Average vector across rolling gallery
        const gallery = track.rollingGallery;
        const avgLiveVec = new Array(gallery[0].length).fill(0);
        gallery.forEach((vec) => {
          for (let i = 0; i < vec.length; i++) avgLiveVec[i] += vec[i];
        });
        for (let i = 0; i < avgLiveVec.length; i++) avgLiveVec[i] /= gallery.length;

        const candidateList: Array<{ student: RegisteredStudentProfile; similarity: number; distance: number }> = [];

        eligibleStudents.forEach((student) => {
          const { similarity, distance } = computeBiometricSimilarity(avgLiveVec, student.featureVector!);
          candidateList.push({ student, similarity, distance });
        });

        // Sort descending by similarity
        candidateList.sort((a, b) => b.similarity - a.similarity);
        scoreMatrix.push({ track, candidates: candidateList });
      });

      // Apply Hysteresis & Multi-Candidate Assignment Rules:
      scoreMatrix.forEach(({ track, candidates }) => {
        if (candidates.length === 0) return;

        if (track.lockedStudentId !== null) {
          // Track is currently locked to a student
          const currentStudentMatch = candidates.find((c) => String(c.student.id) === String(track.lockedStudentId));
          const currentScore = currentStudentMatch ? currentStudentMatch.similarity : 0;

          if (currentScore >= 45) {
            track.lastHighConfidenceTime = now;
            track.confidence = Math.round(track.confidence * 0.70 + currentScore * 0.30);
            assignedStudentIdsInFrame.add(track.lockedStudentId);
          } else {
            // Check for Challenger preemption among unassigned students
            const bestChallenger = candidates.find(
              (c) => String(c.student.id) !== String(track.lockedStudentId) && !assignedStudentIdsInFrame.has(c.student.id)
            );

            if (bestChallenger && bestChallenger.similarity - currentScore >= 12) {
              if (track.candidateStudentId === bestChallenger.student.id) {
                track.candidateMatchCount += 1;
              } else {
                track.candidateStudentId = bestChallenger.student.id;
                track.candidateMatchCount = 1;
              }

              // Switch identity after 8 frames of sustained challenger superiority
              if (track.candidateMatchCount >= 8) {
                migrateClassroomModel(track.trackId, bestChallenger.student.id);
                track.lockedStudentId = bestChallenger.student.id;
                track.lockedStudent = bestChallenger.student;
                track.confidence = bestChallenger.similarity;
                track.candidateStudentId = null;
                track.candidateMatchCount = 0;
                track.lastHighConfidenceTime = now;
                assignedStudentIdsInFrame.add(bestChallenger.student.id);
              }
            } else if (now - track.lastHighConfidenceTime > 2000) {
              // Release identity after 2 seconds below threshold
              track.lockedStudentId = null;
              track.lockedStudent = null;
              track.confidence = 0;
              track.consecutiveMatchCount = 0;
            }
          }
        } else {
          // Unassigned track seeking identity acquisition:
          // Find the best available candidate NOT already claimed by another face in this frame
          const availableTarget = candidates.find((c) => !assignedStudentIdsInFrame.has(c.student.id));

          if (availableTarget && availableTarget.similarity >= 50) {
            if (track.candidateStudentId === availableTarget.student.id) {
              track.candidateMatchCount += 1;
            } else {
              track.candidateStudentId = availableTarget.student.id;
              track.candidateMatchCount = 1;
            }

            // Acquire identity after 2 consecutive frames or immediately if high confidence >= 68%
            if (track.candidateMatchCount >= 2 || availableTarget.similarity >= 68) {
              migrateClassroomModel(track.trackId, availableTarget.student.id);
              track.lockedStudentId = availableTarget.student.id;
              track.lockedStudent = availableTarget.student;
              track.confidence = availableTarget.similarity;
              track.candidateStudentId = null;
              track.candidateMatchCount = 0;
              track.lastHighConfidenceTime = now;
              assignedStudentIdsInFrame.add(availableTarget.student.id);
            }
          }
        }
      });
    }

    // 7. Render output results mapped to detections
    currentDetections.forEach((det) => {
      // Find matching track with robust IoU threshold
      let matchedTrack: TrackedFaceSession | undefined;
      for (const track of this.tracks.values()) {
        const iou = computeIoU(det.box, track.bbox);
        if (iou > 0.20) {
          matchedTrack = track;
          break;
        }
      }

      // Spatial centroid fallback if IoU is degraded by rapid motion or distance
      if (!matchedTrack && this.tracks.size > 0) {
        let minCentroidDist = Infinity;
        for (const track of this.tracks.values()) {
          const d = Math.hypot(det.cx - track.bbox.cx, det.cy - track.bbox.cy);
          if (d < minCentroidDist) {
            minCentroidDist = d;
            matchedTrack = track;
          }
        }
      }

      const trackKey = matchedTrack
        ? (matchedTrack.lockedStudentId !== null ? matchedTrack.lockedStudentId : matchedTrack.trackId)
        : det.faceIndex;

      // Isolated cognitive model analysis
      const analysis = analyzeFaceLandmarks(
        det.landmarks,
        imageWidth,
        imageHeight,
        trackKey,
        det.matrix,
        det.blendshapes || undefined
      );

      let smoothedScore = analysis.focusScore;
      if (matchedTrack) {
        const isBlinking = analysis.gazeDirection === 'Eyes Closed';
        matchedTrack.blinkCount = isBlinking ? matchedTrack.blinkCount + 1 : 0;

        let targetScore = analysis.focusScore;
        if (isBlinking && matchedTrack.blinkCount <= 3) {
          targetScore = Math.max(matchedTrack.smoothedFocusScore, 78);
        }

        matchedTrack.smoothedFocusScore = Math.max(
          10,
          Math.min(99, Math.round(matchedTrack.smoothedFocusScore * 0.70 + targetScore * 0.30))
        );
        smoothedScore = matchedTrack.smoothedFocusScore;
      }
      analysis.focusScore = smoothedScore;

      const isRecognized = matchedTrack && matchedTrack.lockedStudent !== null && matchedTrack.confidence >= 50;
      const finalBbox = matchedTrack ? matchedTrack.bbox : { bx1: det.box.bx1, by1: det.box.by1, bw: det.box.bw, bh: det.box.bh };

      results.push({
        faceIndex: det.faceIndex,
        trackId: matchedTrack ? matchedTrack.trackId : undefined,
        landmarks: det.landmarks,
        analysis,
        matchedStudent: isRecognized ? matchedTrack!.lockedStudent : null,
        matchConfidence: isRecognized ? matchedTrack!.confidence : 0,
        status: isRecognized ? 'RECOGNIZED' : 'UNRECOGNIZED',
        boundingBox: {
          bx1: finalBbox.bx1,
          by1: finalBbox.by1,
          bw: finalBbox.bw,
          bh: finalBbox.bh,
        },
      });
    });

    return results;
  }

  public reset() {
    this.tracks.clear();
    this.nextTrackId = 1;
  }
}

// Global default tracker instance
export const globalSpatialFaceTracker = new SpatialMultiFaceTracker();

/**
 * Standard matching endpoint using the SpatialMultiFaceTracker.
 */
export function matchDetectedFaceToStudentDatabase(
  detectedFacesLandmarks: NormalizedLandmark[][],
  registeredStudents: RegisteredStudentProfile[],
  imageWidth: number,
  imageHeight: number,
  transformationMatrixes?: (Matrix | number[])[],
  blendshapesList?: (Record<string, number> | null | undefined)[]
): MultiFaceMatchResult[] {
  return globalSpatialFaceTracker.update(
    detectedFacesLandmarks,
    registeredStudents,
    imageWidth,
    imageHeight,
    transformationMatrixes,
    blendshapesList
  );
}
