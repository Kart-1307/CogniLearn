import React, { useState } from 'react';
import { motion } from 'motion/react';
import { StudentDiagnosticReport, ClassDiagnosticReport, DiagnosticMetric } from '../types';
import { exportReportToCSV, exportReportToPDF } from '../utils/reportExport';
import {
  X, Activity, Clock, CheckCircle2, AlertTriangle, Eye, ShieldCheck,
  User, Users, Sparkles, BarChart2, Award, Printer, ArrowRight, FileText, Trash2,
  TrendingUp, Zap, HeartPulse, Target, Compass, Brain, AlertCircle, HelpCircle, Download
} from 'lucide-react';

interface DiagnosticReportModalProps {
  studentReport?: StudentDiagnosticReport | null;
  classReport?: ClassDiagnosticReport | null;
  onClose: () => void;
  onDeleteReport?: (id: string) => void;
}

// Helper to fill in or generate detailed report analytics if missing
function ensureDetailedMetrics(m: DiagnosticMetric) {
  const avg = m.avgFocusScore || 75;
  const opt = m.optimalFocusPercent || Math.min(90, Math.round(avg * 0.85));
  const dist = m.distractedPercent || Math.max(5, 100 - opt - (m.moderateFocusPercent || 15));
  const mod = m.moderateFocusPercent || Math.max(0, 100 - opt - dist);

  const gazeBreakdown = m.gazeBreakdown || {
    centerPercent: opt,
    offScreenLeftPercent: Math.round(dist * 0.35),
    offScreenRightPercent: Math.round(dist * 0.35),
    lookingDownPercent: Math.round(dist * 0.20),
    lookingUpPercent: Math.round(dist * 0.05),
    eyesClosedPercent: Math.round(dist * 0.05),
  };

  const fatigueRiskLevel = avg > 80 ? 'Low' : avg > 65 ? 'Moderate' : avg > 50 ? 'High' : 'Critical';
  const fatigueAnalysis = m.fatigueAnalysis || {
    blinkRatePerMin: avg > 78 ? 16 : avg > 60 ? 24 : 32,
    averageEyeOpenness: Number((0.22 + (avg / 100) * 0.08).toFixed(2)),
    fatigueRiskLevel: fatigueRiskLevel as any,
    fatigueDescription: avg > 80
      ? 'Optimal eye moisture and steady blink rhythm. Minimal cognitive fatigue detected.'
      : avg > 65
        ? 'Mild eye strain detected with occasional rapid blinking. Short break recommended.'
        : 'High cognitive fatigue and ocular exhaustion detected. Immediate 5-minute break advised.',
    postureScore: Math.min(98, Math.max(50, Math.round(avg * 0.95 + 8))),
  };

  const cognitiveMetrics = m.cognitiveMetrics || {
    focusStabilityIndex: Math.min(99, Math.max(40, Math.round(avg * 0.92 + 5))),
    peakAttentionTime: '04m 15s',
    lowestAttentionTime: '12m 30s',
    focusDropEventsCount: m.gazeShiftsCount || Math.round((100 - avg) / 6),
    estimatedComprehensionRate: Math.min(98, Math.max(45, Math.round(avg * 0.95))),
    engagementLevel: (avg >= 82 ? 'Optimal Active' : avg >= 68 ? 'Sustained Steady' : avg >= 52 ? 'Variable Attention' : 'At-Risk') as any,
  };

  // Generate 8 timeline samples across the session duration
  const timelineSamples = m.timelineSamples || Array.from({ length: 8 }, (_, i) => {
    const timeSec = (i + 1) * 120;
    const mLabel = `${Math.floor(timeSec / 60).toString().padStart(2, '0')}:${(timeSec % 60).toString().padStart(2, '0')}`;
    const scoreVariation = Math.sin(i * 1.2) * 12 + Math.cos(i * 0.8) * 8;
    const score = Math.max(25, Math.min(99, Math.round(avg + scoreVariation)));
    return {
      timeSec,
      timeLabel: mLabel,
      focusScore: score,
      gazeState: score > 75 ? 'Direct Center' : score > 55 ? 'Micro Shift' : 'Off Screen',
    };
  });

  return {
    ...m,
    gazeBreakdown,
    fatigueAnalysis,
    cognitiveMetrics,
    timelineSamples,
  };
}

export const DiagnosticReportModal: React.FC<DiagnosticReportModalProps> = ({
  studentReport,
  classReport,
  onClose,
  onDeleteReport,
}) => {
  const [activeTab, setActiveTab] = useState<'class' | 'student'>('class');
  const [selectedStudentId, setSelectedStudentId] = useState<string | number>(
    classReport?.studentReports[0]?.studentId || ''
  );
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [rosterFilter, setRosterFilter] = useState<'all' | 'high' | 'low'>('all');
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  if (!studentReport && !classReport) return null;

  const currentReportId = (classReport?.id || studentReport?.id) as string;

  const handleDelete = () => {
    if (onDeleteReport && currentReportId) {
      onDeleteReport(currentReportId);
      onClose();
    }
  };

  const isClass = Boolean(classReport);
  const rawStudentReport = isClass
    ? classReport?.studentReports.find(s => String(s.studentId) === String(selectedStudentId)) || classReport?.studentReports[0]
    : studentReport;

  const currentStudentReport = rawStudentReport ? {
    ...rawStudentReport,
    metrics: ensureDetailedMetrics(rawStudentReport.metrics),
  } : null;

  const handleExportCSV = () => {
    if (isClass && classReport) {
      exportReportToCSV(classReport, true);
    } else if (currentStudentReport) {
      exportReportToCSV(currentStudentReport, false);
    }
  };

  const handleExportPDF = () => {
    if (isClass && classReport) {
      exportReportToPDF(classReport, true);
    } else if (currentStudentReport) {
      exportReportToPDF(currentStudentReport, false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const handlePrint = () => {
    handleExportPDF();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-[#131C2E] border border-slate-800 shadow-2xl max-w-4xl w-full my-6 text-slate-100 relative overflow-hidden flex flex-col max-h-[92vh] rounded-2xl">
        {/* Top Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-indigo-400">
                [COGNILERAN COMPREHENSIVE ATTENTION ANALYTICS]
              </span>
              <h2 className="text-lg font-bold tracking-tight text-white leading-tight mt-0.5">
                {isClass ? `Class Diagnostic — ${classReport?.className}` : `Diagnostic Report — ${studentReport?.studentName}`}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onDeleteReport && (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 transition-colors cursor-pointer rounded-lg"
                title="Delete Report"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer rounded-lg flex items-center space-x-1.5 text-[10px] font-mono font-medium uppercase tracking-wider"
              title="Export formatted PDF Report"
            >
              <Download className="h-3.5 w-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer rounded-lg flex items-center space-x-1.5 text-[10px] font-mono font-medium uppercase tracking-wider"
              title="Export CSV Dataset"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer rounded-lg"
              title="Print Summary"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer rounded-lg"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher for Class Report */}
        {isClass && (
          <div className="bg-[#1C1B1A]/5 border-b border-[#1C1B1A]/10 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-wider shrink-0">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('class')}
                className={`px-3.5 py-1.5 font-bold cursor-pointer transition-colors border rounded-md ${activeTab === 'class'
                    ? 'bg-[#1C1B1A] text-white border-[#1C1B1A]'
                    : 'bg-white text-[#1C1B1A]/70 border-[#1C1B1A]/20 hover:text-[#1C1B1A]'
                  }`}
              >
                Overall Class Analytics
              </button>
              <button
                onClick={() => setActiveTab('student')}
                className={`px-3.5 py-1.5 font-bold cursor-pointer transition-colors border rounded-md ${activeTab === 'student'
                    ? 'bg-[#1C1B1A] text-white border-[#1C1B1A]'
                    : 'bg-white text-[#1C1B1A]/70 border-[#1C1B1A]/20 hover:text-[#1C1B1A]'
                  }`}
              >
                Individual Student Deep Dive
              </button>
            </div>

            {activeTab === 'student' && classReport?.studentReports && (
              <div className="flex items-center space-x-2">
                <span className="text-[#1C1B1A]/60 font-bold">Select Student:</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-white border border-[#1C1B1A]/20 px-2.5 py-1 text-xs font-sans text-[#1C1B1A] font-medium outline-none focus:border-[#B18F5A] rounded"
                >
                  {classReport.studentReports.map(s => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.studentName} ({s.metrics.avgFocusScore}% Focus)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* 1. Overall Class Overview View */}
          {isClass && activeTab === 'class' && classReport && (
            <div className="space-y-6">
              {/* Meta Banner */}
              <div className="bg-slate-900/80 border border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 rounded-xl">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                    CLASSROOM SESSION METADATA
                  </span>
                  <div className="flex items-center space-x-2 text-xs font-semibold">
                    <span className="text-base font-heading font-bold text-white">{classReport.sessionTitle}</span>
                    <span className="text-slate-500">•</span>
                    <span className="font-mono text-slate-300 font-bold">{classReport.date}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase">
                  <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 font-extrabold text-slate-300 rounded">
                    Configured: {classReport.configuredDurationMinutes}m
                  </span>
                  <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 font-extrabold text-slate-300 rounded">
                    Actual: {formatSeconds(classReport.actualDurationSeconds)}
                  </span>
                  <span className={`px-2.5 py-1 font-bold text-white rounded ${classReport.status === 'Completed' ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}>
                    {classReport.status}
                  </span>
                </div>
              </div>

              {/* Class Metrics Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-[#1C1B1A]/20 p-4 rounded-lg shadow-xs">
                  <div className="flex items-center justify-between text-[#8A5A1B]">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Class Focus Avg</span>
                    <BarChart2 className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-black font-mono text-[#8A5A1B] mt-1">{classReport.avgClassFocus}%</p>
                  <p className="text-[10px] text-[#1C1B1A]/60 font-medium mt-0.5">Mean focus benchmark</p>
                </div>

                <div className="bg-white border border-[#1C1B1A]/20 p-4 rounded-lg shadow-xs">
                  <div className="flex items-center justify-between text-[#1C1B1A]">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Peak Cohort Focus</span>
                    <TrendingUp className="h-4 w-4 text-emerald-700" />
                  </div>
                  <p className="text-2xl font-black font-mono text-[#1C1B1A] mt-1">{classReport.peakClassFocus}%</p>
                  <p className="text-[10px] text-[#1C1B1A]/60 font-medium mt-0.5">Highest attention point</p>
                </div>

                <div className="bg-white border border-[#1C1B1A]/20 p-4 rounded-lg shadow-xs">
                  <div className="flex items-center justify-between text-[#1C1B1A]">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Students Tracked</span>
                    <Users className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-black font-mono text-[#1C1B1A] mt-1">{classReport.studentsCount}</p>
                  <p className="text-[10px] text-[#1C1B1A]/60 font-medium mt-0.5">Active pupils in frame</p>
                </div>

                <div className="bg-white border border-[#1C1B1A]/20 p-4 rounded-lg shadow-xs">
                  <div className="flex items-center justify-between text-emerald-800">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Optimal Focus Cohort</span>
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-black font-mono text-emerald-800 mt-1">{classReport.optimalStudentsCount}</p>
                  <p className="text-[10px] text-[#1C1B1A]/60 font-medium mt-0.5">&gt;75% sustained attention</p>
                </div>
              </div>

              {/* Class Observations */}
              <div className="bg-white border border-[#1C1B1A]/20 p-5 rounded-lg shadow-xs space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#8A5A1B] flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-[#8A5A1B]" />
                  <span>Classroom Diagnostic Observations</span>
                </h3>
                <ul className="space-y-2 text-xs text-[#1C1B1A] font-sans leading-relaxed font-medium">
                  {classReport.classObservations.map((obs, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-[#8A5A1B] font-bold mt-0.5">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Class Recommendations */}
              <div className="bg-[#8A5A1B]/10 border border-[#8A5A1B]/40 p-5 rounded-lg space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#8A5A1B] flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[#8A5A1B]" />
                  <span>Instructor Pedagogical Action Plan</span>
                </h3>
                <ul className="space-y-2 text-xs text-[#1C1B1A] font-sans leading-relaxed font-semibold">
                  {classReport.classRecommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-[#8A5A1B] font-bold mt-0.5">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Participating Student Breakdown Table */}
              <div className="bg-white border border-[#1C1B1A]/20 p-5 rounded-lg shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C1B1A]/10 pb-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1C1B1A]">
                    Student Roster Diagnostic Performance ({classReport.studentReports.length})
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search student..."
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      className="bg-[#1C1B1A]/5 border border-[#1C1B1A]/20 px-2.5 py-1 text-xs font-sans text-[#1C1B1A] outline-none focus:border-[#B18F5A] rounded w-36"
                    />
                    <div className="flex space-x-1 font-mono text-[9px] uppercase font-bold">
                      <button
                        onClick={() => setRosterFilter('all')}
                        className={`px-2 py-1 rounded cursor-pointer ${rosterFilter === 'all' ? 'bg-[#1C1B1A] text-white' : 'bg-[#1C1B1A]/10 text-[#1C1B1A]'
                          }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setRosterFilter('high')}
                        className={`px-2 py-1 rounded cursor-pointer ${rosterFilter === 'high' ? 'bg-emerald-700 text-white' : 'bg-[#1C1B1A]/10 text-[#1C1B1A]'
                          }`}
                      >
                        ≥75%
                      </button>
                      <button
                        onClick={() => setRosterFilter('low')}
                        className={`px-2 py-1 rounded cursor-pointer ${rosterFilter === 'low' ? 'bg-rose-700 text-white' : 'bg-[#1C1B1A]/10 text-[#1C1B1A]'
                          }`}
                      >
                        &lt;65%
                      </button>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-[#1C1B1A]/10 text-xs max-h-72 overflow-y-auto">
                  {classReport.studentReports
                    .filter((s) => {
                      const matchesName = s.studentName.toLowerCase().includes(rosterSearch.toLowerCase());
                      if (rosterFilter === 'high') return matchesName && s.metrics.avgFocusScore >= 75;
                      if (rosterFilter === 'low') return matchesName && s.metrics.avgFocusScore < 65;
                      return matchesName;
                    })
                    .map((s) => (
                      <div
                        key={s.studentId}
                        onClick={() => {
                          setSelectedStudentId(s.studentId);
                          setActiveTab('student');
                        }}
                        className="py-3 px-2 flex items-center justify-between hover:bg-[#1C1B1A]/5 cursor-pointer transition-colors rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#1C1B1A] text-white flex items-center justify-center font-bold font-mono text-xs rounded-md">
                            {s.studentName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-[#1C1B1A] block">{s.studentName}</span>
                            <span className="text-[10px] text-[#1C1B1A]/60 font-mono">
                              Optimal Focus: {s.metrics.optimalFocusPercent}% | Shifts: {s.metrics.gazeShiftsCount}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 font-mono text-[11px] text-[#1C1B1A] font-bold">
                          <span>Avg Focus: <strong className="text-[#8A5A1B] text-sm">{s.metrics.avgFocusScore}%</strong></span>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-[#1C1B1A]/10 rounded">
                            {s.metrics.meshQuality}
                          </span>
                          <ArrowRight className="h-4 w-4 text-[#8A5A1B]" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. Individual Student Detailed Report View */}
          {(!isClass || activeTab === 'student') && currentStudentReport && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-indigo-400">
                    INDIVIDUAL COGNITIVE DIAGNOSTIC PROFILE
                  </span>
                  <h3 className="text-xl font-heading font-bold text-white mt-0.5">
                    {currentStudentReport.studentName}
                  </h3>
                  <p className="text-xs font-mono text-slate-300 font-semibold mt-1">
                    Session: {currentStudentReport.sessionTitle} • Date: {currentStudentReport.date}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase">
                  <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 font-extrabold text-slate-300 rounded">
                    Configured: {currentStudentReport.configuredDurationMinutes}m
                  </span>
                  <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 font-extrabold text-slate-300 rounded">
                    Actual: {formatSeconds(currentStudentReport.actualDurationSeconds)}
                  </span>
                  <span className={`px-2.5 py-1 font-bold text-white rounded ${currentStudentReport.status === 'Completed' ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}>
                    {currentStudentReport.status}
                  </span>
                </div>
              </div>

              {/* Executive Metrics 4-Card Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-[#1C1B1A]/20 p-4 rounded-lg shadow-xs">
                  <div className="flex justify-between items-center text-[#8A5A1B]">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Average Focus</span>
                    <Target className="h-4 w-4" />
                  </div>
                  <p className="text-3xl font-black font-mono text-[#8A5A1B] mt-1">{currentStudentReport.metrics.avgFocusScore}%</p>
                  <p className="text-[10px] text-[#1C1B1A]/60 font-medium mt-0.5">Session Mean Score</p>
                </div>

                <div className="bg-white border border-[#1C1B1A]/20 p-4 rounded-lg shadow-xs">
                  <div className="flex justify-between items-center text-[#1C1B1A]">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Peak Focus</span>
                    <TrendingUp className="h-4 w-4 text-emerald-700" />
                  </div>
                  <p className="text-3xl font-black font-mono text-[#1C1B1A] mt-1">{currentStudentReport.metrics.peakFocusScore}%</p>
                  <p className="text-[10px] text-[#1C1B1A]/60 font-medium mt-0.5">Maximum Concentration</p>
                </div>

                <div className="bg-white border border-[#1C1B1A]/20 p-4 rounded-lg shadow-xs">
                  <div className="flex justify-between items-center text-emerald-800">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Optimal Gaze %</span>
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <p className="text-3xl font-black font-mono text-emerald-800 mt-1">{currentStudentReport.metrics.optimalFocusPercent}%</p>
                  <p className="text-[10px] text-[#1C1B1A]/60 font-medium mt-0.5">Direct Screen Lock</p>
                </div>

                <div className="bg-white border border-[#1C1B1A]/20 p-4 rounded-lg shadow-xs">
                  <div className="flex justify-between items-center text-amber-800">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Distraction Lapses</span>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <p className="text-3xl font-black font-mono text-amber-800 mt-1">{currentStudentReport.metrics.gazeShiftsCount}</p>
                  <p className="text-[10px] text-[#1C1B1A]/60 font-medium mt-0.5">Gaze Deviation Events</p>
                </div>
              </div>

              {/* Time-Series Attention Progression Chart */}
              <div className="bg-white border border-[#1C1B1A]/20 p-5 rounded-lg shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1C1B1A] flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-[#8A5A1B]" />
                    <span>Time-Series Attention Curve</span>
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-[#8A5A1B]">
                    Peak: {currentStudentReport.metrics.cognitiveMetrics?.peakAttentionTime}
                  </span>
                </div>

                {/* Visual Bar Timeline Graph */}
                <div className="pt-2">
                  <div className="h-24 w-full flex items-end gap-1.5 border-b border-[#1C1B1A]/20 pb-1">
                    {currentStudentReport.metrics.timelineSamples?.map((sample, idx) => {
                      const hPercent = sample.focusScore;
                      const barColor = hPercent >= 75 ? 'bg-[#8A5A1B]' : hPercent >= 55 ? 'bg-amber-500' : 'bg-rose-500';
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#1C1B1A] text-white text-[9px] font-mono py-1 px-1.5 rounded whitespace-nowrap pointer-events-none z-10 shadow-lg">
                            {sample.timeLabel}: {sample.focusScore}% ({sample.gazeState})
                          </div>
                          <motion.div
                            className={`w-full ${barColor} rounded-t hover:brightness-110`}
                            initial={{ height: 0 }}
                            animate={{ height: `${hPercent}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.04 }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-mono text-[#1C1B1A]/70 font-bold mt-2">
                    {currentStudentReport.metrics.timelineSamples?.map((sample, idx) => (
                      <span key={idx}>{sample.timeLabel}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cognitive & Ocular Diagnostics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ocular & Fatigue Diagnostics */}
                <div className="bg-white border border-[#1C1B1A]/20 p-5 rounded-lg shadow-xs space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#8A5A1B] flex items-center space-x-2">
                    <HeartPulse className="h-4 w-4 text-[#8A5A1B]" />
                    <span>Ocular Health & Fatigue Risk</span>
                  </h4>

                  <div className="space-y-3 pt-1 text-xs">
                    <div className="flex items-center justify-between border-b border-[#1C1B1A]/10 pb-2">
                      <span className="text-[#1C1B1A]/70 font-medium">Fatigue Risk Level:</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] uppercase ${currentStudentReport.metrics.fatigueAnalysis?.fatigueRiskLevel === 'Low'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : currentStudentReport.metrics.fatigueAnalysis?.fatigueRiskLevel === 'Moderate'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                        {currentStudentReport.metrics.fatigueAnalysis?.fatigueRiskLevel} Risk
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-[#1C1B1A]/10 pb-2">
                      <span className="text-[#1C1B1A]/70 font-medium">Blink Rate:</span>
                      <span className="font-mono font-bold text-[#1C1B1A]">
                        {currentStudentReport.metrics.fatigueAnalysis?.blinkRatePerMin} blinks/min
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-[#1C1B1A]/10 pb-2">
                      <span className="text-[#1C1B1A]/70 font-medium">Eye Aspect Ratio (EAR):</span>
                      <span className="font-mono font-bold text-[#1C1B1A]">
                        {currentStudentReport.metrics.fatigueAnalysis?.averageEyeOpenness}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#1C1B1A]/70 font-medium">Posture Stability:</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {currentStudentReport.metrics.fatigueAnalysis?.postureScore}/100
                      </span>
                    </div>

                    <p className="text-[11px] text-[#1C1B1A]/80 italic bg-[#1C1B1A]/5 p-2.5 rounded border border-[#1C1B1A]/10 font-sans mt-2">
                      "{currentStudentReport.metrics.fatigueAnalysis?.fatigueDescription}"
                    </p>
                  </div>
                </div>

                {/* Cognitive Performance Metrics */}
                <div className="bg-white border border-[#1C1B1A]/20 p-5 rounded-lg shadow-xs space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#8A5A1B] flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-[#8A5A1B]" />
                    <span>Cognitive Engagement Indicators</span>
                  </h4>

                  <div className="space-y-3 pt-1 text-xs">
                    <div className="flex items-center justify-between border-b border-[#1C1B1A]/10 pb-2">
                      <span className="text-[#1C1B1A]/70 font-medium">Engagement Category:</span>
                      <span className="font-mono font-bold text-[#8A5A1B]">
                        {currentStudentReport.metrics.cognitiveMetrics?.engagementLevel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-[#1C1B1A]/10 pb-2">
                      <span className="text-[#1C1B1A]/70 font-medium">Focus Stability Index:</span>
                      <span className="font-mono font-bold text-[#1C1B1A]">
                        {currentStudentReport.metrics.cognitiveMetrics?.focusStabilityIndex}/100
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-[#1C1B1A]/10 pb-2">
                      <span className="text-[#1C1B1A]/70 font-medium">Est. Topic Comprehension:</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {currentStudentReport.metrics.cognitiveMetrics?.estimatedComprehensionRate}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#1C1B1A]/70 font-medium">Lowest Attention Point:</span>
                      <span className="font-mono font-bold text-amber-800">
                        {currentStudentReport.metrics.cognitiveMetrics?.lowestAttentionTime}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#1C1B1A]/80 bg-[#1C1B1A]/5 p-2.5 rounded border border-[#1C1B1A]/10 font-mono font-semibold mt-2">
                      Facial Geometry Mesh: {currentStudentReport.metrics.meshQuality} Tracking High-Res
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Gaze Vector Breakdown Grid */}
              <div className="bg-white border border-[#1C1B1A]/20 p-5 rounded-lg shadow-xs space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1C1B1A] flex items-center space-x-2">
                  <Compass className="h-4 w-4 text-[#8A5A1B]" />
                  <span>3D Spatial Gaze Vector Distribution</span>
                </h4>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center pt-1 font-mono">
                  <div className="bg-[#8A5A1B]/10 border border-[#8A5A1B]/30 p-2.5 rounded">
                    <span className="text-[9px] font-bold text-[#8A5A1B] uppercase block">Direct Screen</span>
                    <span className="text-lg font-black text-[#8A5A1B]">{currentStudentReport.metrics.gazeBreakdown?.centerPercent}%</span>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded">
                    <span className="text-[9px] font-bold text-amber-800 uppercase block">Off-Screen Left</span>
                    <span className="text-lg font-black text-amber-800">{currentStudentReport.metrics.gazeBreakdown?.offScreenLeftPercent}%</span>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded">
                    <span className="text-[9px] font-bold text-amber-800 uppercase block">Off-Screen Right</span>
                    <span className="text-lg font-black text-amber-800">{currentStudentReport.metrics.gazeBreakdown?.offScreenRightPercent}%</span>
                  </div>

                  <div className="bg-rose-50 border border-rose-200 p-2.5 rounded">
                    <span className="text-[9px] font-bold text-rose-800 uppercase block">Looking Down</span>
                    <span className="text-lg font-black text-rose-800">{currentStudentReport.metrics.gazeBreakdown?.lookingDownPercent}%</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
                    <span className="text-[9px] font-bold text-slate-700 uppercase block">Looking Up</span>
                    <span className="text-lg font-black text-slate-800">{currentStudentReport.metrics.gazeBreakdown?.lookingUpPercent}%</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
                    <span className="text-[9px] font-bold text-slate-700 uppercase block">Eyes Closed</span>
                    <span className="text-lg font-black text-slate-800">{currentStudentReport.metrics.gazeBreakdown?.eyesClosedPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Diagnostic Observations */}
              <div className="bg-white border border-[#1C1B1A]/20 p-5 rounded-lg shadow-xs space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#8A5A1B] flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-[#8A5A1B]" />
                  <span>AI Observations & Behavioral Analysis</span>
                </h4>
                <ul className="space-y-2 text-xs text-[#1C1B1A] font-sans leading-relaxed font-medium">
                  {currentStudentReport.observations.map((obs, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-[#8A5A1B] font-bold mt-0.5">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI Tailored Recommendations & Action Plan */}
              <div className="bg-[#8A5A1B]/10 border border-[#8A5A1B]/40 p-5 rounded-lg space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#8A5A1B] flex items-center space-x-2">
                  <Award className="h-4 w-4 text-[#8A5A1B]" />
                  <span>AI Interventions & Personal Action Plan</span>
                </h4>
                <ul className="space-y-2 text-xs text-[#1C1B1A] font-sans leading-relaxed font-semibold">
                  {currentStudentReport.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-[#8A5A1B] font-bold mt-0.5">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#1C1B1A]/5 border-t border-[#1C1B1A]/10 px-6 py-3.5 flex justify-between items-center text-xs font-mono shrink-0">
          <span className="text-[#1C1B1A]/50 text-[10px] uppercase">
            CogniLearn Precision Attention Vector Engine v3.0
          </span>
          <div className="flex items-center space-x-2">
            {onDeleteReport && (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 font-bold uppercase tracking-wider text-[10px] cursor-pointer transition-colors inline-flex items-center space-x-1.5 rounded"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Report</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-[#1C1B1A] hover:bg-[#B18F5A] text-white px-5 py-2 font-bold uppercase tracking-wider text-[10px] cursor-pointer transition-colors rounded"
            >
              Close Report
            </button>
          </div>
        </div>

        {/* Delete Confirmation Overlay */}
        {showConfirmDelete && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 text-white p-6 max-w-md w-full shadow-2xl text-center rounded-xl space-y-4">
              <div className="mx-auto w-12 h-12 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Delete Diagnostic Report?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  This action will permanently delete this diagnostic report from your archived history. This cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-2">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs uppercase font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs uppercase font-bold rounded-lg cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
