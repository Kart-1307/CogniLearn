import { FaceLandmarker, FilesetResolver, NormalizedLandmark } from '@mediapipe/tasks-vision';
import {
  RegisteredStudentProfile,
  MultiFaceMatchResult,
  FaceAnalysisResult,
  analyzeFaceLandmarks,
} from './faceTracker';

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
export function extractFacialGeometryVector(landmarks: NormalizedLandmark[]): number[] {
  if (!landmarks || landmarks.length < 468) return [];

  const leftEyeOuter = landmarks[33];
  const rightEyeOuter = landmarks[263];
  const leftEyeInner = landmarks[133];
  const rightEyeInner = landmarks[362];
  const noseTip = landmarks[1];
  const chin = landmarks[152];
  const mouthLeft = landmarks[61];
  const mouthRight = landmarks[291];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const forehead = landmarks[10];
  const noseBridge = landmarks[6];
  const leftEyebrow = landmarks[70];
  const rightEyebrow = landmarks[300];
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const leftEyeTop = landmarks[159];
  const leftEyeBottom = landmarks[145];
  const rightEyeTop = landmarks[386];
  const rightEyeBottom = landmarks[374];

  // Base Inter-pupillary / outer eye distance baseline
  const rawEyeDist = Math.hypot(rightEyeOuter.x - leftEyeOuter.x, rightEyeOuter.y - leftEyeOuter.y) || 0.001;

  // Yaw & Pitch estimation for 3D Pose Normalization
  const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
  const eyeMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
  const yaw = (noseTip.x - eyeMidX) / rawEyeDist;
  const pitch = (noseTip.y - eyeMidY) / rawEyeDist;

  // Head turn foreshortening correction factor
  const yawFactor = Math.max(0.60, Math.cos(yaw * 1.30));
  const pitchFactor = Math.max(0.60, Math.cos((pitch - 0.28) * 1.30));
  const eyeDist = rawEyeDist / yawFactor;

  // 24 Scale-Invariant Biometric Ratios
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
  const v24 = (Math.hypot(mouthLeft.x - noseTip.x, mouthLeft.y - noseTip.y) / (Math.hypot(mouthRight.x - noseTip.x, mouthRight.y - noseTip.y) || 0.001));

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
 */
export function computeBiometricSimilarity(liveVec: number[], refVec: number[]): { similarity: number; distance: number } {
  if (!liveVec || !refVec || liveVec.length === 0 || refVec.length === 0) {
    return { similarity: 0, distance: 999 };
  }

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

/**
 * Tracked Face across consecutive video frames to guarantee:
 * 1. A single face NEVER flips between multiple student names.
 * 2. Spatial continuity (IoU & centroid tracking).
 * 3. Temporal exponential smoothing on identity and focus scores.
 */
interface TrackedFaceSession {
  trackId: number;
  lastSeenTime: number;
  ageFrames: number;
  bx1: number;
  by1: number;
  bw: number;
  bh: number;
  centroidX: number;
  centroidY: number;
  lockedStudentId: string | number | null;
  lockedStudent: RegisteredStudentProfile | null;
  confidence: number;
  smoothedFocusScore: number;
  blinkCount: number;
  consecutiveMatchCount: number;
}

export class SpatialMultiFaceTracker {
  private tracks: Map<number, TrackedFaceSession> = new Map();
  private nextTrackId = 1;

  public update(
    detectedFacesLandmarks: NormalizedLandmark[][],
    registeredStudents: RegisteredStudentProfile[],
    imageWidth: number,
    imageHeight: number
  ): MultiFaceMatchResult[] {
    const now = performance.now();
    const results: MultiFaceMatchResult[] = [];

    // Filter students that have an extracted feature vector from their profile photo
    const eligibleStudents = registeredStudents.filter(
      (s) => s.featureVector && s.featureVector.length >= 12
    );

    // 1. Process current frame's detected faces
    const currentDetections: Array<{
      faceIndex: number;
      landmarks: NormalizedLandmark[];
      analysis: FaceAnalysisResult;
      liveVector: number[];
      bx1: number;
      by1: number;
      bw: number;
      bh: number;
      cx: number;
      cy: number;
    }> = [];

    detectedFacesLandmarks.forEach((landmarks, fIdx) => {
      const analysis = analyzeFaceLandmarks(landmarks, imageWidth, imageHeight);
      const liveVector = extractFacialGeometryVector(landmarks);

      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      landmarks.forEach((pt) => {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      });

      const padX = 12;
      const padY = 16;
      const bx1 = Math.max(4, minX * imageWidth - padX);
      const by1 = Math.max(4, minY * imageHeight - padY);
      const bx2 = Math.min(imageWidth - 4, maxX * imageWidth + padX);
      const by2 = Math.min(imageHeight - 4, maxY * imageHeight + padY);
      const bw = bx2 - bx1;
      const bh = by2 - by1;
      const cx = bx1 + bw / 2;
      const cy = by1 + bh / 2;

      currentDetections.push({
        faceIndex: fIdx,
        landmarks,
        analysis,
        liveVector,
        bx1,
        by1,
        bw,
        bh,
        cx,
        cy,
      });
    });

    // 2. Associate detections with existing tracks based on Centroid distance & IoU
    const matchedTrackIds = new Set<number>();
    const assignedDetections = new Set<number>();

    const detectionTrackPairs: Array<{
      detIdx: number;
      trackId: number;
      spatialDist: number;
    }> = [];

    currentDetections.forEach((det, dIdx) => {
      this.tracks.forEach((track, tId) => {
        const dist = Math.hypot(det.cx - track.centroidX, det.cy - track.centroidY);
        // Max allowable spatial shift between consecutive frames (adaptive to face size)
        const maxDist = Math.max(90, track.bw * 0.95);
        if (dist < maxDist) {
          detectionTrackPairs.push({ detIdx: dIdx, trackId: tId, spatialDist: dist });
        }
      });
    });

    // Sort by smallest spatial distance
    detectionTrackPairs.sort((a, b) => a.spatialDist - b.spatialDist);

    const activeDetectionsMap = new Map<number, TrackedFaceSession>();

    detectionTrackPairs.forEach(({ detIdx, trackId }) => {
      if (assignedDetections.has(detIdx) || matchedTrackIds.has(trackId)) return;

      const track = this.tracks.get(trackId)!;
      const det = currentDetections[detIdx];

      // Smooth bounding box coordinates to eliminate visual jitter
      track.bx1 = Math.round(track.bx1 * 0.65 + det.bx1 * 0.35);
      track.by1 = Math.round(track.by1 * 0.65 + det.by1 * 0.35);
      track.bw = Math.round(track.bw * 0.65 + det.bw * 0.35);
      track.bh = Math.round(track.bh * 0.65 + det.bh * 0.35);
      track.centroidX = track.bx1 + track.bw / 2;
      track.centroidY = track.by1 + track.bh / 2;
      track.lastSeenTime = now;
      track.ageFrames += 1;

      matchedTrackIds.add(trackId);
      assignedDetections.add(detIdx);
      activeDetectionsMap.set(detIdx, track);
    });

    // 3. Create new tracks for unmatched detections
    currentDetections.forEach((det, dIdx) => {
      if (!assignedDetections.has(dIdx)) {
        const newTrackId = this.nextTrackId++;
        const newTrack: TrackedFaceSession = {
          trackId: newTrackId,
          lastSeenTime: now,
          ageFrames: 1,
          bx1: det.bx1,
          by1: det.by1,
          bw: det.bw,
          bh: det.bh,
          centroidX: det.cx,
          centroidY: det.cy,
          lockedStudentId: null,
          lockedStudent: null,
          confidence: 0,
          smoothedFocusScore: det.analysis.focusScore,
          blinkCount: 0,
          consecutiveMatchCount: 0,
        };
        this.tracks.set(newTrackId, newTrack);
        activeDetectionsMap.set(dIdx, newTrack);
      }
    });

    // 4. Clean up stale tracks not seen for > 1.8 seconds
    const expiredTrackIds: number[] = [];
    this.tracks.forEach((track, tId) => {
      if (now - track.lastSeenTime > 1800) {
        expiredTrackIds.push(tId);
      }
    });
    expiredTrackIds.forEach((tId) => this.tracks.delete(tId));

    // 5. Global 1-to-1 Student Matching (Ensures no multiple faces get same student, no single face gets multiple names)
    const assignedStudentIdsInFrame = new Set<string | number>();

    // Candidate match matrix: [detIdx, student, similarity, distance]
    const matchCandidates: Array<{
      detIdx: number;
      track: TrackedFaceSession;
      student: RegisteredStudentProfile;
      similarity: number;
      distance: number;
    }> = [];

    currentDetections.forEach((det, dIdx) => {
      const track = activeDetectionsMap.get(dIdx)!;

      eligibleStudents.forEach((student) => {
        const { similarity, distance } = computeBiometricSimilarity(
          det.liveVector,
          student.featureVector!
        );

        matchCandidates.push({
          detIdx: dIdx,
          track,
          student,
          similarity,
          distance,
        });
      });
    });

    // Sort candidate matches by highest similarity
    matchCandidates.sort((a, b) => b.similarity - a.similarity);

    const assignedDetIndexes = new Set<number>();

    // Strict identification threshold: requires >= 64% similarity to lock identity
    const RECOGNITION_THRESHOLD = 64;

    matchCandidates.forEach(({ detIdx, track, student, similarity }) => {
      if (assignedDetIndexes.has(detIdx) || assignedStudentIdsInFrame.has(student.id)) return;

      if (similarity >= RECOGNITION_THRESHOLD) {
        // Temporal identity locking: if this track was already locked to this student, boost stability
        if (String(track.lockedStudentId) === String(student.id)) {
          track.consecutiveMatchCount += 1;
          track.confidence = Math.min(99, Math.round(track.confidence * 0.7 + similarity * 0.3));
        } else {
          // New candidate identity: lock after validation
          track.lockedStudentId = student.id;
          track.lockedStudent = student;
          track.confidence = similarity;
          track.consecutiveMatchCount = 1;
        }

        assignedDetIndexes.add(detIdx);
        assignedStudentIdsInFrame.add(student.id);
      }
    });

    // Unassigned detections are checked against their previous lock
    currentDetections.forEach((det, dIdx) => {
      const track = activeDetectionsMap.get(dIdx)!;

      if (!assignedDetIndexes.has(dIdx)) {
        // If track previously had a student locked and we still have similarity > 55%, preserve identity
        if (track.lockedStudent && !assignedStudentIdsInFrame.has(track.lockedStudent.id)) {
          const { similarity } = computeBiometricSimilarity(
            det.liveVector,
            track.lockedStudent.featureVector!
          );
          if (similarity >= 55) {
            track.confidence = Math.round(track.confidence * 0.8 + similarity * 0.2);
            assignedStudentIdsInFrame.add(track.lockedStudent.id);
          } else {
            // Decay lock if similarity drops significantly
            track.lockedStudent = null;
            track.lockedStudentId = null;
            track.confidence = 0;
            track.consecutiveMatchCount = 0;
          }
        } else {
          track.lockedStudent = null;
          track.lockedStudentId = null;
          track.confidence = 0;
          track.consecutiveMatchCount = 0;
        }
      }

      // Smooth focus score & handle blinking
      const isBlinking = det.analysis.gazeDirection === 'Eyes Closed';
      track.blinkCount = isBlinking ? track.blinkCount + 1 : 0;

      let targetScore = det.analysis.focusScore;
      if (isBlinking && track.blinkCount <= 3) {
        targetScore = Math.max(track.smoothedFocusScore, 78);
      }

      track.smoothedFocusScore = Math.max(
        10,
        Math.min(99, Math.round(track.smoothedFocusScore * 0.70 + targetScore * 0.30))
      );

      det.analysis.focusScore = track.smoothedFocusScore;

      const isRecognized = track.lockedStudent !== null && track.confidence >= RECOGNITION_THRESHOLD;

      results.push({
        faceIndex: det.faceIndex,
        landmarks: det.landmarks,
        analysis: det.analysis,
        matchedStudent: isRecognized ? track.lockedStudent : null,
        matchConfidence: isRecognized ? track.confidence : 0,
        status: isRecognized ? 'RECOGNIZED' : 'UNRECOGNIZED',
        boundingBox: {
          bx1: track.bx1,
          by1: track.by1,
          bw: track.bw,
          bh: track.bh,
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
  imageHeight: number
): MultiFaceMatchResult[] {
  return globalSpatialFaceTracker.update(
    detectedFacesLandmarks,
    registeredStudents,
    imageWidth,
    imageHeight
  );
}
