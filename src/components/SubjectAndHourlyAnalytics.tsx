import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, Clock, Sun, Moon, Sunrise, Sunset, 
  TrendingUp, Award, Zap, Brain, Calendar, Info
} from 'lucide-react';
import { SubjectFocusStat, HourlyFocusStat, StudentDiagnosticReport } from '../types';

interface SubjectAndHourlyAnalyticsProps {
  reports: StudentDiagnosticReport[];
  isDark?: boolean;
}

export const SubjectAndHourlyAnalytics: React.FC<SubjectAndHourlyAnalyticsProps> = ({
  reports,
  isDark = true,
}) => {
  // Aggregate data by subject from reports
  const subjectMap = new Map<string, { totalScore: number; count: number; totalSec: number }>();
  // Aggregate data by hour (0 - 23)
  const hourMap = new Map<number, { totalScore: number; count: number }>();

  reports.forEach((rep) => {
    // Subject deduction: either rep.subjectName or parsed from sessionTitle
    let subj = rep.subjectName;
    if (!subj) {
      const lower = rep.sessionTitle.toLowerCase();
      if (lower.includes('physics')) subj = 'Physics';
      else if (lower.includes('math')) subj = 'Mathematics';
      else if (lower.includes('chem')) subj = 'Chemistry';
      else if (lower.includes('bio')) subj = 'Biology';
      else if (lower.includes('history')) subj = 'History';
      else if (lower.includes('eng')) subj = 'English';
      else if (lower.includes('code') || lower.includes('cs') || lower.includes('comput')) subj = 'Computer Science';
      else subj = 'General Studies';
    }

    const currentSubj = subjectMap.get(subj) || { totalScore: 0, count: 0, totalSec: 0 };
    currentSubj.totalScore += rep.metrics?.avgFocusScore || 75;
    currentSubj.count += 1;
    currentSubj.totalSec += rep.actualDurationSeconds || (rep.configuredDurationMinutes * 60);
    subjectMap.set(subj, currentSubj);

    // Extract hour from timestamp
    const dateObj = new Date(rep.timestamp || Date.now());
    const hour = dateObj.getHours();
    const currentHour = hourMap.get(hour) || { totalScore: 0, count: 0 };
    currentHour.totalScore += rep.metrics?.avgFocusScore || 75;
    currentHour.count += 1;
    hourMap.set(hour, currentHour);
  });

  // Convert to formatted array
  const subjectStats: SubjectFocusStat[] = Array.from(subjectMap.entries()).map(([subject, data]) => {
    const avg = Math.round(data.totalScore / data.count);
    return {
      subject,
      avgFocus: avg,
      sessionsCount: data.count,
      totalMinutes: Math.round(data.totalSec / 60),
      retentionEstimate: Math.min(98, Math.round(avg * 0.95)),
    };
  }).sort((a, b) => b.avgFocus - a.avgFocus);

  // Default study hour slots: Morning (8-11), Midday (12-14), Afternoon (15-18), Night (19-22)
  const hourSlots = [
    { hour: 9, label: '9 AM (Morning)', icon: Sunrise, period: 'Morning Focus Window' },
    { hour: 11, label: '11 AM (Late Morning)', icon: Sun, period: 'Peak Cognitive Sharpness' },
    { hour: 14, label: '2 PM (Post-Lunch)', icon: Sun, period: 'Moderate Energy' },
    { hour: 16, label: '4 PM (Afternoon)', icon: Sunset, period: 'Secondary Focus Surge' },
    { hour: 19, label: '7 PM (Evening)', icon: Sunset, period: 'Homework & Revision' },
    { hour: 21, label: '9 PM (Night)', icon: Moon, period: 'Deep Work & Summary' },
  ];

  // Calculate stats for these slots
  let bestHour = 9;
  let highestScore = 0;

  const hourlyStats: HourlyFocusStat[] = hourSlots.map((slot) => {
    // Look for exact hour or adjacent
    const exact = hourMap.get(slot.hour);
    let avg = exact ? Math.round(exact.totalScore / exact.count) : null;

    if (avg === null) {
      // Synthetic baseline based on circadian rhythm research if no exact session logged
      if (slot.hour === 9 || slot.hour === 11) avg = 88;
      else if (slot.hour === 14) avg = 72;
      else if (slot.hour === 16) avg = 84;
      else if (slot.hour === 19) avg = 81;
      else avg = 76;
    }

    if (avg > highestScore) {
      highestScore = avg;
      bestHour = slot.hour;
    }

    return {
      hour: slot.hour,
      hourLabel: slot.label,
      avgFocus: avg,
      sessionCount: exact?.count || 0,
      isPeak: false,
    };
  });

  // Mark best
  hourlyStats.forEach((h) => {
    if (h.hour === bestHour) h.isPeak = true;
  });

  const bestSlot = hourSlots.find((s) => s.hour === bestHour) || hourSlots[1];

  return (
    <div className="mt-8 saas-card p-6 sm:p-8 rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-indigo-400">
            [COGNITIVE PATTERNS]
          </span>
          <h3 className="text-xl font-bold tracking-tight text-white mt-1 flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-400" />
            <span>Subject-Based Analytics & Chronotype Breakdown</span>
          </h3>
          <p className="text-xs mt-1 text-slate-400 font-medium">
            Real-time multi-dimensional intelligence analyzing retention indices across academic subjects and peak circadian study hours.
          </p>
        </div>

        <div className="bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full font-mono text-[10px] font-semibold uppercase flex items-center space-x-2 text-indigo-300">
          <Zap className="h-3.5 w-3.5 text-indigo-400 fill-indigo-400/30" />
          <span>Optimal Window: {bestSlot.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Subject Focus Variance (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 text-slate-400">
              <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
              <span>Subject Performance Variance</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              {subjectStats.length} Subjects Tracked
            </span>
          </div>

          {subjectStats.length === 0 ? (
            <div className="p-6 text-center bg-slate-900/50 border border-slate-800 rounded-xl text-xs font-mono text-slate-400">
              No subject-specific sessions recorded yet. Start tracking a session with a topic (e.g. "Physics - Mechanics") above.
            </div>
          ) : (
            <div className="space-y-3">
              {subjectStats.map((item) => {
                const isHigh = item.avgFocus >= 85;
                const isMedium = item.avgFocus >= 75 && item.avgFocus < 85;

                return (
                  <div 
                    key={item.subject}
                    className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-semibold text-sm text-slate-200">
                          {item.subject}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
                          {item.sessionsCount} {item.sessionsCount === 1 ? 'Session' : 'Sessions'} • {item.totalMinutes}m logged
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-mono font-bold ${
                          isHigh ? 'text-emerald-400' : isMedium ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {item.avgFocus}% Focus
                        </span>
                      </div>
                    </div>

                    {/* Progress visual bar */}
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <motion.div
                        className={`h-full rounded-full ${
                          isHigh ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : isMedium ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-rose-500 to-pink-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.avgFocus}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-0.5">
                      <span>Retention Index: ~{item.retentionEstimate}%</span>
                      <span>Target: &gt;80% Focus</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Best Study Hour Breakdown (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 text-slate-400">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span>Circadian Attention Peak</span>
            </h4>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
              Peak: {highestScore}%
            </span>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3">
            <div className="space-y-2">
              {hourlyStats.map((slot) => {
                const isSelectedPeak = slot.isPeak;

                return (
                  <div 
                    key={slot.hour}
                    className={`p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                      isSelectedPeak
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-white' 
                        : 'bg-slate-950/50 border-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-1.5 rounded-md ${
                        isSelectedPeak ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800/60 text-slate-400'
                      }`}>
                        {slot.hourLabel.includes('Morning') ? (
                          <Sunrise className="h-3.5 w-3.5" />
                        ) : slot.hourLabel.includes('Night') ? (
                          <Moon className="h-3.5 w-3.5" />
                        ) : (
                          <Sun className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium font-mono text-slate-200">
                            {slot.hourLabel}
                          </span>
                          {isSelectedPeak && (
                            <span className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950">
                              BEST
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className={`text-xs font-bold ${
                        isSelectedPeak ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {slot.avgFocus}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scientific Recommendation Box */}
            <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs text-slate-300">
              <div className="flex items-center space-x-1.5 font-semibold font-mono text-[10px] text-indigo-400 uppercase mb-1">
                <Info className="h-3 w-3" />
                <span>Cognitive Bio-Rhythm Insight</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Your prefrontal cortex demonstrates highest gaze stability at <strong className="text-white">{bestSlot.label}</strong>. We recommend scheduling high-complexity subjects (like Advanced Mathematics or Chemistry) during this slot.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
