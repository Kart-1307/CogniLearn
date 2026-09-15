import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeartPulse, Eye, Sparkles, X, CheckCircle2, RotateCcw, 
  Play, Pause, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import { FocusBreakRecord } from '../types';

interface FocusBreakModalProps {
  isOpen: boolean;
  onClose: (completed: boolean, breakType: 'box-breathing' | '20-20-20-eyes' | 'neck-stretch') => void;
  triggerFocusScore?: number;
  studentName?: string;
  isDark?: boolean;
}

type BreakMode = 'box-breathing' | '20-20-20-eyes' | 'neck-stretch';

export const FocusBreakModal: React.FC<FocusBreakModalProps> = ({
  isOpen,
  onClose,
  triggerFocusScore = 48,
  studentName = 'Student',
  isDark = true,
}) => {
  const [activeMode, setActiveMode] = useState<BreakMode>('box-breathing');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [phaseCounter, setPhaseCounter] = useState<number>(4);

  // Reset timer on open
  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(60);
      setIsActive(true);
      setBreathingPhase('Inhale');
      setPhaseCounter(4);
    }
  }, [isOpen, activeMode]);

  // Main 60-second break countdown
  useEffect(() => {
    if (!isOpen || !isActive) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isActive]);

  // Box Breathing cycle: Inhale (4s) -> Hold (4s) -> Exhale (4s) -> Rest (4s)
  useEffect(() => {
    if (!isOpen || !isActive || activeMode !== 'box-breathing') return;

    const breathInterval = setInterval(() => {
      setPhaseCounter((prev) => {
        if (prev <= 1) {
          setBreathingPhase((curr) => {
            if (curr === 'Inhale') return 'Hold';
            if (curr === 'Hold') return 'Exhale';
            if (curr === 'Exhale') return 'Rest';
            return 'Inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(breathInterval);
  }, [isOpen, isActive, activeMode]);

  if (!isOpen) return null;

  const isCompleted = secondsRemaining === 0;

  const handleFinish = () => {
    onClose(true, activeMode);
  };

  const handleDismiss = () => {
    onClose(isCompleted, activeMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-xl rounded-2xl shadow-2xl border border-slate-800 overflow-hidden transition-all relative bg-[#131C2E] text-slate-100"
      >
        {/* Header Ribbon */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-sm">
              <HeartPulse className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-indigo-400">
                  [ADAPTIVE BIO-BREAK TRIGGERED]
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Focus: {triggerFocusScore}%
                </span>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white leading-tight mt-0.5">
                Take a 60-Second Cognitive Reset, {studentName}
              </h3>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Skip Break"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Mode Tabs */}
          <div className="flex gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs">
            <button
              onClick={() => setActiveMode('box-breathing')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeMode === 'box-breathing'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HeartPulse className="h-3.5 w-3.5" />
              <span>Box Breathing</span>
            </button>
            <button
              onClick={() => setActiveMode('20-20-20-eyes')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeMode === '20-20-20-eyes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>20-20-20 Eye Rest</span>
            </button>
            <button
              onClick={() => setActiveMode('neck-stretch')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeMode === 'neck-stretch'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Neck Release</span>
            </button>
          </div>

          {/* Interactive Visualizer */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
            {activeMode === 'box-breathing' && (
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Expanding / Contracting Breathing Circle */}
                <div className="relative flex items-center justify-center w-36 h-36">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/20 via-sky-500/20 to-teal-500/20 border-2 border-indigo-500/60"
                    animate={{
                      scale: breathingPhase === 'Inhale' ? [1, 1.45] :
                             breathingPhase === 'Hold' ? 1.45 :
                             breathingPhase === 'Exhale' ? [1.45, 1] : 1,
                      opacity: breathingPhase === 'Hold' ? 0.9 : 0.7,
                    }}
                    transition={{
                      duration: 4,
                      ease: 'easeInOut',
                    }}
                  />
                  <div className="relative z-10 text-center">
                    <span className="text-xl font-bold text-indigo-400 block tracking-tight">
                      {breathingPhase}
                    </span>
                    <span className="text-2xl font-mono font-bold text-white">
                      {phaseCounter}s
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 font-sans max-w-sm">
                  Inhale gently through your nose, hold your breath, exhale completely, then pause before the next cycle.
                </p>
              </div>
            )}

            {activeMode === '20-20-20-eyes' && (
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1">
                  <Eye className="h-8 w-8 animate-pulse" />
                </div>
                <h4 className="font-bold text-sm text-emerald-400 tracking-tight">
                  Ocular Distance Decompression
                </h4>
                <p className="text-xs text-slate-400 font-sans max-w-sm leading-relaxed">
                  Look away from your screen at an object at least <strong className="text-white">20 feet away</strong> (e.g. out a window or across the room). Soften your gaze and blink 5 times.
                </p>
                <div className="text-[11px] font-mono font-medium text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Target: 20ft away • Relieves ciliary muscle spasm
                </div>
              </div>
            )}

            {activeMode === 'neck-stretch' && (
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-1">
                  <Zap className="h-8 w-8" />
                </div>
                <h4 className="font-bold text-sm text-amber-400 tracking-tight">
                  Cervical Spine Relaxation
                </h4>
                <p className="text-xs text-slate-400 font-sans max-w-sm leading-relaxed">
                  Gently roll your shoulders backward 5 times. Drop your right ear toward your right shoulder for 10s, then switch to the left. Keep breathing steadily.
                </p>
                <div className="text-[11px] font-mono font-medium text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  Relieves trapezius tension & restores blood flow
                </div>
              </div>
            )}
          </div>

          {/* Countdown Clock & Status Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Time Remaining:</span>
              <span className="font-bold text-indigo-400 text-base">
                {secondsRemaining}s
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsActive(!isActive)}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title={isActive ? 'Pause' : 'Resume'}
              >
                {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              </button>
              <button
                onClick={() => {
                  setSecondsRemaining(60);
                  setPhaseCounter(4);
                  setIsActive(true);
                }}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Restart Timer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
          <button
            onClick={handleDismiss}
            className="text-xs font-mono font-medium uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer text-slate-400 hover:text-white transition-colors"
          >
            Skip for now
          </button>

          <button
            onClick={handleFinish}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs uppercase font-semibold tracking-wider cursor-pointer shadow-sm transition-all flex items-center space-x-2 ${
              isCompleted
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isCompleted ? 'Complete Reset (+25 XP)' : 'Done Early & Return'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
