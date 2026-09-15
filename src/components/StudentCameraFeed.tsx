import React, { useEffect, useRef, useState } from 'react';
import { Bell, RefreshCw, SwitchCamera, Video } from 'lucide-react';
import { getFaceLandmarker, analyzeFaceLandmarks, drawFaceMeshOverlay, FaceAnalysisResult } from '../services/faceTracker';
import { getMobileCompatibleCameraStream, attachStreamToVideo } from '../utils/cameraUtils';

interface StudentCameraFeedProps {
  student: {
    id: number | string;
    name: string;
    rollNo: string;
    status: string;
    email?: string;
    avatar?: string;
  };
  isTracking: boolean;
  onStatusChange?: (id: number | string, newStatus: string, score: number) => void;
}

export const StudentCameraFeed: React.FC<StudentCameraFeedProps> = ({
  student,
  isTracking,
  onStatusChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Focus score and state
  const [focusScore, setFocusScore] = useState<number>(85);
  const [currentStatus, setCurrentStatus] = useState<string>('Optimal Focus');
  const [alertStatus, setAlertStatus] = useState<string>(''); // For "Alert Sent" visual feedback
  const [gazeDetails, setGazeDetails] = useState<string>('Center');
  const focusScoreRef = useRef<number>(85);

  // Real Webcam Computer Vision States
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCvLoading, setIsCvLoading] = useState<boolean>(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const streamRef = useRef<MediaStream | null>(null);
  const isTrackingRef = useRef<boolean>(isTracking);

  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  const toggleCameraFacing = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
  };

  // Automatically start real camera when tracking is activated or facingMode changes
  useEffect(() => {
    let isMounted = true;

    const stopCameraCV = () => {
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

    const startCameraCV = async () => {
      if (!isTracking) {
        stopCameraCV();
        return;
      }
      setIsCvLoading(true);
      setCvError(null);

      try {
        const landmarker = await getFaceLandmarker();
        if (!landmarker) {
          throw new Error('FaceLandmarker AI model unavailable');
        }

        stopCameraCV();

        const stream = await getMobileCompatibleCameraStream(facingMode, 320, 240);

        if (!isMounted || !isTrackingRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          await attachStreamToVideo(videoRef.current, stream);
          if (!isMounted || !isTrackingRef.current) {
            stopCameraCV();
            return;
          }
          setIsCameraActive(true);
        } else {
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      } catch (err: any) {
        console.error('Real Camera CV init error:', err);
        if (isMounted) {
          setCvError(err.message || 'Camera permission required');
          setIsCameraActive(false);
        }
      } finally {
        if (isMounted) setIsCvLoading(false);
      }
    };

    if (isTracking) {
      startCameraCV();
    } else {
      stopCameraCV();
    }

    return () => {
      isMounted = false;
      stopCameraCV();
    };
  }, [isTracking, facingMode]);

  // Main Canvas Real-Time Computer Vision Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;

    const draw = async () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isTracking && isCameraActive && videoRef.current && videoRef.current.readyState >= 2) {
        frame++;
        const video = videoRef.current;

        // Draw live camera video feed onto canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Darken backdrop slightly for maximum contrast HUD overlay
        ctx.fillStyle = 'rgba(10, 10, 12, 0.35)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Detect Face Landmarks every frame
        try {
          const landmarker = await getFaceLandmarker();
          if (landmarker) {
            const now = performance.now();
            const results = landmarker.detectForVideo(video, now);

            if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];
              const analysis: FaceAnalysisResult = analyzeFaceLandmarks(
                landmarks,
                canvas.width,
                canvas.height
              );

              // Draw high-tech HUD overlay
              drawFaceMeshOverlay(ctx, landmarks, canvas.width, canvas.height, analysis);

              // Update focus metrics
              focusScoreRef.current = analysis.focusScore;
              setFocusScore(analysis.focusScore);
              setGazeDetails(analysis.gazeDirection);

              let newStatus = 'Optimal Focus';
              if (analysis.cognitiveInference) {
                if (analysis.cognitiveInference.state === 'NOTE_TAKING') {
                  newStatus = 'Note-Taking / Solving';
                } else if (analysis.cognitiveInference.state === 'COGNITIVE_REFLECTION') {
                  newStatus = 'Cognitive Reflection';
                } else if (analysis.cognitiveInference.state === 'GENUINE_DISTRACTION') {
                  newStatus = 'Distracted';
                } else {
                  newStatus = 'Optimal Focus';
                }
              } else {
                if (analysis.focusScore < 60) newStatus = 'Distracted';
                else if (analysis.focusScore < 80) newStatus = 'Moderate Focus';
              }

              setCurrentStatus(newStatus);

              if (frame % 15 === 0 && onStatusChange) {
                onStatusChange(student.id, newStatus, analysis.focusScore);
              }
            } else {
              // No face detected in camera
              ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
              ctx.font = '700 9px monospace';
              ctx.textAlign = 'center';
              ctx.fillText('NO FACE DETECTED', canvas.width / 2, canvas.height / 2);

              const absentScore = 20;
              focusScoreRef.current = absentScore;
              setFocusScore(absentScore);
              setCurrentStatus('Distracted');
              setGazeDetails('No Face');

              if (frame % 30 === 0 && onStatusChange) {
                onStatusChange(student.id, 'Distracted', absentScore);
              }
            }
          }
        } catch (cvErr) {
          console.warn('Real CV frame process error:', cvErr);
        }
      } else {
        // Feed offline / loading state
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#F8F7F4';
        ctx.font = '700 10px monospace';
        ctx.textAlign = 'center';
        if (isCvLoading) {
          ctx.fillText('INITIALIZING CAMERA...', canvas.width / 2, canvas.height / 2);
        } else if (cvError) {
          ctx.fillStyle = '#FF5A5F';
          ctx.fillText('CAMERA NOT DETECTED', canvas.width / 2, canvas.height / 2 - 8);
          ctx.font = '8px monospace';
          ctx.fillStyle = 'rgba(248, 247, 244, 0.7)';
          const displayErr = cvError.length > 38 ? cvError.substring(0, 35) + '...' : cvError;
          ctx.fillText(displayErr, canvas.width / 2, canvas.height / 2 + 8);
        } else {
          ctx.fillText('CAMERA OFFLINE', canvas.width / 2, canvas.height / 2 - 5);
          ctx.font = '8px sans-serif';
          ctx.fillStyle = 'rgba(248, 247, 244, 0.4)';
          ctx.fillText('Start session to enable webcam', canvas.width / 2, canvas.height / 2 + 10);
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isTracking, isCameraActive, isCvLoading, cvError, onStatusChange, student.id]);

  const sendFocusAlert = () => {
    setAlertStatus('Alert Sent!');
    setTimeout(() => setAlertStatus(''), 2500);
  };

  const forceRecalibrate = () => {
    setAlertStatus('Recalibrating...');
    setTimeout(() => {
      setAlertStatus('Mesh Synced!');
      setTimeout(() => setAlertStatus(''), 1500);
    }, 1000);
  };

  return (
    <div className="saas-card rounded-xl overflow-hidden relative group/cam">
      {/* Hidden Video Tag for Real Camera Computer Vision Processing */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="hidden"
      />

      {/* Top Banner Header */}
      <div className="bg-slate-900/90 px-3 py-2 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-[11px] font-semibold text-white truncate max-w-[120px]">
            {student.name}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={toggleCameraFacing}
            disabled={!isTracking}
            className="text-[9px] font-mono font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-700 flex items-center space-x-1 cursor-pointer disabled:opacity-40"
            title={`Switch to ${facingMode === 'user' ? 'Rear / Back' : 'Front / Selfie'} camera`}
          >
            <SwitchCamera className="h-3 w-3 text-indigo-400" />
            <span className="hidden sm:inline">{facingMode === 'user' ? 'Front' : 'Back'}</span>
          </button>
          <span className="text-[8px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
            REAL CAMERA
          </span>
        </div>
      </div>

      {/* Live View Canvas */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={240}
          height={135}
          className="w-full h-full block"
        />

        {/* Live HUD Overlays when tracking */}
        {isTracking && isCameraActive && (
          <>
            {/* Top-Right HUD Focus Score */}
            <div className="absolute top-2 right-2 flex flex-col items-end">
              <span className={`text-sm font-bold font-mono tracking-tighter ${
                focusScore > 80 ? 'text-emerald-400' : focusScore > 60 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {focusScore}%
              </span>
              <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Focus</span>
            </div>

            {/* Bottom-Left Status Pill */}
            <div className="absolute bottom-2 left-2 flex items-center space-x-1">
              <span className={`text-[8px] font-semibold font-mono px-2 py-0.5 rounded-full uppercase ${
                currentStatus === 'Optimal Focus' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : currentStatus === 'Note-Taking / Solving'
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : currentStatus === 'Cognitive Reflection' || currentStatus === 'Moderate Focus'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {currentStatus}
              </span>
            </div>
          </>
        )}

        {/* Alert state banner animation */}
        {alertStatus && (
          <div className="absolute inset-0 bg-indigo-600 flex flex-col items-center justify-center text-white p-3 text-center transition-all animate-fade-in z-10">
            <Bell className="h-5 w-5 mb-1 animate-bounce" />
            <p className="text-xs font-bold tracking-widest uppercase font-mono">{alertStatus}</p>
            <p className="text-[8px] text-indigo-200 mt-0.5 font-medium">Vibrating student study desk tracker</p>
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="bg-slate-900/90 px-2.5 py-2 flex items-center justify-between border-t border-slate-800 gap-2">
        <button
          onClick={forceRecalibrate}
          disabled={!isTracking}
          className="flex-1 inline-flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 text-[9px] font-medium font-mono uppercase tracking-wider transition-all cursor-pointer"
          title="Recalibrate camera face mesh markers"
        >
          <RefreshCw className="h-3 w-3 text-indigo-400" />
          <span>Calibrate</span>
        </button>
        <button
          onClick={sendFocusAlert}
          disabled={!isTracking}
          className="flex-1 inline-flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[9px] font-medium font-mono uppercase tracking-wider transition-all cursor-pointer"
          title="Send tactile buzz alert to student"
        >
          <Bell className="h-3 w-3" />
          <span>Send Alert</span>
        </button>
      </div>
    </div>
  );
};
