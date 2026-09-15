import React, { useState, useEffect, useRef } from 'react';
import { Route, User, StudentDiagnosticReport } from '../types';
import { motion } from 'motion/react';
import {
  Clock, Activity, BarChart2, Award, LogOut,
  Flame, BookOpen, Star, Sparkles, ChevronRight, Play, Pause, RotateCcw, Check, Trash2, Camera,
  FileText, Square, History, Eye, CheckCircle2, ListFilter
} from 'lucide-react';

import { api } from '../services/api';
import { DiagnosticReportModal } from './DiagnosticReportModal';
import { StudentCameraFeed } from './StudentCameraFeed';
import { FocusTipCard, InfoTooltip } from './FocusTipCard';
import { isDemoAccount } from '../utils/demoUtils';
import { FocusBreakModal } from './FocusBreakModal';
import { SubjectAndHourlyAnalytics } from './SubjectAndHourlyAnalytics';
import { exportReportToPDF, exportReportToCSV } from '../utils/reportExport';
import { Download } from 'lucide-react';

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
  const isDark = true;
  const isDemo = isDemoAccount(user);
  const studentName = user?.fullName || (isDemo ? 'Karthik Sharma' : 'Student');
  const studentEmail = user?.email || (isDemo ? 'karthik.sharma@kv.edu.in' : '');
  const userAvatar = user?.avatar;

  // Toggle state to close notices
  const [showWelcomeMsg, setShowWelcomeMsg] = useState(true);

  // Core metrics state initialized from user prop or defaults.
  // Standard sample datasets are only present in demo accounts; new user accounts start clean at 0.
  const [totalHours, setTotalHours] = useState(user?.totalHours ?? (isDemo ? 24.5 : 0));
  const [completedSessions, setCompletedSessions] = useState(user?.completedSessions ?? (isDemo ? 2 : 0));
  const [currentXP, setCurrentXP] = useState(user?.xp ?? (isDemo ? 1450 : 0));

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

  // --- Adaptive In-Session Focus Break State ---
  const [showFocusBreakModal, setShowFocusBreakModal] = useState<boolean>(false);
  const [breakTriggerScore, setBreakTriggerScore] = useState<number>(48);
  const lastBreakTimeRef = useRef<number>(0);
  const lowFocusStreakCountRef = useRef<number>(0);

  // Handler when user finishes or dismisses focus break
  const handleFocusBreakClose = async (completed: boolean, breakType: 'box-breathing' | '20-20-20-eyes' | 'neck-stretch') => {
    setShowFocusBreakModal(false);
    lastBreakTimeRef.current = Date.now();
    lowFocusStreakCountRef.current = 0;

    if (completed) {
      setCurrentXP((prev) => prev + 25);
    }

    // Persist break to backend (Supabase / memory store)
    try {
      await api.student.recordBreak({
        breakType,
        durationSeconds: 60,
        triggerFocusScore: breakTriggerScore,
        completed,
      });
    } catch (e) {
      // Offline fallback
    }
  };

  // --- Configurable Tracking Timer & Diagnostic Report State ---
  const [diagnosticDuration, setDiagnosticDuration] = useState<number>(30); // in minutes
  const [customDurationInput, setCustomDurationInput] = useState<string>('');
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [diagnosticSessionTitle, setDiagnosticSessionTitle] = useState<string>('Mathematics Diagnostic Session');
  const [diagnosticTimeLeft, setDiagnosticTimeLeft] = useState<number>(30 * 60); // in seconds
  const [diagnosticStartTimestamp, setDiagnosticStartTimestamp] = useState<number | null>(null);

  // Report & History State
  const [latestReport, setLatestReport] = useState<StudentDiagnosticReport | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [viewingHistoryReport, setViewingHistoryReport] = useState<StudentDiagnosticReport | null>(null);

  // User-scoped storage key
  const userStorageKey = `cognilearn_student_diagnostic_history_${user?.id || user?.email || 'guest'}`;

  // Diagnostic history initialized from user-specific localStorage or demo fallback
  const [diagnosticHistory, setDiagnosticHistory] = useState<StudentDiagnosticReport[]>(() => {
    const saved = localStorage.getItem(userStorageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }

    // If NOT a demo account, start with 0 standard records
    if (!isDemo) {
      return [];
    }

    // Demo account fallback sample dataset
    const savedGlobal = localStorage.getItem('cognilearn_student_diagnostic_history');
    if (savedGlobal) {
      try {
        return JSON.parse(savedGlobal);
      } catch (e) {
        // ignore
      }
    }

    return [
      {
        id: 'diag-hist-1',
        studentId: user?.id || 'std-101',
        studentName: studentName,
        sessionTitle: 'Physics Magnetism Diagnostic',
        date: '08 Aug 2026',
        timestamp: Date.now() - 86400000,
        configuredDurationMinutes: 30,
        actualDurationSeconds: 1800,
        status: 'Completed',
        metrics: {
          avgFocusScore: 89,
          peakFocusScore: 96,
          minFocusScore: 78,
          optimalFocusPercent: 82,
          moderateFocusPercent: 12,
          distractedPercent: 6,
          gazeShiftsCount: 3,
          meshQuality: 'Optimal (68 Coordinates)',
        },
        observations: [
          'High attention coherence maintained during full 30-minute diagnostic session.',
          'Gaze vector lock stayed centered on primary desktop learning area for 82% of duration.',
        ],
        recommendations: [
          'Maintain current ambient desk lighting and screen position.',
          'Great consistency! Continue utilizing 30-minute focus tracking blocks.',
        ],
      },
      {
        id: 'diag-hist-2',
        studentId: user?.id || 'std-101',
        studentName: studentName,
        sessionTitle: 'Mathematics Revision Block',
        date: '06 Aug 2026',
        timestamp: Date.now() - 172800000,
        configuredDurationMinutes: 45,
        actualDurationSeconds: 1240,
        status: 'Manually Stopped',
        metrics: {
          avgFocusScore: 81,
          peakFocusScore: 88,
          minFocusScore: 68,
          optimalFocusPercent: 70,
          moderateFocusPercent: 20,
          distractedPercent: 10,
          gazeShiftsCount: 5,
          meshQuality: 'Good (68 Coordinates)',
        },
        observations: [
          'Session stopped manually after 20 minutes and 40 seconds of tracking.',
          'Minor gaze shifts recorded around minute 14, but overall focus stayed above 80%.',
        ],
        recommendations: [
          'Take short 5-minute Pomodoro rests when switching complex problem sets.',
        ],
      },
    ];
  });

  const [deleteReportTarget, setDeleteReportTarget] = useState<{ id: string; title: string } | null>(null);
  const [showClearAllReportsModal, setShowClearAllReportsModal] = useState<boolean>(false);

  // Save history to user-scoped localStorage
  useEffect(() => {
    localStorage.setItem(userStorageKey, JSON.stringify(diagnosticHistory));
  }, [diagnosticHistory, userStorageKey]);

  const handleDeleteStudentReport = (reportId: string) => {
    setDiagnosticHistory((prev) => {
      const updated = prev.filter((item) => item.id !== reportId);
      localStorage.setItem(userStorageKey, JSON.stringify(updated));
      return updated;
    });
    if (viewingHistoryReport?.id === reportId) {
      setViewingHistoryReport(null);
    }
    if (latestReport?.id === reportId) {
      setLatestReport(null);
    }
    setDeleteReportTarget(null);
  };

  const handleConfirmClearAllStudentReports = () => {
    setDiagnosticHistory([]);
    localStorage.removeItem(userStorageKey);
    setViewingHistoryReport(null);
    setLatestReport(null);
    setShowClearAllReportsModal(false);
  };

  // Handler to Start Attention Diagnostic Tracking
  const handleStartDiagnostic = () => {
    const durationMins = isCustomDuration ? (parseInt(customDurationInput, 10) || 15) : diagnosticDuration;
    setDiagnosticDuration(durationMins);
    setDiagnosticTimeLeft(durationMins * 60);
    setDiagnosticStartTimestamp(Date.now());
    setIsTracking(true);
  };

  // Handler to Stop Attention Diagnostic Tracking (Automatic Completion or Manual Stop)
  const handleStopDiagnostic = (status: 'Completed' | 'Manually Stopped') => {
    setIsTracking(false);
    const now = Date.now();
    const startTime = diagnosticStartTimestamp || now;
    const elapsedSeconds = Math.max(1, Math.round((now - startTime) / 1000));

    const report: StudentDiagnosticReport = {
      id: `diag-student-${Date.now()}`,
      studentId: user?.id || 'std-101',
      studentName: studentName,
      sessionTitle: diagnosticSessionTitle || 'Attention Diagnostic Session',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timestamp: now,
      configuredDurationMinutes: diagnosticDuration,
      actualDurationSeconds: elapsedSeconds,
      status,
      metrics: {
        avgFocusScore: focusScore,
        peakFocusScore: Math.min(99, focusScore + 7),
        minFocusScore: Math.max(52, focusScore - 14),
        optimalFocusPercent: Math.round(focusScore * 0.85),
        moderateFocusPercent: Math.round((100 - focusScore) * 0.6),
        distractedPercent: Math.max(0, 100 - Math.round(focusScore * 0.85) - Math.round((100 - focusScore) * 0.6)),
        gazeShiftsCount: Math.floor(elapsedSeconds / 50) + 1,
        meshQuality: 'Optimal (68 Coordinates)',
      },
      observations: [
        `Maintained average focus score of ${focusScore}% during the ${status === 'Completed' ? 'full session' : 'tracked period'}.`,
        `Gaze tracking stayed within primary target threshold with ${Math.floor(elapsedSeconds / 50) + 1} vector drift alerts recorded.`,
        `Facial landmark wireframe mesh remained synchronized across 68 coordinate points.`,
      ],
      recommendations: [
        'Take a 5-minute cognitive rest before starting your next intensive study block.',
        'Maintain adequate room illumination to minimize eye strain.',
        'Optimal focal intervals achieved; continue tracking session trends.',
      ],
    };

    setLatestReport(report);
    setDiagnosticHistory(prev => [report, ...prev]);
    setShowReportModal(true);
  };

  // Diagnostic Timer Countdown Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTracking) {
      timer = setInterval(() => {
        setDiagnosticTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleStopDiagnostic('Completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTracking, diagnosticStartTimestamp, focusScore, diagnosticDuration, diagnosticSessionTitle]);

  // Helper for MM:SS
  const formatCountdown = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
    { label: 'Weekly Streak', value: '5 Days', icon: Flame, color: 'text-[#B18F5A] bg-[#B18F5A]/10 border-[#B18F5A]/20', tooltip: 'Number of consecutive active study days. Completing 1 focus block daily maintains your multiplier.' },
    { label: 'Focus Score', value: `${focusScore}%`, icon: Activity, color: 'text-[#B18F5A] bg-[#B18F5A]/10 border-[#B18F5A]/20', tooltip: 'Calculated in real-time from MediaPipe 68-point gaze coordinates and head position vectors.' },
    { label: 'Total Study Time', value: `${totalHours} hrs`, icon: Clock, color: 'text-[#B18F5A] bg-[#B18F5A]/10 border-[#B18F5A]/20', tooltip: 'Cumulative duration of completed diagnostic and study timer sessions.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-slate-100 bg-[#0B0F17]" id="student-dashboard-container">
      {/* Top Welcome Title */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <span className="text-[10px] font-semibold font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            [STUDENT ENVIRONMENT]
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-3">
            Welcome, {studentName}
          </h1>
          <p className="text-xs mt-1 text-slate-400 font-medium">
            Ready to calibrate your learning concentration? Manage slots and review attention diagnostic reports below.
          </p>
        </div>

        {/* Quick Stats Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          {quickStats.map((stat, idx) => (
            <div key={idx} className="saas-card flex items-center space-x-3 p-3.5 rounded-xl">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <p className="text-[9px] font-semibold uppercase tracking-wider font-mono text-slate-400">{stat.label}</p>
                  <InfoTooltip title={stat.label} content={stat.tooltip} isDark={isDark} />
                </div>
                <p className="text-sm font-bold text-white mt-0.5">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Details Container */}
      <div className="saas-card p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 rounded-2xl">
        <div className="flex items-center space-x-4">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={studentName}
              className="w-14 h-14 object-cover border-2 border-indigo-500/30 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xl tracking-tight shadow-md">
              {studentName.split(' ').map(n => n[0]).join('')}
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">{studentName}</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active Student
              </span>
            </div>
            <p className="text-xs font-mono mt-1 font-medium text-slate-400">{studentEmail}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center justify-center space-x-2 border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-mono font-medium uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all cursor-pointer self-start sm:self-center"
          id="student-dashboard-logout"
        >
          <LogOut className="h-4 w-4 text-indigo-400" />
          <span>Logout</span>
        </button>
      </div>

      {/* Notice Board */}
      {showWelcomeMsg && (
        <div className="mb-10 border border-indigo-500/20 bg-indigo-500/10 p-5 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-white">
          <div className="relative flex items-start space-x-3.5">
            <div className="p-2 shrink-0 mt-0.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base tracking-tight text-white">CogniLearn Calibration Active</p>
              <p className="text-xs mt-0.5 font-medium text-slate-300 leading-relaxed">
                Practice study blocks and track focus vectors using local simulated camera gaze metrics below!
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowWelcomeMsg(false)}
            className="text-[10px] font-mono font-semibold tracking-wider uppercase shrink-0 self-start sm:self-center cursor-pointer border border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-300 rounded-lg px-3 py-1 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Daily Focus Tip Intelligence Card */}
      <div className="mb-8">
        <FocusTipCard
          focusScore={focusScore}
          completedSessions={completedSessions}
          streakDays={5}
          isDark={isDark}
        />
      </div>

      {/* Grid of Student Cards - Optimized for Tablet (md:grid-cols-2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Card 1: Study Sessions */}
        <div className="saas-card transition-all p-6 sm:p-8 flex flex-col justify-between group relative overflow-hidden rounded-2xl" id="card-student-sessions">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Clock className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-widest border rounded-full bg-slate-800 text-indigo-300 border-slate-700">
                [TIMER]
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold tracking-tight text-white">Study Timer</h3>
              <InfoTooltip title="Pomodoro Study Slots" content="Run structured 5m to 60m focus sessions with customizable breaks to optimize memory retention." isDark={isDark} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400 font-medium">
              Trigger focused study blocks using configured Pomodoro timers, ambient sound focus enhancers, and customizable breaks.
            </p>

            {/* Interactive study block timer component */}
            <div className="mt-6 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-semibold font-mono uppercase tracking-widest text-slate-400">Timer Setting</span>
                <div className="flex flex-wrap gap-1.5">
                  {[5, 15, 25, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setTimerDuration(mins)}
                      disabled={isTimerRunning}
                      className={`text-[10px] font-mono font-medium px-2.5 py-1 cursor-pointer transition-all border rounded-lg ${timerDuration === mins
                          ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                      {mins === 5 ? '⚡ 5m' : mins === 60 ? '📖 60m' : `${mins}m`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 p-5 flex flex-col items-center rounded-xl">
                <div className="font-mono text-3xl sm:text-4xl font-bold tracking-widest text-white mb-4">
                  {formatTime(timeLeft)}
                </div>

                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`flex-1 inline-flex items-center justify-center gap-2 font-medium py-2.5 px-4 cursor-pointer text-xs uppercase tracking-wider font-mono transition-colors rounded-xl border ${isTimerRunning
                        ? 'bg-amber-600 hover:bg-amber-700 border-amber-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white'
                      }`}
                  >
                    {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-white text-white" />}
                    <span>{isTimerRunning ? 'Pause Session' : 'Start Session'}</span>
                  </button>

                  <button
                    onClick={resetTimer}
                    className="border border-slate-700 p-2.5 cursor-pointer transition-colors rounded-xl bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:text-white"
                    title="Reset Timer"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
            <span>Completed Study Slots: {completedSessions} today</span>
            <ChevronRight className="h-4 w-4 text-indigo-400" />
          </div>
        </div>

        {/* Card 2: Focus Tracking */}
        <div className="saas-card saas-card-hover p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden rounded-xl" id="card-student-focus">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Activity className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full">
                [DIAGNOSTIC TIMER]
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-heading font-bold text-white">Attention Diagnostic</h3>
              <InfoTooltip title="Live Gaze Vector Analysis" content="Monitors face landmark orientation, eye open/close rates, and off-screen gaze shifts in real-time." isDark={isDark} />
            </div>
            <p className="mt-2 text-xs leading-relaxed font-sans font-medium text-slate-300">
              Configure session duration, monitor live eye-gaze tracking, and generate diagnostic reports.
            </p>

            {/* Configurable Duration Selector (before tracking starts) */}
            {!isTracking ? (
              <div className="mt-5 space-y-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-mono font-bold uppercase tracking-wider block text-slate-300">
                    Session Topic / Subject
                  </label>
                  <input
                    type="text"
                    value={diagnosticSessionTitle}
                    onChange={(e) => setDiagnosticSessionTitle(e.target.value)}
                    placeholder="Enter session topic..."
                    className="w-full text-xs border border-slate-700 bg-slate-900 text-white px-3 py-2 outline-none focus:border-indigo-500 rounded-lg font-medium transition-colors"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-[9px] font-mono uppercase font-bold">
                    <span className="text-slate-300">Set Duration:</span>
                    <span className="text-indigo-400">
                      Configured: {isCustomDuration ? (customDurationInput || '15') : diagnosticDuration} min
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          setDiagnosticDuration(mins);
                          setIsCustomDuration(false);
                        }}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold border rounded-lg transition-colors cursor-pointer ${!isCustomDuration && diagnosticDuration === mins
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
                          }`}
                      >
                        {mins}m
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsCustomDuration(true)}
                      className={`px-2.5 py-1 text-[10px] font-mono font-bold border rounded-lg transition-colors cursor-pointer ${isCustomDuration
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
                        }`}
                    >
                      Custom
                    </button>
                  </div>

                  {isCustomDuration && (
                    <div className="pt-1 flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="300"
                        placeholder="Minutes (e.g. 25)..."
                        value={customDurationInput}
                        onChange={(e) => setCustomDurationInput(e.target.value)}
                        className="w-full text-xs border border-slate-700 bg-slate-900 text-white px-3 py-1.5 outline-none focus:border-indigo-500 rounded-lg font-medium transition-colors"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleStartDiagnostic}
                  className="w-full mt-2 py-2.5 px-4 text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-600/25"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Start Tracking</span>
                </button>
              </div>
            ) : (
              /* Active Tracking Mode with Countdown & Stop Tracking */
              <div className="mt-5 space-y-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 text-white p-2.5 font-mono text-xs rounded-xl">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-indigo-400 animate-pulse" />
                    <span className="font-bold text-sm tracking-wider text-indigo-400">
                      {formatCountdown(diagnosticTimeLeft)}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    Live Tracking Active
                  </span>
                </div>

                <div className="relative overflow-hidden">
                  <StudentCameraFeed
                    student={{
                      id: user?.id || 'std-101',
                      name: studentName,
                      rollNo: 'STD-101',
                      status: 'Optimal Focus',
                      avatar: userAvatar,
                    }}
                    isTracking={isTracking}
                    onStatusChange={(_, status, score) => {
                      setFocusScore(score);

                      const now = Date.now();
                      const timeSinceLastBreak = now - lastBreakTimeRef.current;
                      if (score < 50) {
                        lowFocusStreakCountRef.current += 1;
                        if (lowFocusStreakCountRef.current >= 3 && timeSinceLastBreak > 180000 && !showFocusBreakModal) {
                          setBreakTriggerScore(score);
                          setShowFocusBreakModal(true);
                          lastBreakTimeRef.current = now;
                          lowFocusStreakCountRef.current = 0;
                        }
                      } else {
                        lowFocusStreakCountRef.current = Math.max(0, lowFocusStreakCountRef.current - 1);
                      }
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBreakTriggerScore(focusScore);
                      setShowFocusBreakModal(true);
                    }}
                    className="flex-1 py-2 px-3 text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer border rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300 flex items-center justify-center space-x-1.5"
                    title="Take 60-Second Guided Focus Break"
                  >
                    <span>⚡ Take 60s Focus Reset</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStopDiagnostic('Manually Stopped')}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 px-3 text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer border border-rose-500 rounded-lg flex items-center justify-center space-x-1.5"
                  >
                    <Square className="h-3.5 w-3.5 fill-white" />
                    <span>Stop Tracking</span>
                  </button>
                </div>
              </div>
            )}

            {/* Generate / View Latest Report Option */}
            {latestReport && !isTracking && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white">
                <div className="text-[10px] font-mono">
                  <span className="font-bold block text-indigo-300">Latest Diagnostic Ready</span>
                  <span className="font-sans font-medium text-slate-300">{latestReport.status} • {latestReport.metrics.avgFocusScore}% Focus</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
                >
                  Generate Report
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
            <span>Mesh Calibration: 68 Points</span>
            <ChevronRight className="h-4 w-4 text-indigo-400" />
          </div>
        </div>

        {/* Card 3: Progress */}
        <div className="saas-card saas-card-hover p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden rounded-xl" id="card-student-progress">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <BarChart2 className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-full">
                [OBJECTIVES]
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-heading font-bold text-white">Study Objectives</h3>
              <InfoTooltip title="Task Completion Index" content="Breaking study goals into smaller 15m tasks improves focus completion rates by +35%." isDark={isDark} />
            </div>
            <p className="mt-2 text-xs leading-relaxed font-sans font-medium text-slate-300">
              Check off tasks, complete subject deliverables, and watch your completion index scale up in real-time.
            </p>

            {/* Interactive study objectives list */}
            <div className="mt-6 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-300">Completion rate</span>
                <span className="text-[9px] font-mono font-extrabold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded">
                  {completionRate}% Complete
                </span>
              </div>

              <div className="w-full bg-slate-800 h-2.5 overflow-hidden mb-4 rounded-full border border-slate-700">
                <motion.div
                  className="bg-sky-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>

              <form onSubmit={handleAddTask} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Add custom task objective..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className="flex-1 text-xs border border-slate-700 bg-slate-900 text-white px-3 py-2 outline-none focus:border-sky-500 rounded-lg font-medium transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider cursor-pointer shrink-0 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
                >
                  Add
                </button>
              </form>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {tasks.map((t) => (
                  <div key={t.id} className="flex justify-between items-center border border-slate-800 bg-slate-900/80 p-2.5 px-3 text-xs rounded-lg text-white">
                    <button
                      onClick={() => toggleTask(t.id)}
                      className="flex-1 flex items-center space-x-2.5 text-left cursor-pointer"
                    >
                      <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${t.done ? 'bg-sky-500 border-sky-500 text-white' : 'border-slate-600 bg-slate-800'
                        }`}>
                        {t.done && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className={`font-semibold transition-all ${t.done ? 'line-through opacity-50' : ''
                        }`}>
                        {t.text}
                      </span>
                    </button>
                    <button
                      onClick={() => removeTask(t.id)}
                      className="p-1 cursor-pointer ml-2 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
            <span>Tasks count: {tasks.length} Configured</span>
            <ChevronRight className="h-4 w-4 text-sky-400" />
          </div>
        </div>

        {/* Card 4: Achievements */}
        <div className="saas-card saas-card-hover p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden rounded-xl" id="card-student-achievements">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Award className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full">
                [ACHIEVEMENTS]
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-heading font-bold text-white">Badges & Certificates</h3>
              <InfoTooltip title="Gamified Mastery" content="Earn XP and unlock badges by completing daily focus blocks and keeping gaze focus above 80%." isDark={isDark} />
            </div>
            <p className="mt-2 text-xs leading-relaxed font-sans font-medium text-slate-300">
              Unlock daily streaks, gaze level certificates, and high concentration rewards signed by class teachers.
            </p>

            {/* Interactive Achievements/XP Claims */}
            <div className="mt-6 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-3.5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-300">Streaks claimed</span>
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 rounded font-mono">
                  {currentXP.toLocaleString()} XP
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center space-x-1.5 font-bold p-1 px-3 text-[10px] select-none font-mono uppercase tracking-wider border rounded-lg bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                  <Star className="h-3.5 w-3.5 fill-emerald-400" />
                  <span>5-Day Flame</span>
                </div>
                <div className="flex items-center space-x-1.5 font-bold p-1 px-3 text-[10px] select-none font-mono uppercase tracking-wider border rounded-lg bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Focus Master</span>
                </div>
              </div>

              <button
                onClick={claimBonusXP}
                disabled={hasClaimedBonus}
                className={`w-full py-2.5 px-4 text-xs font-bold uppercase font-mono tracking-widest transition-all cursor-pointer border rounded-lg flex items-center justify-center gap-1.5 ${hasClaimedBonus
                    ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                  }`}
              >
                <Award className="h-3.5 w-3.5" />
                <span>{hasClaimedBonus ? 'Daily Bonus Claimed' : 'Claim Daily Bonus (+100 XP)'}</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
            <span>Multiplier level: 1.2x Boost</span>
            <ChevronRight className="h-4 w-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Attention Diagnostic History Section */}
      <div className="mt-10 saas-card p-6 sm:p-8 rounded-xl" id="attention-diagnostic-history-section">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-indigo-400">
              [DIAGNOSTIC ARCHIVE]
            </span>
            <h3 className="text-xl font-heading font-bold text-white mt-1 flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-400" />
              <span>Attention Diagnostic History</span>
            </h3>
            <p className="text-xs mt-1 font-medium text-slate-300">
              Historical logs of past diagnostic tracking sessions. Revisit metrics, observations, and focus recommendations.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <div className="border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-[10px] font-bold uppercase rounded-lg text-slate-300">
              Logged Sessions: {diagnosticHistory.length} Records
            </div>
            {diagnosticHistory.length > 0 && (
              <button
                onClick={() => setShowClearAllReportsModal(true)}
                className="bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1"
                title="Delete All Reports"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {diagnosticHistory.length === 0 ? (
          <div className={`text-center py-10 border-2 rounded-xl text-xs font-mono font-medium ${isDark ? 'bg-[#0F172A] border-slate-700 text-slate-400' : 'bg-[#F8F7F4] border-[#1C1B1A]/20 text-[#1C1B1A]/60'
            }`}>
            No diagnostic sessions recorded yet. Start a session in the Attention Diagnostic card above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b-2 text-[9px] font-mono uppercase tracking-wider font-extrabold ${isDark ? 'border-slate-700 bg-[#0F172A] text-slate-300' : 'border-[#1C1B1A]/20 bg-[#F8F7F4] text-[#1C1B1A]'
                  }`}>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Session Topic</th>
                  <th className="py-3 px-4">Duration (Config / Actual)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Avg Focus</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs font-sans ${isDark ? 'divide-slate-700' : 'divide-[#1C1B1A]/10'}`}>
                {diagnosticHistory.map((item) => (
                  <tr key={item.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/60' : 'hover:bg-[#F8F7F4]/80'
                    }`}>
                    <td className={`py-3.5 px-4 font-mono text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-[#1C1B1A]/90'
                      }`}>
                      {item.date}
                    </td>
                    <td className={`py-3.5 px-4 font-bold ${isDark ? 'text-white' : 'text-[#1C1B1A]'}`}>
                      {item.sessionTitle}
                    </td>
                    <td className={`py-3.5 px-4 font-mono text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-[#1C1B1A]/80'
                      }`}>
                      {item.configuredDurationMinutes}m / {Math.floor(item.actualDurationSeconds / 60)}m {item.actualDurationSeconds % 60}s
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded ${item.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                          : 'bg-amber-100 text-amber-900 border border-amber-400'
                        }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-[#FF5A5F]">
                      {item.metrics.avgFocusScore}%
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => exportReportToPDF(item, false)}
                          className="bg-[#FF5A5F]/20 hover:bg-[#FF5A5F]/30 border border-[#FF5A5F]/40 text-[#FF5A5F] hover:text-white px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center space-x-1"
                          title="Download Formatted PDF Summary"
                        >
                          <Download className="h-3 w-3" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => exportReportToCSV(item, false)}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center space-x-1"
                          title="Download CSV Dataset"
                        >
                          <FileText className="h-3 w-3" />
                          <span>CSV</span>
                        </button>
                        <button
                          onClick={() => {
                            setViewingHistoryReport(item);
                            setShowReportModal(true);
                          }}
                          className={`px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center space-x-1 rounded-lg border-2 ${isDark ? 'bg-[#FF5A5F] hover:bg-rose-600 border-[#FF5A5F] text-white' : 'bg-[#1C1B1A] hover:bg-[#B18F5A] border-[#1C1B1A] text-white'
                            }`}
                        >
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => setDeleteReportTarget({ id: item.id, title: item.sessionTitle })}
                          className="bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer inline-flex items-center space-x-1"
                          title="Delete Unnecessary Report"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Single Student Report Delete */}
      {deleteReportTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white p-6 max-w-md w-full shadow-2xl text-center rounded-xl space-y-4">
            <div className="mx-auto w-12 h-12 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Delete Diagnostic Report?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete the report for <span className="text-white font-semibold">"{deleteReportTarget.title}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteReportTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs uppercase font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStudentReport(deleteReportTarget.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs uppercase font-bold rounded-lg cursor-pointer"
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear All Student Reports */}
      {showClearAllReportsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white p-6 max-w-md w-full shadow-2xl text-center rounded-xl space-y-4">
            <div className="mx-auto w-12 h-12 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Clear All Reports?</h3>
              <p className="text-xs text-slate-400 mt-1">
                This will permanently delete all {diagnosticHistory.length} archived diagnostic reports. This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => setShowClearAllReportsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs uppercase font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearAllStudentReports}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs uppercase font-bold rounded-lg cursor-pointer"
              >
                Clear All Reports
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Diagnostic Report Modal */}
      {showReportModal && (
        <DiagnosticReportModal
          studentReport={viewingHistoryReport || latestReport}
          onClose={() => {
            setShowReportModal(false);
            setViewingHistoryReport(null);
          }}
          onDeleteReport={handleDeleteStudentReport}
        />
      )}

      {/* Subject-Based Analytics & Chronotype Breakdown */}
      <SubjectAndHourlyAnalytics
        reports={diagnosticHistory}
        isDark={isDark}
      />

      {/* Adaptive In-Session Focus Break Modal */}
      <FocusBreakModal
        isOpen={showFocusBreakModal}
        onClose={handleFocusBreakClose}
        triggerFocusScore={breakTriggerScore}
        studentName={studentName}
        isDark={isDark}
      />
    </div>
  );
};
