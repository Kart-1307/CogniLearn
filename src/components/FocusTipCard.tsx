import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, Info, Sparkles, RefreshCw, CheckCircle2, Zap, Eye, Brain, ShieldCheck } from 'lucide-react';

export interface FocusTipCardProps {
  focusScore: number;
  completedSessions?: number;
  streakDays?: number;
  isDark?: boolean;
}

export const InfoTooltip: React.FC<{
  content: string;
  title?: string;
  children?: React.ReactNode;
  isDark?: boolean;
}> = ({ content, title, children, isDark = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center group">
      {children ? (
        <span 
          className="cursor-help" 
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onClick={() => setIsOpen(!isOpen)}
        >
          {children}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className={`p-1 rounded-full cursor-help transition-colors ${
            isDark ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800' : 'text-[#1C1B1A]/50 hover:text-[#B18F5A] hover:bg-[#1C1B1A]/5'
          }`}
          aria-label={title || 'Information'}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-3 rounded-xl border shadow-xl z-50 text-left pointer-events-none ${
              isDark 
                ? 'bg-[#0F172A] border-amber-500/30 text-slate-200 shadow-black/60' 
                : 'bg-white border-[#B18F5A]/40 text-[#1C1B1A] shadow-xl'
            }`}
          >
            {title && (
              <div className="flex items-center space-x-1.5 mb-1">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="font-serif italic font-bold text-xs text-amber-400">{title}</span>
              </div>
            )}
            <p className="text-[11px] leading-relaxed font-sans font-medium">{content}</p>
            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b ${
              isDark ? 'bg-[#0F172A] border-amber-500/30' : 'bg-white border-[#B18F5A]/40'
            }`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FocusTipCard: React.FC<FocusTipCardProps> = ({
  focusScore,
  completedSessions = 2,
  streakDays = 5,
  isDark = true,
}) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [isApplied, setIsApplied] = useState(false);
  const [isCustomAi, setIsCustomAi] = useState(false);

  // Focus tips database categorized by cognitive science
  const focusTips = [
    {
      category: 'Gaze & Ocular Health',
      icon: Eye,
      title: 'The 20-20-20 Vision Recovery Rule',
      suggestion: 'To maintain high gaze tracking precision and reduce ciliary eye strain, look at an object 20 feet away for 20 seconds every 20 minutes.',
      impact: 'Prevents micro-fatigue droops during 30m+ study blocks.',
    },
    {
      category: 'Cognitive Ergonomics',
      icon: Brain,
      title: 'Optimize Ambient Desk Lighting',
      suggestion: 'Ensure light sources illuminate from 45° in front of your workspace. Avoid strong backlights that degrade camera face-mesh landmark detection.',
      impact: 'Improves AI gaze vector accuracy by +18%.',
    },
    {
      category: 'Interval Strategy',
      icon: Zap,
      title: 'Ultradian Focus Rhythm (50/10 Rule)',
      suggestion: 'Your current focus score is strong! Structure intensive revision into 45-50 minute deep blocks followed by a complete 10-minute non-screen rest.',
      impact: 'Sustains optimal memory consolidation throughout the day.',
    },
    {
      category: 'Postural Alignment',
      icon: ShieldCheck,
      title: 'Eye-Level Monitor Position',
      suggestion: 'Align the top third of your display with your horizontal eye level. Upright posture maximizes cervical blood flow and maintains steady gaze vectors.',
      impact: 'Reduces head-tilt distraction triggers.',
    },
  ];

  // Dynamic status evaluation
  const getPerformanceBadge = () => {
    if (focusScore >= 85) {
      return {
        label: 'Peak Focus State',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        note: 'High attention coherence detected (+85%). Outstanding concentration!',
      };
    } else if (focusScore >= 70) {
      return {
        label: 'Steady Performance',
        color: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        note: 'Moderate focus level (70-84%). A quick 2-minute posture reset will boost your score.',
      };
    } else {
      return {
        label: 'Focus Recovery Mode',
        color: 'bg-rose-500/10 text-[#FF5A5F] border-rose-500/30',
        note: 'Off-gaze shifts detected. Try taking a short hydration break before your next diagnostic block.',
      };
    }
  };

  const status = getPerformanceBadge();
  const currentTip = focusTips[tipIndex % focusTips.length];
  const TipIcon = currentTip.icon;

  const handleNextTip = () => {
    setIsApplied(false);
    setIsCustomAi(false);
    setTipIndex((prev) => (prev + 1) % focusTips.length);
  };

  const handleGenerateAiTip = () => {
    setIsApplied(false);
    setIsCustomAi(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`border-2 p-5 sm:p-6 rounded-2xl relative overflow-hidden transition-all shadow-xs ${
        isDark 
          ? 'bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-amber-500/30 text-white' 
          : 'bg-gradient-to-br from-amber-50/50 to-white border-[#B18F5A]/30 text-[#1C1B1A]'
      }`}
    >
      {/* Decorative background glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Title and Performance Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-serif italic font-bold text-lg">Daily Focus Intelligence</h3>
              <InfoTooltip
                title="AI Focus Science"
                content="CogniLearn evaluates your real-time gaze vectors, streak duration, and task completion speed to generate personalized focus optimization strategies."
                isDark={isDark}
              />
            </div>
            <p className={`text-[11px] font-sans font-medium ${isDark ? 'text-slate-300' : 'text-[#1C1B1A]/70'}`}>
              Tailored study & eye ergonomics advice based on your current {focusScore}% Focus Score
            </p>
          </div>
        </div>

        {/* Current Focus State Badge */}
        <div className={`px-2.5 py-1 rounded-lg border font-mono text-[10px] font-bold uppercase tracking-wider self-start sm:self-center flex items-center space-x-1.5 ${status.color}`}>
          <Sparkles className="h-3 w-3" />
          <span>{status.label}</span>
        </div>
      </div>

      {/* Tip Content Card */}
      <div className={`p-4 rounded-xl border mb-4 relative ${
        isDark ? 'bg-[#0F172A]/80 border-slate-700' : 'bg-white/90 border-[#1C1B1A]/15'
      }`}>
        {!isCustomAi ? (
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest font-bold text-amber-400 mb-2">
              <span className="flex items-center space-x-1">
                <TipIcon className="h-3.5 w-3.5" />
                <span>{currentTip.category}</span>
              </span>
              <span className="text-slate-400">Tip #{tipIndex + 1} of {focusTips.length}</span>
            </div>

            <h4 className="font-serif italic text-sm font-bold mb-1.5">{currentTip.title}</h4>
            <p className={`text-xs font-sans leading-relaxed mb-2 font-medium ${isDark ? 'text-slate-200' : 'text-[#1C1B1A]'}`}>
              {currentTip.suggestion}
            </p>
            <div className={`text-[11px] font-mono p-2 rounded-lg border ${
              isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              ⚡ <strong>Expected Impact:</strong> {currentTip.impact}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center space-x-1 text-[10px] font-mono uppercase tracking-widest font-bold text-rose-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Personalized AI Focus Recommendation</span>
            </div>
            <h4 className="font-serif italic text-sm font-bold mb-1.5">
              {focusScore >= 80 ? 'Maintain High Flow & Vision Comfort' : 'Micro-Reset Strategy for High Attention'}
            </h4>
            <p className={`text-xs font-sans leading-relaxed mb-2 font-medium ${isDark ? 'text-slate-200' : 'text-[#1C1B1A]'}`}>
              {focusScore >= 80
                ? `You have logged ${completedSessions} study slots with an impressive ${focusScore}% focus average! To sustain this level for upcoming tests, take a 5-minute break every 25 minutes and dim non-essential background lights.`
                : `Your live attention diagnostic is at ${focusScore}%. Take 3 deep breaths, adjust your chair height so your eyes align with the camera top, and run a short 15-minute diagnostic block to rebuild focus momentum.`
              }
            </p>
            <div className={`text-[11px] font-mono p-2 rounded-lg border ${
              isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              🎯 <strong>Pro Tip:</strong> {streakDays}-day active streak multiplier (+1.2x XP) active!
            </div>
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleNextTip}
            className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex items-center space-x-1.5 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-white' : 'bg-white hover:bg-gray-100 border-[#1C1B1A]/30 text-[#1C1B1A]'
            }`}
          >
            <RefreshCw className="h-3 w-3 text-amber-400" />
            <span>Next Strategy</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateAiTip}
            className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex items-center space-x-1.5 ${
              isDark ? 'bg-rose-950/60 hover:bg-rose-900/80 border-rose-800 text-[#FF5A5F]' : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>Custom AI Tip</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsApplied(!isApplied)}
          className={`px-3.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex items-center space-x-1.5 ${
            isApplied 
              ? 'bg-emerald-600 border-emerald-600 text-white' 
              : isDark ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30' : 'bg-[#1C1B1A] border-[#1C1B1A] text-white'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{isApplied ? 'Applied To Study Session!' : 'Apply Strategy'}</span>
        </button>
      </div>
    </motion.div>
  );
};
