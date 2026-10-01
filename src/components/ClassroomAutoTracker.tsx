import React, { useEffect, useRef, useState } from 'react';
import {
  Camera, Users, AlertCircle, ShieldAlert, CheckCircle2, Sparkles,
  UserPlus, Target, SwitchCamera, ShieldCheck, Download, Fingerprint,
  CheckSquare, Square, RotateCw
} from 'lucide-react';
import {
  getMultiFaceLandmarker,
  drawClassroomMultiFaceHUD,
  RegisteredStudentProfile,
  MultiFaceMatchResult,
} from '../services/faceTracker';
import {
  preprocessStudentProfilesDatabase,
  SpatialMultiFaceTracker,
  enrollLiveFaceToStudent,
} from '../services/faceMatcher';
import { getMobileCompatibleCameraStream, attachStreamToVideo } from '../utils/cameraUtils';
import { checkFaceQualityGate, alignFaceCrop112, l2Normalize } from '../services/faceAligner';
import { computeFaceEmbedding } from '../services/embeddingService';
import {
  saveBiometricRecord,
  getAllBiometricRecords,
  deleteBiometricRecord,
  StudentBiometricRecord,
} from '../utils/biometricStorage';
import { globalTrackingHarness } from '../utils/evaluationHarness';

interface ClassroomAutoTrackerProps {
  registeredStudents: Array<{
    id: number | string;
    name: string;
    rollNo: string;
    avatar?: string;
  }>;
  isTracking: boolean;
  onAutoTrackingUpdate: (
    updates: Record<
      string | number,
      {
        matched: boolean;
        score: number;
        gaze: string;
        confidence: number;
        cognitiveState?: string;
        cognitiveLabel?: string;
      }
    >,
    unknownCount: number
  ) => void;
}

export const ClassroomAutoTracker: React.FC<ClassroomAutoTrackerProps> = ({
  registeredStudents,
  isTracking,
  onAutoTrackingUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCvLoading, setIsCvLoading] = useState<boolean>(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const [detectedFaceCount, setDetectedFaceCount] = useState<number>(0);
  const [unknownFaceCount, setUnknownFaceCount] = useState<number>(0);
  const [recognizedCount, setRecognizedCount] = useState<number>(0);

  // Quick Face Enrollment State
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<string | number>(
    registeredStudents[0]?.id || ''
  );
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number | null>(null);
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [enrollProgress, setEnrollProgress] = useState<number>(0);
  const [enrollStatusText, setEnrollStatusText] = useState<string>('');
  const [hasConsent, setHasConsent] = useState<boolean>(true);
  const [enrollMsg, setEnrollMsg] = useState<string | null>(null);

  // References
  const lastDetectedLandmarksRef = useRef<any[]>([]);
  const latestMatchesRef = useRef<MultiFaceMatchResult[]>([]);
  const preprocessedProfilesRef = useRef<RegisteredStudentProfile[]>([]);
  const spatialTrackerRef = useRef<SpatialMultiFaceTracker>(new SpatialMultiFaceTracker());
  const studentScoreHistoryRef = useRef<Record<string | number, { smoothedScore: number; blinkCount: number }>>({});

  // 1. Initialize and Preprocess Profiles with Stored Biometrics (DPDP IndexedDB)
  useEffect(() => {
    let active = true;
    const runPreprocessing = async () => {
      let storedBiometrics = new Map<string, StudentBiometricRecord>();
      try {
        storedBiometrics = await getAllBiometricRecords();
      } catch (err) {
        console.warn('Could not read IndexedDB biometrics:', err);
      }

      const rawProfiles: RegisteredStudentProfile[] = registeredStudents.map((s) => {
        const bio = storedBiometrics.get(String(s.id));
        return {
          id: s.id,
          name: s.name,
          rollNo: s.rollNo,
          avatar: s.avatar,
          featureVector: bio ? bio.meanEmbedding : undefined,
        };
      });

      const processed = await preprocessStudentProfilesDatabase(rawProfiles, 224);
      if (active) {
        preprocessedProfilesRef.current = processed;
      }
    };

    runPreprocessing();
    return () => {
      active = false;
    };
  }, [registeredStudents]);

  // Keep enrollment selector synced if registeredStudents changes
  useEffect(() => {
    if (registeredStudents.length > 0 && !selectedStudentForEnroll) {
      setSelectedStudentForEnroll(registeredStudents[0].id);
    }
  }, [registeredStudents, selectedStudentForEnroll]);

  // Camera states
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const streamRef = useRef<MediaStream | null>(null);
  const isTrackingRef = useRef<boolean>(isTracking);

  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Camera Lifecycle
  useEffect(() => {
    let isMounted = true;

    const stopClassroomCV = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
      spatialTrackerRef.current.reset();
      globalTrackingHarness.stopLogging();
    };

    const startClassroomCV = async () => {
      if (!isTrackingRef.current) return;
      setIsCvLoading(true);
      setCvError(null);

      try {
        const landmarker = await getMultiFaceLandmarker();
        if (!landmarker) {
          throw new Error('MediaPipe Vision multi-face landmarker could not initialize');
        }

        const stream = await getMobileCompatibleCameraStream(
          facingMode,
          1280,
          720
        );

        if (!isMounted || !isTrackingRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          await attachStreamToVideo(videoRef.current, stream);
          if (!isMounted || !isTrackingRef.current) {
            stopClassroomCV();
            return;
          }
          setIsCameraActive(true);
          globalTrackingHarness.startLogging();
        } else {
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      } catch (err: any) {
        console.error('Classroom camera CV error:', err);
        if (isMounted) {
          setCvError(err.message || 'Camera permission required for Classroom Auto-Detection');
          setIsCameraActive(false);
        }
      } finally {
        if (isMounted) setIsCvLoading(false);
      }
    };

    if (isTracking) {
      startClassroomCV();
    } else {
      stopClassroomCV();
    }

    return () => {
      isMounted = false;
      stopClassroomCV();
    };
  }, [isTracking, facingMode]);

  // Click on Canvas to Select Face for Calibration/Enrollment
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const matches = latestMatchesRef.current;
    const hitIndex = matches.findIndex((m) => {
      const b = m.boundingBox;
      return clickX >= b.bx1 && clickX <= b.bx1 + b.bw && clickY >= b.by1 && clickY <= b.by1 + b.bh;
    });

    if (hitIndex !== -1) {
      setSelectedFaceIndex(hitIndex);
      const hitMatch = matches[hitIndex];
      if (hitMatch.matchedStudent) {
        setSelectedStudentForEnroll(hitMatch.matchedStudent.id);
      }
    } else {
      setSelectedFaceIndex(null);
    }
  };

  // Phase 5: Multi-Sample 512-D Biometric Calibration Flow (DPDP Act 2023 Compliant)
  const handleStartMultiSampleEnroll = async () => {
    if (!hasConsent) {
      setEnrollMsg('⚠ Please confirm biometric enrollment consent checkbox first.');
      return;
    }
    if (!videoRef.current || !canvasRef.current) return;
    if (!lastDetectedLandmarksRef.current || lastDetectedLandmarksRef.current.length === 0) {
      setEnrollMsg('⚠ No live face detected in camera stream to enroll. Please face the camera.');
      setTimeout(() => setEnrollMsg(null), 3500);
      return;
    }

    const faceIdx = selectedFaceIndex !== null && selectedFaceIndex < lastDetectedLandmarksRef.current.length
      ? selectedFaceIndex
      : 0;

    const targetStudent = registeredStudents.find(
      (s) => String(s.id) === String(selectedStudentForEnroll)
    );
    if (!targetStudent) return;

    setIsEnrolling(true);
    setEnrollProgress(0);
    setEnrollStatusText('Collecting sample 1/5: Please look directly at camera...');

    const collectedEmbeddings: number[][] = [];
    const maxSamples = 5;

    for (let sample = 1; sample <= maxSamples; sample++) {
      await new Promise((r) => setTimeout(r, 450));

      const currentLandmarks = lastDetectedLandmarksRef.current[faceIdx] || lastDetectedLandmarksRef.current[0];
      if (!currentLandmarks) continue;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) break;

      const crop = alignFaceCrop112(video, currentLandmarks, canvas.width, canvas.height);
      if (!crop) {
        setEnrollStatusText(`Sample ${sample}/${maxSamples}: Face alignment failed, retrying...`);
        sample--;
        continue;
      }

      setEnrollStatusText(`Processing 512-D deep embedding (sample ${sample}/${maxSamples})...`);
      const embedding = await computeFaceEmbedding(crop);
      collectedEmbeddings.push(embedding);
      setEnrollProgress(sample);

      if (sample === 1) setEnrollStatusText('Sample 2/5: Slightly turn head left or right...');
      else if (sample === 2) setEnrollStatusText('Sample 3/5: Slightly tilt head up or down...');
      else if (sample === 3) setEnrollStatusText('Sample 4/5: Smile or natural expression...');
      else if (sample === 4) setEnrollStatusText('Sample 5/5: Hold still for final template confirmation...');
    }

    if (collectedEmbeddings.length >= 3) {
      // Compute mean 512-D vector
      const mean = new Array(512).fill(0);
      collectedEmbeddings.forEach((vec) => {
        for (let i = 0; i < 512; i++) mean[i] += vec[i];
      });
      for (let i = 0; i < 512; i++) mean[i] /= collectedEmbeddings.length;
      const normalizedMean = l2Normalize(mean);

      // Save to IndexedDB (DPDP Act compliant, zero raw images saved)
      await saveBiometricRecord({
        studentId: targetStudent.id,
        meanEmbedding: normalizedMean,
        exemplars: collectedEmbeddings.slice(0, 3),
        sampleCount: collectedEmbeddings.length,
        enrolledAt: Date.now(),
        consentGiven: true,
      });

      // Update in-memory profile for immediate recognition locking
      preprocessedProfilesRef.current = preprocessedProfilesRef.current.map((p) => {
        if (String(p.id) === String(targetStudent.id)) {
          return { ...p, featureVector: normalizedMean };
        }
        return p;
      });

      setEnrollMsg(`✔ Enrolled 512-D biometric template for ${targetStudent.name}! Recognition locked.`);
    } else {
      setEnrollMsg('⚠ Calibration incomplete. Please ensure stable lighting and clear face visibility.');
    }

    setIsEnrolling(false);
    setEnrollProgress(0);
    setTimeout(() => setEnrollMsg(null), 5000);
  };

  // Export Evaluation Benchmark Telemetry JSON
  const handleExportTelemetry = () => {
    const jsonStr = globalTrackingHarness.exportTelemetryJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cognilearn_classroom_telemetry_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Main Multi-Face Tracking & Auto-Identification Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let callbackHandle: number | null = null;
    let isUsingVideoCallback = false;

    const scheduleNextFrame = (fn: () => void) => {
      if (videoRef.current && 'requestVideoFrameCallback' in videoRef.current) {
        isUsingVideoCallback = true;
        callbackHandle = (videoRef.current as any).requestVideoFrameCallback(fn);
      } else {
        isUsingVideoCallback = false;
        callbackHandle = requestAnimationFrame(fn);
      }
    };

    const cancelScheduledFrame = () => {
      if (callbackHandle !== null) {
        if (isUsingVideoCallback && videoRef.current && 'cancelVideoFrameCallback' in videoRef.current) {
          try {
            (videoRef.current as any).cancelVideoFrameCallback(callbackHandle);
          } catch (e) {
            // ignore
          }
        } else {
          cancelAnimationFrame(callbackHandle);
        }
        callbackHandle = null;
      }
    };

    const renderLoop = async () => {
      if (!ctx || !canvas) return;

      if (isTracking && isCameraActive && videoRef.current && videoRef.current.readyState >= 2) {
        frame++;
        const video = videoRef.current;

        // Synchronize canvas resolution 1:1 to native camera video frame (eliminates non-uniform scaling)
        if (video.videoWidth && video.videoHeight) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Subtle dark scrim for clean HUD contrast
        ctx.fillStyle = 'rgba(10, 15, 30, 0.20)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        try {
          const landmarker = await getMultiFaceLandmarker();
          if (landmarker) {
            const now = performance.now();
            const cvResults = landmarker.detectForVideo(video, now);

            if (cvResults && cvResults.faceLandmarks && cvResults.faceLandmarks.length > 0) {
              const detectedFaceLandmarksList = cvResults.faceLandmarks;
              lastDetectedLandmarksRef.current = detectedFaceLandmarksList;
              setDetectedFaceCount(detectedFaceLandmarksList.length);

              // Extract blendshape records per face (for eyelid blinks)
              const blendshapesList: Record<string, number>[] = [];
              if (cvResults.faceBlendshapes && cvResults.faceBlendshapes.length > 0) {
                cvResults.faceBlendshapes.forEach((fb: any) => {
                  const rec: Record<string, number> = {};
                  if (fb.categories) {
                    fb.categories.forEach((cat: any) => {
                      rec[cat.categoryName] = cat.score;
                    });
                  }
                  blendshapesList.push(rec);
                });
              }

              const profiles: RegisteredStudentProfile[] =
                preprocessedProfilesRef.current.length > 0
                  ? preprocessedProfilesRef.current
                  : registeredStudents.map((s) => ({
                      id: s.id,
                      name: s.name,
                      rollNo: s.rollNo,
                      avatar: s.avatar,
                    }));

              // Run DeepSORT-lite spatial tracker with Kalman filtering & Hungarian association
              const faceMatches: MultiFaceMatchResult[] = spatialTrackerRef.current.update(
                detectedFaceLandmarksList,
                profiles,
                canvas.width,
                canvas.height,
                cvResults.facialTransformationMatrixes,
                blendshapesList
              );

              latestMatchesRef.current = faceMatches;

              // Exponential Moving Average filter on scores
              faceMatches.forEach((m) => {
                if (m.status === 'RECOGNIZED' && m.matchedStudent) {
                  const sId = m.matchedStudent.id;
                  const rawScore = m.analysis.focusScore;
                  const isBlinking = m.analysis.gazeDirection === 'Eyes Closed';

                  const prevHist = studentScoreHistoryRef.current[sId] || { smoothedScore: rawScore, blinkCount: 0 };
                  const newBlinkCount = isBlinking ? prevHist.blinkCount + 1 : 0;

                  let targetScore = rawScore;
                  if (isBlinking && newBlinkCount <= 3) {
                    targetScore = Math.max(prevHist.smoothedScore, 78);
                  }

                  const smoothedScore = Math.max(
                    12,
                    Math.min(99, Math.round(prevHist.smoothedScore * 0.70 + targetScore * 0.30))
                  );
                  studentScoreHistoryRef.current[sId] = { smoothedScore, blinkCount: newBlinkCount };
                  m.analysis.focusScore = smoothedScore;
                }
              });

              // Draw bounding boxes, names, match %, gaze rays & focus pills
              drawClassroomMultiFaceHUD(ctx, faceMatches, canvas.width, canvas.height);

              // Draw Cyan Reticle around selected face (if clicked)
              if (selectedFaceIndex !== null && faceMatches[selectedFaceIndex]) {
                const selBox = faceMatches[selectedFaceIndex].boundingBox;
                ctx.save();
                ctx.strokeStyle = '#06B6D4';
                ctx.lineWidth = 2.5;
                ctx.setLineDash([6, 4]);
                ctx.strokeRect(selBox.bx1 - 4, selBox.by1 - 4, selBox.bw + 8, selBox.bh + 8);
                ctx.setLineDash([]);
                ctx.fillStyle = '#06B6D4';
                ctx.font = 'bold 10px monospace';
                ctx.fillText('TARGETED FOR ENROLLMENT', selBox.bx1, Math.max(14, selBox.by1 - 8));
                ctx.restore();
              }

              // Record telemetry in evaluation harness (Phase 7)
              globalTrackingHarness.recordFrame(
                faceMatches.map((m) => ({
                  trackId: m.trackId ?? m.faceIndex,
                  studentId: m.matchedStudent ? m.matchedStudent.id : null,
                  studentName: m.matchedStudent ? m.matchedStudent.name : undefined,
                  confidence: m.matchConfidence,
                  box: m.boundingBox,
                  pose: { yaw: m.analysis.yaw, pitch: m.analysis.pitch, roll: 0 },
                  ear: m.analysis.eyeOpenness,
                  perclos: m.analysis.perclos || 0,
                  cognitiveState: m.analysis.cognitiveInference?.state || 'SCREEN_ENGAGEMENT',
                  focusScore: m.analysis.focusScore,
                }))
              );

              // Update count tallies
              let unknownNum = 0;
              let recognizedNum = 0;

              const statusUpdates: Record<
                string | number,
                {
                  matched: boolean;
                  score: number;
                  gaze: string;
                  confidence: number;
                  cognitiveState?: string;
                  cognitiveLabel?: string;
                }
              > = {};

              registeredStudents.forEach((s) => {
                statusUpdates[s.id] = {
                  matched: false,
                  score: 0,
                  gaze: 'Awaiting Feed',
                  confidence: 0,
                };
              });

              faceMatches.forEach((m) => {
                if (m.status === 'RECOGNIZED' && m.matchedStudent) {
                  recognizedNum++;
                  statusUpdates[m.matchedStudent.id] = {
                    matched: true,
                    score: m.analysis.focusScore,
                    gaze: m.analysis.gazeDirection,
                    confidence: m.matchConfidence,
                    cognitiveState: m.analysis.cognitiveInference?.state,
                    cognitiveLabel: m.analysis.cognitiveInference?.stateLabel,
                  };
                } else {
                  unknownNum++;
                }
              });

              setUnknownFaceCount(unknownNum);
              setRecognizedCount(recognizedNum);

              if (frame % 10 === 0) {
                onAutoTrackingUpdate(statusUpdates, unknownNum);
              }
            } else {
              // No faces detected in classroom feed
              lastDetectedLandmarksRef.current = [];
              latestMatchesRef.current = [];
              setDetectedFaceCount(0);
              setUnknownFaceCount(0);
              setRecognizedCount(0);

              ctx.fillStyle = '#FF5A5F';
              ctx.font = '700 12px monospace';
              ctx.textAlign = 'center';
              ctx.fillText('NO VISIBLE FACES IN CLASSROOM FEED', canvas.width / 2, canvas.height / 2);

              if (frame % 15 === 0) {
                const emptyUpdates: Record<
                  string | number,
                  { matched: boolean; score: number; gaze: string; confidence: number }
                > = {};
                registeredStudents.forEach((s) => {
                  emptyUpdates[s.id] = {
                    matched: false,
                    score: 0,
                    gaze: 'Searching Feed',
                    confidence: 0,
                  };
                });
                onAutoTrackingUpdate(emptyUpdates, 0);
              }
            }
          }
        } catch (err) {
          console.warn('Classroom multi-face frame error:', err);
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#F8F7F4';
        ctx.font = '700 12px monospace';
        ctx.textAlign = 'center';

        if (isCvLoading) {
          ctx.fillText('INITIALIZING CLASSROOM AUTO-DETECTION CAMERA...', canvas.width / 2, canvas.height / 2);
        } else if (cvError) {
          ctx.fillStyle = '#FF5A5F';
          ctx.fillText('CAMERA DEVICE NOT DETECTED', canvas.width / 2, canvas.height / 2 - 8);
          ctx.font = '10px monospace';
          ctx.fillStyle = 'rgba(248, 247, 244, 0.7)';
          const displayErr = cvError.length > 55 ? cvError.substring(0, 52) + '...' : cvError;
          ctx.fillText(displayErr, canvas.width / 2, canvas.height / 2 + 10);
        } else {
          ctx.fillText('CLASSROOM CAMERA OFFLINE', canvas.width / 2, canvas.height / 2 - 8);
          ctx.font = '10px sans-serif';
          ctx.fillStyle = 'rgba(248, 247, 244, 0.4)';
          ctx.fillText('Click "Start Tracking" to launch automatic face recognition', canvas.width / 2, canvas.height / 2 + 12);
        }
      }

      scheduleNextFrame(renderLoop);
    };

    scheduleNextFrame(renderLoop);

    return () => {
      cancelScheduledFrame();
    };
  }, [isTracking, isCameraActive, isCvLoading, cvError, registeredStudents, onAutoTrackingUpdate, selectedFaceIndex]);

  return (
    <div className="saas-card rounded-2xl overflow-hidden relative group/feed">
      {/* Hidden Video Tag for Camera Feed Processing */}
      <video ref={videoRef} playsInline muted className="hidden" />

      {/* Classroom Feed Top HUD Bar */}
      <div className="bg-slate-900/90 px-4 py-3 flex flex-wrap items-center justify-between border-b border-slate-800/80 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-xs font-semibold font-mono text-white tracking-wide uppercase">
            CLASSROOM CAMERA — DEEPSORT & ARC-EMBEDDING TRACKER
          </span>
        </div>

        <div className="flex items-center space-x-2 font-mono text-[10px]">
          <button
            onClick={toggleCameraFacing}
            disabled={!isTracking}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 font-medium flex items-center space-x-1.5 cursor-pointer transition-colors disabled:opacity-40"
            title={`Flip Mobile Camera (Current: ${facingMode === 'user' ? 'Front / Selfie' : 'Rear / Back'})`}
          >
            <SwitchCamera className="h-3.5 w-3.5 text-indigo-400" />
            <span>{facingMode === 'user' ? 'Front Cam' : 'Rear Cam'}</span>
          </button>
          <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-semibold">
            RECOGNIZED: {recognizedCount}
          </span>
          {unknownFaceCount > 0 && (
            <span className="bg-amber-500/10 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30 font-semibold animate-pulse">
              UNKNOWN: {unknownFaceCount}
            </span>
          )}
          <span className="bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700/60 font-semibold">
            TOTAL FACES: {detectedFaceCount}
          </span>
        </div>
      </div>

      {/* Main Classroom View Canvas */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full object-contain block cursor-crosshair"
          title="Click on any face to select for biometric enrollment"
        />

        {/* Floating Unknown Person Warning Alert */}
        {isTracking && unknownFaceCount > 0 && (
          <div className="absolute top-3 left-3 bg-amber-950/90 border border-amber-500/40 px-3.5 py-2 rounded-xl text-amber-200 text-xs font-mono font-semibold flex items-center space-x-2 shadow-lg backdrop-blur z-20">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 animate-bounce" />
            <span>ALERT: {unknownFaceCount} Unregistered / Unknown Face(s) Detected</span>
          </div>
        )}

        {/* Live Tracking Guidance Overlay when idle */}
        {!isTracking && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
              <Camera className="h-6 w-6 text-indigo-400" />
            </div>
            <h4 className="text-base font-bold text-white tracking-tight">Hands-Free Classroom Auto-Identification</h4>
            <p className="text-xs text-slate-400 max-w-md mt-1 font-medium leading-relaxed">
              When started, the classroom camera automatically tracks multiple student faces using DeepSORT spatial Kalman filters and 512-D deep embeddings with zero face swapping.
            </p>
          </div>
        )}
      </div>

      {/* Live Calibration / 5-Sample Face Enrollment Strip (Phase 5) */}
      {isTracking && (
        <div className="bg-slate-900/95 border-t border-slate-800/80 px-4 py-3 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 text-slate-300 font-mono text-xs">
              <Fingerprint className="h-4 w-4 text-cyan-400 shrink-0" />
              <span className="text-slate-300 font-semibold">Click-to-Enroll Biometric:</span>
              <select
                value={selectedStudentForEnroll}
                onChange={(e) => setSelectedStudentForEnroll(e.target.value)}
                disabled={isEnrolling}
                className="bg-slate-800 text-white text-xs border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {registeredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Roll: {s.rollNo})
                  </option>
                ))}
              </select>
              {selectedFaceIndex !== null && (
                <span className="text-[10px] text-cyan-400 bg-cyan-950/50 border border-cyan-800 px-2 py-0.5 rounded">
                  Face #{selectedFaceIndex + 1} Selected
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2.5">
              {enrollMsg && (
                <span className="text-xs font-mono text-emerald-400 font-medium">
                  {enrollMsg}
                </span>
              )}

              <button
                onClick={handleStartMultiSampleEnroll}
                disabled={isEnrolling}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 cursor-pointer font-mono"
              >
                {isEnrolling ? (
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
                <span>{isEnrolling ? `Calibrating (${enrollProgress}/5)...` : 'Enroll 5-Sample Face'}</span>
              </button>
            </div>
          </div>

          {/* DPDP Act 2023 Explicit Consent Checkbox */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(e) => setHasConsent(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 h-3.5 w-3.5 bg-slate-800 cursor-pointer"
              />
              <span className="text-slate-300">
                Encrypted On-Device Biometric Consent (Encrypted numeric 512-D vectors only, zero photos stored).
              </span>
            </label>

            {isEnrolling && (
              <span className="text-cyan-400 font-semibold animate-pulse">
                {enrollStatusText}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Classroom Feed Footer Telemetry Bar & Benchmark Diagnostics Export (Phase 7) */}
      <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="flex items-center space-x-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>DeepSORT Kalman Tracking &bull; Metric Hysteresis Identity Lock &bull; Local-Only Biometrics</span>
        </span>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportTelemetry}
            className="hover:text-cyan-400 flex items-center space-x-1 cursor-pointer transition-colors"
            title="Download full JSON tracking telemetry session for accuracy diagnostics & audits"
          >
            <Download className="h-3 w-3 text-cyan-400" />
            <span>Export Diagnostics (JSON)</span>
          </button>
          <span>Threshold: 0.40 Cosine / 62%</span>
        </div>
      </div>
    </div>
  );
};
