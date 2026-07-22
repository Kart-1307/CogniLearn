import React, { useEffect, useRef, useState } from 'react';
import { Camera, Bell, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';

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
  const animFrameRef = useRef<number | null>(null);
  const avatarImgRef = useRef<HTMLImageElement | null>(null);

  // Focus score and state
  const [focusScore, setFocusScore] = useState<number>(85);
  const [currentStatus, setCurrentStatus] = useState<string>('Optimal Focus');
  const [alertStatus, setAlertStatus] = useState<string>(''); // For "Alert Sent" visual feedback
  const focusScoreRef = useRef<number>(85);

  // Load student avatar image for camera background
  useEffect(() => {
    if (student.avatar) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        avatarImgRef.current = img;
      };
      img.onerror = () => {
        avatarImgRef.current = null;
      };
      img.src = student.avatar;
    } else {
      avatarImgRef.current = null;
    }
  }, [student.avatar]);

  // Custom simulation variables based on student name to give them unique personalities
  const isOptimalStudent = student.name.includes('Karthik') || student.name.includes('Ananya');
  const isDistractedStudent = student.name.includes('Aarav') || student.name.includes('Chloe') || student.name.includes('Mehta') || student.name.includes('Kiran');
  
  // Set initial focus score baseline
  useEffect(() => {
    let initialScore = 81;
    let initialStatus = 'Moderate Focus';
    if (isOptimalStudent) {
      initialScore = 94;
      initialStatus = 'Optimal Focus';
    } else if (isDistractedStudent) {
      initialScore = 52;
      initialStatus = 'Distracted';
    }
    focusScoreRef.current = initialScore;
    setFocusScore(initialScore);
    setCurrentStatus(initialStatus);
  }, [student.name, isOptimalStudent, isDistractedStudent]);

  // Handle canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = Math.random() * 100; // random start phase
    let frame = 0;

    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isTracking) {
        frame++;
        angle += 0.04;

        // Draw camera image if available, else a dark digital backdrop
        if (avatarImgRef.current) {
          ctx.drawImage(avatarImgRef.current, 0, 0, canvas.width, canvas.height);
          // semi-transparent overlay so green/coral vector lines are readable
          ctx.fillStyle = 'rgba(17, 17, 19, 0.45)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle = '#111113';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw camera scanning static line occasionally
        const scanY = (frame * 1.5) % canvas.height;
        ctx.strokeStyle = 'rgba(255, 90, 95, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(canvas.width, scanY);
        ctx.stroke();

        // 1. Draw subtle background radar circles
        ctx.strokeStyle = 'rgba(248, 247, 244, 0.03)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2);
        ctx.stroke();

        // 2. Personality-based simulated head position
        let faceXOffset = 0;
        let faceYOffset = 0;
        let gazeDirection = 'Center';

        if (isOptimalStudent) {
          // Stays steady, looking straight
          faceXOffset = Math.sin(angle * 0.4) * 4;
          faceYOffset = Math.cos(angle * 0.3) * 3;
          gazeDirection = 'Center';
        } else if (isDistractedStudent) {
          // Drifts a lot, looks left/right/down
          const wanderX = Math.sin(angle * 0.8) * 22;
          const wanderY = Math.cos(angle * 0.5) * 12;
          faceXOffset = wanderX;
          faceYOffset = wanderY + 5;

          if (wanderX > 12) {
            gazeDirection = 'Right (Distracted)';
          } else if (wanderX < -12) {
            gazeDirection = 'Left (Distracted)';
          } else if (wanderY > 6) {
            gazeDirection = 'Down (Off-Task)';
          } else {
            gazeDirection = 'Center';
          }
        } else {
          // Normal student: minor natural shift
          faceXOffset = Math.sin(angle * 0.5) * 10;
          faceYOffset = Math.cos(angle * 0.4) * 6;
          if (faceXOffset > 8) gazeDirection = 'Right Gaze';
          else if (faceXOffset < -8) gazeDirection = 'Left Gaze';
          else gazeDirection = 'Center';
        }

        const centerX = canvas.width / 2 + faceXOffset;
        const centerY = canvas.height / 2 + faceYOffset - 10;

        // Choose color based on current score
        let primaryColor = 'rgba(248, 247, 244, 0.5)'; // White / Neutral
        let primarySolid = '#F8F7F4';
        if (gazeDirection.includes('Distracted') || gazeDirection.includes('Off-Task')) {
          primaryColor = 'rgba(255, 90, 95, 0.7)'; // Coral
          primarySolid = '#FF5A5F';
        } else if (gazeDirection !== 'Center') {
          primaryColor = 'rgba(251, 191, 36, 0.7)'; // Amber focus
          primarySolid = '#FBBF24';
        }

        // Draw target tracking reticle corner marks
        ctx.strokeStyle = primarySolid;
        ctx.lineWidth = 2;
        const padding = 10;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(padding, padding); ctx.lineTo(padding + 12, padding);
        ctx.moveTo(padding, padding); ctx.lineTo(padding, padding + 12);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(canvas.width - padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding - 12, canvas.height - padding);
        ctx.moveTo(canvas.width - padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding - 12);
        ctx.stroke();

        // 3. Draw face oval mesh
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 38, 52, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 4. Draw eyes
        ctx.fillStyle = primarySolid;
        // Left eye
        ctx.beginPath();
        ctx.arc(centerX - 14, centerY - 10, 3, 0, Math.PI * 2);
        ctx.fill();
        // Right eye
        ctx.beginPath();
        ctx.arc(centerX + 14, centerY - 10, 3, 0, Math.PI * 2);
        ctx.fill();

        // 5. Draw dynamic gaze vector lines
        ctx.strokeStyle = primarySolid;
        ctx.lineWidth = 1;
        let vectorOffsetX = 0;
        let vectorOffsetY = 0;
        if (gazeDirection === 'Center') {
          vectorOffsetX = 0;
          vectorOffsetY = 0;
        } else if (gazeDirection.includes('Right')) {
          vectorOffsetX = 8;
        } else if (gazeDirection.includes('Left')) {
          vectorOffsetX = -8;
        } else if (gazeDirection.includes('Down')) {
          vectorOffsetY = 6;
        }

        ctx.beginPath();
        ctx.moveTo(centerX - 14, centerY - 10);
        ctx.lineTo(centerX - 14 + vectorOffsetX, centerY - 10 + vectorOffsetY);
        ctx.moveTo(centerX + 14, centerY - 10);
        ctx.lineTo(centerX + 14 + vectorOffsetX, centerY - 10 + vectorOffsetY);
        ctx.stroke();

        // Draw nose wireframe
        ctx.strokeStyle = primaryColor;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 2);
        ctx.lineTo(centerX, centerY + 8);
        ctx.lineTo(centerX - 6, centerY + 8);
        ctx.stroke();

        // Draw mouth (smile or flat depending on status)
        ctx.beginPath();
        if (gazeDirection.includes('Distracted')) {
          ctx.arc(centerX, centerY + 24, 10, 1.1 * Math.PI, 1.9 * Math.PI); // inverted smile/straight
        } else {
          ctx.arc(centerX, centerY + 20, 12, 0.15 * Math.PI, 0.85 * Math.PI); // smile
        }
        ctx.stroke();

        // 6. Draw crosshair center circle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        ctx.stroke();

        // 7. Gaze telemetry text
        ctx.fillStyle = primarySolid;
        ctx.font = '700 8px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`GAZE: ${gazeDirection.toUpperCase()}`, 18, 22);
        ctx.fillText(`MESH: OK`, 18, 32);

        // Simulated focus score update based on gaze direction
        if (frame % 30 === 0) {
          let next = focusScoreRef.current;
          if (gazeDirection === 'Center') {
            next += Math.floor(Math.random() * 4) + 1; // rise up
          } else if (gazeDirection.includes('Distracted') || gazeDirection.includes('Off-Task')) {
            next -= Math.floor(Math.random() * 6) + 3; // fall fast
          } else {
            next += Math.floor(Math.random() * 5) - 3; // oscillate
          }
          const clamped = Math.max(25, Math.min(99, next));
          focusScoreRef.current = clamped;

          // Notify parent about state transitions
          let newStatus = 'Optimal Focus';
          if (clamped < 60) newStatus = 'Distracted';
          else if (clamped < 80) newStatus = 'Moderate Focus';

          setFocusScore(clamped);
          setCurrentStatus(newStatus);
          
          if (onStatusChange) {
            onStatusChange(student.id, newStatus, clamped);
          }
        }

      } else {
        // Telemetry Offline
        if (avatarImgRef.current) {
          ctx.save();
          ctx.globalAlpha = 0.25;
          ctx.drawImage(avatarImgRef.current, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        }
        ctx.fillStyle = '#F8F7F4';
        ctx.font = '700 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FEED OFFLINE', canvas.width / 2, canvas.height / 2 - 5);
        ctx.font = '8px sans-serif';
        ctx.fillStyle = 'rgba(248, 247, 244, 0.4)';
        ctx.fillText('Awaiting Live Session', canvas.width / 2, canvas.height / 2 + 10);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isTracking, isOptimalStudent, isDistractedStudent, onStatusChange, student.id]);

  const sendFocusAlert = () => {
    setAlertStatus('Alert Sent!');
    setTimeout(() => setAlertStatus(''), 2500);
  };

  const forceRecalibrate = () => {
    setAlertStatus('Recalibrating...');
    setTimeout(() => {
      let finalScore = 85;
      if (isOptimalStudent) finalScore = 98;
      else if (isDistractedStudent) finalScore = 70; // temporarily bump up
      
      focusScoreRef.current = finalScore;
      setFocusScore(finalScore);
      setAlertStatus('Mesh Synced!');
      setTimeout(() => setAlertStatus(''), 1500);
    }, 1000);
  };

  return (
    <div className="bg-black/40 border-2 border-white/10 rounded-xl overflow-hidden relative group/cam">
      {/* Top Banner Header */}
      <div className="bg-black/60 px-3 py-2 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-[#FF5A5F] animate-pulse' : 'bg-white/20'}`} />
          <span className="text-[11px] font-bold text-[#F8F7F4] truncate max-w-[110px]">
            {student.name}
          </span>
        </div>
        <span className="text-[9px] font-mono text-[#F8F7F4]/50 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
          Roll: {student.rollNo}
        </span>
      </div>

      {/* Simulated Live View Canvas */}
      <div className="relative aspect-video w-full bg-black/20 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={240}
          height={135}
          className="w-full h-full block"
        />

        {/* Live HUD Overlays when tracking */}
        {isTracking && (
          <>
            {/* Top-Right HUD Focus Score */}
            <div className="absolute top-2 right-2 flex flex-col items-end">
              <span className={`text-sm font-black font-mono tracking-tighter ${
                focusScore > 80 ? 'text-[#F8F7F4]' : focusScore > 60 ? 'text-[#FBBF24]' : 'text-[#FF5A5F]'
              }`}>
                {focusScore}%
              </span>
              <span className="text-[7px] font-bold text-[#F8F7F4]/50 uppercase tracking-wider font-mono">Focus</span>
            </div>

            {/* Bottom-Left Status Pill */}
            <div className="absolute bottom-2 left-2 flex items-center space-x-1">
              <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase ${
                currentStatus === 'Optimal Focus' 
                  ? 'bg-white/5 text-[#F8F7F4] border border-white/10'
                  : currentStatus === 'Moderate Focus'
                  ? 'bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20'
                  : 'bg-[#FF5A5F]/10 text-[#FF5A5F] border border-[#FF5A5F]/20'
              }`}>
                {currentStatus}
              </span>
            </div>
          </>
        )}

        {/* Alert state banner animation */}
        {alertStatus && (
          <div className="absolute inset-0 bg-[#FF5A5F] flex flex-col items-center justify-center text-[#111113] p-3 text-center transition-all animate-fade-in z-10">
            <Bell className="h-5 w-5 mb-1 animate-bounce" />
            <p className="text-xs font-bold tracking-widest uppercase font-mono">{alertStatus}</p>
            <p className="text-[8px] text-[#111113]/70 mt-0.5 font-sans">Vibrating student study desk tracker</p>
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="bg-black/60 px-2.5 py-2 flex items-center justify-between border-t border-white/10 gap-1.5">
        <button
          onClick={forceRecalibrate}
          disabled={!isTracking}
          className="flex-1 inline-flex items-center justify-center space-x-1 py-1.5 px-2 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 text-[#F8F7F4] text-[9px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer"
          title="Recalibrate camera face mesh markers"
        >
          <RefreshCw className="h-3 w-3 text-[#FF5A5F]" />
          <span>Calibrate</span>
        </button>
        <button
          onClick={sendFocusAlert}
          disabled={!isTracking}
          className="flex-1 inline-flex items-center justify-center space-x-1 py-1.5 px-2 rounded bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 disabled:opacity-40 text-[#111113] text-[9px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer"
          title="Send tactile buzz alert to student"
        >
          <Bell className="h-3 w-3" />
          <span>Send Alert</span>
        </button>
      </div>
    </div>
  );
};
