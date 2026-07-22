import React, { useState, useEffect, useRef } from 'react';
import { Route, User } from '../types';
import { motion } from 'motion/react';
import { 
  Clock, Activity, BarChart2, Award, LogOut, 
  Flame, BookOpen, Star, Sparkles, ChevronRight, Play, Pause, RotateCcw, Check, Trash2, Camera
} from 'lucide-react';

import { api } from '../services/api';

interface StudentDashboardProps {
  user: User | null;
  setCurrentRoute: (route: Route) => void;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  setCurrentRoute,
  onLogout,
}) => {
  const studentName = user?.fullName || 'Karthik Sharma';
  const studentEmail = user?.email || 'karthik.sharma@kv.edu.in';
  const userAvatar = user?.avatar;

  // Toggle state to close notices
  const [showWelcomeMsg, setShowWelcomeMsg] = useState(true);

  // Core metrics state initialized from user prop or defaults
  const [totalHours, setTotalHours] = useState(user?.totalHours ?? 24.5);
  const [completedSessions, setCompletedSessions] = useState(user?.completedSessions ?? 2);
  const [currentXP, setCurrentXP] = useState(user?.xp ?? 1450);

  // Sync profile data from backend on mount
  useEffect(() => {
    let isMounted = true;
    api.student.getProfile()
      .then((data) => {
        if (isMounted && data.user) {
          if (data.user.xp !== undefined) setCurrentXP(data.user.xp);
          if (data.user.totalHours !== undefined) setTotalHours(data.user.totalHours);
          if (data.user.completedSessions !== undefined) setCompletedSessions(data.user.completedSessions);
        }
      })
      .catch(() => {
        // Backend offline fallback
      });
    return () => { isMounted = false; };
  }, []);

  // 1. Study Sessions Timer State
  const [timerDuration, setTimerDuration] = useState(25); // in minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60); // in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimeLeft(timerDuration * 60);
    setIsTimerRunning(false);
  }, [timerDuration]);

  const handleSessionCompletion = async (duration: number) => {
    setCompletedSessions((c) => c + 1);
    setTotalHours((h) => parseFloat((h + duration / 60).toFixed(1)));
    setCurrentXP((xp) => xp + 150);

    try {
      await api.student.recordSession({
        durationMinutes: duration,
        xpEarned: 150,
        avgFocusScore: focusScore || 85,
      });
    } catch (err) {
      console.warn('Failed to persist session to backend:', err);
    }
  };

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            // Complete session & save to MongoDB
            handleSessionCompletion(timerDuration);
            alert(`Amazing job! You completed your ${timerDuration}-minute focus slot! +150 XP claimed and saved to database!`);
            return timerDuration * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timerDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(timerDuration * 60);
  };

  // 2. Focus Tracking Simulator State
  const [isTracking, setIsTracking] = useState(false);
  const [focusScore, setFocusScore] = useState(87);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Draw simulated eye/face tracking wireframe in brand coral colors
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isTracking) {
        // Draw futuristic radar grid
        ctx.strokeStyle = 'rgba(255, 90, 95, 0.12)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 20) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 20) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(canvas.width, i);
          ctx.stroke();
        }

        // Draw outer face oval tracking mesh
        ctx.strokeStyle = 'rgba(255, 90, 95, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const centerX = canvas.width / 2 + Math.sin(angle) * 15;
        const centerY = canvas.height / 2 + Math.cos(angle * 0.7) * 8;
        ctx.ellipse(centerX, centerY, 55, 75, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Draw eye points
        ctx.fillStyle = '#FF5A5F';
        // Left eye
        ctx.beginPath();
        ctx.arc(centerX - 20, centerY - 15, 4, 0, Math.PI * 2);
        ctx.fill();
        // Right eye
        ctx.beginPath();
        ctx.arc(centerX + 20, centerY - 15, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw dynamic gaze vectors
        ctx.strokeStyle = 'rgba(255, 90, 95, 0.4)';
        ctx.beginPath();
        ctx.moveTo(centerX - 20, centerY - 15);
        ctx.lineTo(centerX - 20 + Math.sin(angle * 1.5) * 12, centerY - 15 + Math.cos(angle * 1.5) * 12);
        ctx.moveTo(centerX + 20, centerY - 15);
        ctx.lineTo(centerX + 20 + Math.sin(angle * 1.5) * 12, centerY - 15 + Math.cos(angle * 1.5) * 12);
        ctx.stroke();

        // Draw nose and mouth wireframe lines
        ctx.strokeStyle = 'rgba(255, 90, 95, 0.5)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 5);
        ctx.lineTo(centerX, centerY + 15);
        ctx.lineTo(centerX - 10, centerY + 15);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY + 30, 15, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        // Target bounding box corner markings
        ctx.strokeStyle = '#FF5A5F';
        ctx.lineWidth = 3;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(15, 15); ctx.lineTo(30, 15); ctx.moveTo(15, 15); ctx.lineTo(15, 30);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(canvas.width - 15, canvas.height - 15); ctx.lineTo(canvas.width - 30, canvas.height - 15);
        ctx.moveTo(canvas.width - 15, canvas.height - 15); ctx.lineTo(canvas.width - 15, canvas.height - 30);
        ctx.stroke();

        // Text display on tracking feed
        ctx.fillStyle = '#FF5A5F';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('GAZE STATUS: OPTIMAL', 25, 28);
        ctx.fillText('FACE MESH DETECTED', 25, 40);

        angle += 0.05;
      } else {
        // Feed offline visualization
        ctx.fillStyle = 'rgba(248, 247, 244, 0.4)';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CAMERA TRACKING INTERACTIVE FEED', canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(248, 247, 244, 0.25)';
        ctx.fillText('Click Toggle Tracking to start simulator', canvas.width / 2, canvas.height / 2 + 10);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isTracking]);

  // Dynamic simulation of Focus Score changing slightly when running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(() => {
        setFocusScore((prev) => {
          const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
          const next = prev + delta;
          return Math.max(70, Math.min(99, next));
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  // 3. Interactive Progress State
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Mathematics Practice Session (CBSE Class X)', done: true },
    { id: 2, text: 'Physics - Electricity & Magnetism Assignment', done: false },
    { id: 3, text: 'Chemistry - Periodic Classification Revision', done: false },
  ]);
  const [newTaskText, setNewTaskText] = useState('');

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTaskText.trim(), done: false }]);
    setNewTaskText('');
  };

  const removeTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const completionRate = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.done).length / tasks.length) * 100) 
    : 0;

  // 4. Daily XP claim
  const [hasClaimedBonus, setHasClaimedBonus] = useState(false);
  const claimBonusXP = () => {
    if (hasClaimedBonus) return;
    setCurrentXP((xp) => xp + 100);
    setHasClaimedBonus(true);
  };

  // Quick stats array bound to interactive state
  const quickStats = [
    { label: 'Weekly Streak', value: '5 Days', icon: Flame, color: 'text-[#FF5A5F] bg-[#FF5A5F]/10 border-white/5' },
    { label: 'Focus Score', value: `${focusScore}%`, icon: Activity, color: 'text-[#FF5A5F] bg-[#FF5A5F]/10 border-white/5' },
    { label: 'Total Study Time', value: `${totalHours} hrs`, icon: Clock, color: 'text-[#FF5A5F] bg-[#FF5A5F]/10 border-white/5' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-[#F8F7F4] bg-[#111113]">
      {/* Top Welcome Title */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#FF5A5F] bg-[#FF5A5F]/10 border border-[#FF5A5F]/35 px-3 py-1 rounded">
            [STUDENT ENVIRONMENT]
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F8F7F4] font-display mt-3 tracking-tight">
            Welcome, {studentName}
          </h1>
          <p className="text-[#F8F7F4]/60 text-xs mt-1 font-sans leading-relaxed">
            Ready to calibrate your learning concentration? Manage slots and review attention diagnostic reports below.
          </p>
        </div>

        {/* Quick Stats Blocks */}
        <div className="flex flex-wrap items-center gap-3">
          {quickStats.map((stat, idx) => (
            <div key={idx} className="flex items-center space-x-2.5 bg-black/20 border border-white/10 py-2 px-4 rounded-xl">
              <div className={`p-1.5 rounded border ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[8px] text-[#F8F7F4]/40 font-bold uppercase tracking-wider font-mono">{stat.label}</p>
                <p className="text-xs font-semibold text-[#F8F7F4]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Details Container */}
      <div className="bg-black/20 border-2 border-white/10 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center space-x-4">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={studentName}
              className="w-16 h-16 rounded-xl object-cover border border-white/10 shadow-inner"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[#FF5A5F]/10 border border-[#FF5A5F]/20 text-[#FF5A5F] flex items-center justify-center font-extrabold text-2xl font-display shadow-inner">
              {studentName.split(' ').map(n => n[0]).join('')}
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-[#F8F7F4] font-display">{studentName}</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-white/5 text-[#FF5A5F] border border-[#FF5A5F]/25">
                Active
              </span>
            </div>
            <p className="text-xs font-mono text-[#F8F7F4]/60 mt-1">{studentEmail}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center justify-center space-x-2 border-2 border-white/10 hover:border-[#FF5A5F] hover:bg-white/5 text-[#F8F7F4] text-xs font-mono font-bold uppercase tracking-widest py-2.5 px-5 transition-all cursor-pointer"
          id="student-dashboard-logout"
        >
          <LogOut className="h-4 w-4 text-[#FF5A5F]" />
          <span>Logout</span>
        </button>
      </div>

      {/* Notice Board */}
      {showWelcomeMsg && (
        <div className="mb-10 border-2 border-[#FF5A5F]/40 bg-[#FF5A5F]/5 text-[#F8F7F4] p-5 rounded-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex items-start space-x-3.5">
            <div className="bg-[#FF5A5F]/15 p-2 rounded shrink-0 mt-0.5 border border-[#FF5A5F]/30">
              <Sparkles className="h-5 w-5 text-[#FF5A5F]" />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base tracking-tight font-display text-[#F8F7F4]">CogniLearn Calibration Active</p>
              <p className="text-[#F8F7F4]/70 text-xs mt-0.5 font-sans leading-relaxed">
                Practice study blocks and track focus vectors using local simulated camera gaze metrics below!
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowWelcomeMsg(false)}
            className="text-[#FF5A5F] hover:text-[#FF5A5F]/80 text-[10px] font-mono font-bold tracking-wider uppercase shrink-0 self-start sm:self-center cursor-pointer border border-[#FF5A5F]/35 px-2.5 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: Study Sessions */}
        <div className="border-2 border-white/10 bg-black/20 hover:border-[#FF5A5F]/50 transition-all rounded-xl p-6 sm:p-8 flex flex-col justify-between group relative overflow-hidden" id="card-student-sessions">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 flex items-center justify-center text-[#FF5A5F]">
                <Clock className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-white/5 text-[#FF5A5F] border border-[#FF5A5F]/20 uppercase tracking-widest">
                [TIMER]
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-[#F8F7F4] font-display">Study Timer</h3>
            <p className="mt-2 text-xs text-[#F8F7F4]/60 leading-relaxed font-sans">
              Trigger focused study blocks using configured Pomodoro timers, ambient sound focus enhancers, and customizable breaks.
            </p>

            {/* Interactive study block timer component */}
            <div className="mt-6 bg-black/20 border border-white/10 p-5 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-bold font-mono text-[#F8F7F4]/40 uppercase tracking-widest">Timer Setting</span>
                <div className="flex space-x-1.5">
                  {[15, 25, 45].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setTimerDuration(mins)}
                      disabled={isTimerRunning}
                      className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded cursor-pointer transition-all border ${
                        timerDuration === mins
                          ? 'bg-[#FF5A5F] border-[#FF5A5F] text-[#111113]'
                          : 'bg-[#111113] border-white/10 text-[#F8F7F4]/60 hover:text-[#F8F7F4] disabled:opacity-30'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#111113] rounded-lg border border-white/10 p-5 flex flex-col items-center">
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-[#F8F7F4] tracking-widest mb-4">
                  {formatTime(timeLeft)}
                </div>

                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`flex-1 inline-flex items-center justify-center gap-2 rounded text-[#111113] font-bold py-2 px-4 cursor-pointer text-[10px] uppercase tracking-wider font-mono transition-colors ${
                      isTimerRunning ? 'bg-amber-400 hover:bg-amber-500' : 'bg-[#FF5A5F] hover:bg-[#FF5A5F]/85'
                    }`}
                  >
                    {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-[#111113]" />}
                    <span>{isTimerRunning ? 'Pause Session' : 'Start Session'}</span>
                  </button>

                  <button
                    onClick={resetTimer}
                    className="bg-white/5 hover:bg-white/10 text-[#F8F7F4] border border-white/10 rounded p-2 cursor-pointer transition-colors"
                    title="Reset Timer"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-[#FF5A5F]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[#F8F7F4]/40 text-[10px] font-mono uppercase tracking-wider">
            <span>Completed Study Slots: {completedSessions} today</span>
            <ChevronRight className="h-4 w-4 text-[#FF5A5F]" />
          </div>
        </div>

        {/* Card 2: Focus Tracking */}
        <div className="border-2 border-white/10 bg-black/20 hover:border-[#FF5A5F]/50 transition-all rounded-xl p-6 sm:p-8 flex flex-col justify-between group relative overflow-hidden" id="card-student-focus">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 flex items-center justify-center text-[#FF5A5F]">
                <Activity className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-white/5 text-[#FF5A5F] border border-[#FF5A5F]/20 uppercase tracking-widest">
                [MESH]
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-[#F8F7F4] font-display">Attention Diagnostic</h3>
            <p className="mt-2 text-xs text-[#F8F7F4]/60 leading-relaxed font-sans">
              Enable smart simulated eye-tracking, gaze vectors mapping, and facial mesh distraction calculations.
            </p>

            {/* Interactive Eye Tracking Simulator Feed */}
            <div className="mt-6 bg-black/20 border border-white/10 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-mono font-bold text-[#F8F7F4]/40 uppercase tracking-widest">Webcam focus vector tracker</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                  isTracking ? 'bg-[#FF5A5F]/20 text-[#FF5A5F] border border-[#FF5A5F]/45' : 'bg-white/5 text-[#F8F7F4]/40 border border-white/10'
                }`}>
                  {isTracking ? 'Mesh Live' : 'Mesh Offline'}
                </span>
              </div>

              <div className="relative rounded overflow-hidden border border-white/10 bg-[#111113] h-40">
                <canvas 
                  ref={canvasRef} 
                  width={340} 
                  height={160} 
                  className="w-full h-full block opacity-95"
                />
              </div>

              <button
                onClick={() => setIsTracking(!isTracking)}
                className={`mt-3 w-full py-2.5 px-4 rounded text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                  isTracking 
                    ? 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-950/60'
                    : 'bg-[#111113] border-white/10 text-[#F8F7F4] hover:bg-white/5'
                }`}
              >
                <Camera className="h-3.5 w-3.5 text-[#FF5A5F]" />
                <span>{isTracking ? 'Deactivate Gaze Tracking' : 'Activate Gaze Tracking'}</span>
              </button>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[#F8F7F4]/40 text-[10px] font-mono uppercase tracking-wider">
            <span>Mesh Points: 68 Coordinates</span>
            <ChevronRight className="h-4 w-4 text-[#FF5A5F]" />
          </div>
        </div>

        {/* Card 3: Progress */}
        <div className="border-2 border-white/10 bg-black/20 hover:border-[#FF5A5F]/50 transition-all rounded-xl p-6 sm:p-8 flex flex-col justify-between group relative overflow-hidden" id="card-student-progress">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 flex items-center justify-center text-[#FF5A5F]">
                <BarChart2 className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-white/5 text-[#FF5A5F] border border-[#FF5A5F]/20 uppercase tracking-widest">
                [OBJECTIVES]
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-[#F8F7F4] font-display">Study Objectives</h3>
            <p className="mt-2 text-xs text-[#F8F7F4]/60 leading-relaxed font-sans">
              Check off tasks, complete subject deliverables, and watch your completion index scale up in real-time.
            </p>

            {/* Interactive study objectives list */}
            <div className="mt-6 bg-black/20 border border-white/10 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-mono font-bold text-[#F8F7F4]/40 uppercase tracking-widest">Completion rate</span>
                <span className="text-[9px] font-mono font-bold text-[#FF5A5F] bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 px-2 py-0.5 rounded">
                  {completionRate}% Complete
                </span>
              </div>

              <div className="w-full bg-[#111113] border border-white/10 h-2.5 rounded-full overflow-hidden mb-4">
                <div 
                  className="bg-[#FF5A5F] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${completionRate}%` }}
                />
              </div>

              <form onSubmit={handleAddTask} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Add custom task objective..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className="flex-1 text-xs border border-white/10 bg-[#111113] rounded px-3 py-2 outline-none focus:border-[#FF5A5F]/50 text-[#F8F7F4]"
                />
                <button
                  type="submit"
                  className="bg-[#F8F7F4] hover:bg-[#FF5A5F] text-[#111113] rounded px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider cursor-pointer shrink-0"
                >
                  Add
                </button>
              </form>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {tasks.map((t) => (
                  <div key={t.id} className="flex justify-between items-center bg-[#111113] border border-white/5 p-2 px-3 rounded text-xs">
                    <button
                      onClick={() => toggleTask(t.id)}
                      className="flex-1 flex items-center space-x-2.5 text-left cursor-pointer"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        t.done ? 'bg-[#FF5A5F] border-[#FF5A5F] text-[#111113]' : 'border-white/35 bg-[#111113]'
                      }`}>
                        {t.done && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className={`font-medium transition-all ${
                        t.done ? 'line-through text-[#F8F7F4]/40' : 'text-[#F8F7F4]/80'
                      }`}>
                        {t.text}
                      </span>
                    </button>
                    <button
                      onClick={() => removeTask(t.id)}
                      className="text-[#F8F7F4]/30 hover:text-[#FF5A5F] p-0.5 rounded cursor-pointer ml-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[#F8F7F4]/40 text-[10px] font-mono uppercase tracking-wider">
            <span>Tasks count: {tasks.length} Configured</span>
            <ChevronRight className="h-4 w-4 text-[#FF5A5F]" />
          </div>
        </div>

        {/* Card 4: Achievements */}
        <div className="border-2 border-white/10 bg-black/20 hover:border-[#FF5A5F]/50 transition-all rounded-xl p-6 sm:p-8 flex flex-col justify-between group relative overflow-hidden" id="card-student-achievements">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 flex items-center justify-center text-[#FF5A5F]">
                <Award className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-white/5 text-[#FF5A5F] border border-[#FF5A5F]/20 uppercase tracking-widest">
                [ACHIEVEMENTS]
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-[#F8F7F4] font-display">Badges & Certificates</h3>
            <p className="mt-2 text-xs text-[#F8F7F4]/60 leading-relaxed font-sans">
              Unlock daily streaks, gaze level certificates, and high concentration rewards signed by class teachers.
            </p>

            {/* Interactive Achievements/XP Claims */}
            <div className="mt-6 bg-black/20 border border-white/10 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-3.5">
                <span className="text-[9px] font-mono font-bold text-[#F8F7F4]/40 uppercase tracking-widest">Streaks claimed</span>
                <span className="text-xs font-extrabold text-[#FF5A5F] bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 px-3 py-0.5 rounded font-mono">
                  {currentXP.toLocaleString()} XP
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center space-x-1.5 bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 text-[#FF5A5F] font-bold p-1 px-3 rounded text-[10px] select-none font-mono uppercase tracking-wider">
                  <Star className="h-3.5 w-3.5 fill-[#FF5A5F]" />
                  <span>5-Day Flame</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 text-[#FF5A5F] font-bold p-1 px-3 rounded text-[10px] select-none font-mono uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Focus Master</span>
                </div>
              </div>

              <button
                onClick={claimBonusXP}
                disabled={hasClaimedBonus}
                className={`w-full py-2.5 px-4 rounded text-xs font-bold uppercase font-mono tracking-widest transition-all cursor-pointer border flex items-center justify-center gap-1.5 shadow-sm ${
                  hasClaimedBonus 
                    ? 'bg-white/5 border-white/10 text-[#F8F7F4]/30 cursor-not-allowed'
                    : 'bg-[#FF5A5F] hover:bg-[#FF5A5F]/85 border-[#FF5A5F] text-[#111113]'
                }`}
              >
                <Award className="h-3.5 w-3.5" />
                <span>{hasClaimedBonus ? 'Daily Bonus Claimed' : 'Claim Daily Bonus (+100 XP)'}</span>
              </button>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[#F8F7F4]/40 text-[10px] font-mono uppercase tracking-wider">
            <span>Multiplier level: 1.2x Boost</span>
            <ChevronRight className="h-4 w-4 text-[#FF5A5F]" />
          </div>
        </div>
      </div>
    </div>
  );
};
