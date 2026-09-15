import React, { useEffect, useRef, useState } from 'react';
import { Camera, Users, AlertCircle, ShieldAlert, CheckCircle2, Sparkles, UserPlus, Target, SwitchCamera } from 'lucide-react';
import {
  getMultiFaceLandmarker,
  drawClassroomMultiFaceHUD,
  RegisteredStudentProfile,
  MultiFaceMatchResult,
} from '../services/faceTracker';
import {
  preprocessStudentProfilesDatabase,
  SpatialMultiFaceTracker,
  matchDetectedFaceToStudentDatabase,
  enrollLiveFaceToStudent,
} from '../services/faceMatcher';
import { getMobileCompatibleCameraStream, attachStreamToVideo } from '../utils/cameraUtils';

interface ClassroomAutoTrackerProps {
  registeredStudents: Array<{
    id: number | string;
    name: string;
    rollNo: string;
    avatar?: string;
  }>;
  isTracking: boolean;
  onAutoTrackingUpdate: (
    updates: Record<string | number, { matched: boolean; score: number; gaze: string; confidence: number; cognitiveState?: string; cognitiveLabel?: string }>,
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
  const animFrameRef = useRef<number | null>(null);

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
  const [enrollMsg, setEnrollMsg] = useState<string | null>(null);
  const lastDetectedLandmarksRef = useRef<any[]>([]);

  // Preprocessed student profiles with standardized dimensions and grayscale vectors
  const preprocessedProfilesRef = useRef<RegisteredStudentProfile[]>([]);
  // Spatial temporal multi-face tracker to guarantee 1-to-1 face identity locking and zero name hopping
  const spatialTrackerRef = useRef<SpatialMultiFaceTracker>(new SpatialMultiFaceTracker());
  // Temporal score history for exponential moving average focus smoothing & blink mitigation
  const studentScoreHistoryRef = useRef<Record<string | number, { smoothedScore: number; blinkCount: number }>>({});

  useEffect(() => {
    let active = true;
    const runPreprocessing = async () => {
      const rawProfiles: RegisteredStudentProfile[] = registeredStudents.map((s) => ({
        id: s.id,
        name: s.name,
        rollNo: s.rollNo,
        avatar: s.avatar,
      }));

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

  const handleEnrollFace = () => {
    if (!lastDetectedLandmarksRef.current || lastDetectedLandmarksRef.current.length === 0) {
      setEnrollMsg('⚠ No live face detected in camera stream to enroll. Please face the camera.');
      setTimeout(() => setEnrollMsg(null), 3500);
      return;
    }

    const firstFaceLandmarks = lastDetectedLandmarksRef.current[0];
    const targetStudent = registeredStudents.find(
      (s) => String(s.id) === String(selectedStudentForEnroll)
    );
    if (!targetStudent) return;

    // Enroll live face geometry landmarks into feature vector
    const updatedStudent = enrollLiveFaceToStudent(
      {
        id: targetStudent.id,
        name: targetStudent.name,
        rollNo: targetStudent.rollNo,
        avatar: targetStudent.avatar,
      },
      firstFaceLandmarks
    );

    // Update in-memory preprocessed database
    const updatedProfiles = preprocessedProfilesRef.current.map((p) => {
      if (String(p.id) === String(targetStudent.id)) {
        return { ...p, featureVector: updatedStudent.featureVector };
      }
      return p;
    });

    if (!updatedProfiles.some((p) => String(p.id) === String(targetStudent.id))) {
      updatedProfiles.push(updatedStudent);
    }

    preprocessedProfilesRef.current = updatedProfiles;
    setEnrollMsg(`✔ Enrolled live face for ${targetStudent.name}! Recognition precision calibrated.`);
    setTimeout(() => setEnrollMsg(null), 4500);
  };

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

  // Initialize classroom camera & MediaPipe multi-face landmarker
  useEffect(() => {
    let isMounted = true;

    const stopClassroomCV = () => {
      if (spatialTrackerRef.current) {
        spatialTrackerRef.current.reset();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    };

    const startClassroomCV = async () => {
      if (!isTracking) {
        stopClassroomCV();
        return;
      }
      setIsCvLoading(true);
      setCvError(null);

      try {
        const landmarker = await getMultiFaceLandmarker();
        if (!landmarker) {
          throw new Error('Multi-Face AI Computer Vision model unavailable');
        }

        stopClassroomCV();

        const stream = await getMobileCompatibleCameraStream(facingMode, 640, 480);

        if (!isMounted || !isTrackingRef.current) {
          stream.getTracks().forEach((track) => track.stop());
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

  // Main Multi-Face Tracking & Auto-Identification Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;

    const renderLoop = async () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isTracking && isCameraActive && videoRef.current && videoRef.current.readyState >= 2) {
        frame++;
        const video = videoRef.current;

        // Render video frame onto main classroom canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Darken backdrop slightly for clean AI HUD contrast
        ctx.fillStyle = 'rgba(10, 15, 30, 0.25)';
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

              // Use preprocessed profiles with standardized grayscale vectors if available
              const profiles: RegisteredStudentProfile[] =
                preprocessedProfilesRef.current.length > 0
                  ? preprocessedProfilesRef.current
                  : registeredStudents.map((s) => ({
                    id: s.id,
                    name: s.name,
                    rollNo: s.rollNo,
                    avatar: s.avatar,
                  }));

              // Run spatial temporal tracker with 24-point scale-invariant geometric biometric matching
              const faceMatches: MultiFaceMatchResult[] = spatialTrackerRef.current.update(
                detectedFaceLandmarksList,
                profiles,
                canvas.width,
                canvas.height
              );

              // Apply temporal score smoothing & blink mitigation to matched student profiles
              faceMatches.forEach((m) => {
                if (m.status === 'RECOGNIZED' && m.matchedStudent) {
                  const sId = m.matchedStudent.id;
                  const rawScore = m.analysis.focusScore;
                  const isBlinking = m.analysis.gazeDirection === 'Eyes Closed';

                  const prevHist = studentScoreHistoryRef.current[sId] || { smoothedScore: rawScore, blinkCount: 0 };
                  const newBlinkCount = isBlinking ? prevHist.blinkCount + 1 : 0;

                  // Blink mitigation: if blinking for <= 3 frames (normal eye blink), suppress sudden drop
                  let targetScore = rawScore;
                  if (isBlinking && newBlinkCount <= 3) {
                    targetScore = Math.max(prevHist.smoothedScore, 78);
                  }

                  // Exponential Moving Average filter (70% previous smoothed, 30% instant frame target)
                  const smoothedScore = Math.max(12, Math.min(99, Math.round(prevHist.smoothedScore * 0.70 + targetScore * 0.30)));
                  studentScoreHistoryRef.current[sId] = { smoothedScore, blinkCount: newBlinkCount };

                  // Update analysis focus score so HUD renders stable, smoothed value
                  m.analysis.focusScore = smoothedScore;
                }
              });

              // Draw bounding boxes, names, match %, gaze rays & focus pills with smoothed scores
              drawClassroomMultiFaceHUD(ctx, faceMatches, canvas.width, canvas.height);

              // Count unrecognized faces vs positive matches
              let unknownNum = 0;
              let recognizedNum = 0;

              const statusUpdates: Record<
                string | number,
                { matched: boolean; score: number; gaze: string; confidence: number; cognitiveState?: string; cognitiveLabel?: string }
              > = {};

              // Initialize all registered students as standby by default
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
        // Feed offline / idle view
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

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isTracking, isCameraActive, isCvLoading, cvError, registeredStudents, onAutoTrackingUpdate]);

  return (
    <div className="saas-card rounded-2xl overflow-hidden relative group/feed">
      {/* Hidden Video Tag for Camera Feed Processing */}
      <video ref={videoRef} playsInline muted className="hidden" />

      {/* Classroom Feed Top HUD Bar */}
      <div className="bg-slate-900/90 px-4 py-3 flex flex-wrap items-center justify-between border-b border-slate-800/80 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-xs font-semibold font-mono text-white tracking-wide uppercase">
            CLASSROOM CAMERA — AUTO FACE IDENTIFIER
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
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
        <canvas ref={canvasRef} width={640} height={360} className="w-full h-full block" />

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
              When started, the classroom camera automatically scans all visible student faces, compares them with registered profile photos, and assigns them to their monitoring panels without manual teacher selection.
            </p>
          </div>
        )}
      </div>

      {/* Live Calibration / Quick Face Enrollment Strip */}
      {isTracking && (
        <div className="bg-slate-900/90 border-t border-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 text-slate-300 font-mono text-xs">
            <Target className="h-4 w-4 text-indigo-400 shrink-0" />
            <span className="text-slate-400 font-medium">Quick Face Calibration:</span>
            <select
              value={selectedStudentForEnroll}
              onChange={(e) => setSelectedStudentForEnroll(e.target.value)}
              className="bg-slate-800 text-white text-xs border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {registeredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.rollNo})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3">
            {enrollMsg && (
              <span className="text-xs font-mono text-emerald-400 font-medium animate-fade-in">
                {enrollMsg}
              </span>
            )}
            <button
              onClick={handleEnrollFace}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Enroll Live Camera Face</span>
            </button>
          </div>
        </div>
      )}

      {/* Classroom Feed Footer Telemetry Bar */}
      <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="flex items-center space-x-1.5">
          <Sparkles className="h-3 w-3 text-indigo-400" />
          <span>Scale-Invariant 468-Landmark Geometry Matching Active</span>
        </span>
        <span>Confidence Threshold: 58% Match</span>
      </div>
    </div>
  );
};

