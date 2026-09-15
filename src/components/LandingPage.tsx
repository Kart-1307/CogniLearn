import React from 'react';
import { Route } from '../types';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ShieldCheck,
  Eye,
  Zap,
  School,
  UserCheck,
  Brain,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface LandingPageProps {
  setCurrentRoute: (route: Route) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setCurrentRoute }) => {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] bg-bg-base text-slate-100 overflow-hidden font-sans">
      {/* Subtle SaaS Grid & Background Glow */}
      <div className="grid-bg" />
      <div className="glow-effect" />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pt-12 lg:pb-24">
        {/* Top Announcement Pill */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Next-Gen Edge Neural Telemetry for Schools</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 font-mono">v2.4 Released</span>
          </motion.div>
        </div>

        {/* Hero Section (Centered Layout) */}
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Real-time focus intelligence for modern classrooms.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
              CogniLearn transforms student concentration into actionable cognitive telemetry. Track gaze vectors, fatigue indicators, and attention trends in real time — with complete academic privacy.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setCurrentRoute('teacher-login')}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/35 cursor-pointer group"
                id="btn-classroom-continue"
              >
                <School className="w-4 h-4 text-indigo-200" />
                <span>Classroom Mode</span>
                <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setCurrentRoute('student-login')}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white text-sm font-semibold transition-all duration-200 cursor-pointer backdrop-blur-sm"
                id="btn-individual-continue"
              >
                <UserCheck className="w-4 h-4 text-sky-400" />
                <span>Individual Focus</span>
              </button>
            </div>

            {/* Quick Trust Signals */}
            <div className="pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-8 text-slate-400 text-xs font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>FERPA & COPPA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>&lt; 10ms Edge Inference</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Zero Cloud Video Logs</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enterprise SaaS Metrics Row */}
        <section className="mt-20 pt-12 border-t border-slate-800/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-white font-mono">99.4%</div>
              <div className="text-xs text-slate-400 font-medium">Gaze Tracking Accuracy</div>
              <p className="text-[11px] text-slate-500">Multi-point landmark geometry</p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-indigo-400 font-mono">&lt; 10ms</div>
              <div className="text-xs text-slate-400 font-medium">On-Device Inference</div>
              <p className="text-[11px] text-slate-500">Zero latency lag on edge neural models</p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-sky-400 font-mono">100%</div>
              <div className="text-xs text-slate-400 font-medium">FERPA & Privacy Compliant</div>
              <p className="text-[11px] text-slate-500">Video processed solely in RAM</p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">24/7</div>
              <div className="text-xs text-slate-400 font-medium">Automated Diagnostics</div>
              <p className="text-[11px] text-slate-500">Instant PDF & dashboard reports</p>
            </div>
          </div>
        </section>

        {/* Asymmetric Product Feature Suite */}
        <section className="mt-24 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white">
              Purpose-built for educators and independent learners
            </h2>
            <p className="text-sm text-slate-400">
              CogniLearn bridges raw computer vision telemetry with structured academic outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Teacher Suite Card */}
            <div className="saas-card saas-card-hover p-8 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <School className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white">
                  Teacher & District Portal
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Monitor live classroom engagement without intrusive cameras. View aggregate focus heatmaps, receive fatigue alerts, and auto-generate student progress reports.
                </p>
                <ul className="space-y-2.5 pt-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Real-time classroom grid telemetry & attention index</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Automated cognitive fatigue & distraction warnings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Exportable diagnostic reports for parents & administration</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800">
                <button
                  onClick={() => setCurrentRoute('teacher-login')}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer group"
                >
                  <span>Launch Teacher Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Student Suite Card */}
            <div className="saas-card saas-card-hover p-8 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white">
                  Individual Student Focus
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Personal cognitive assistant that tracks your study streaks, provides off-screen distraction alerts, and suggests timely focus breaks to maximize retention.
                </p>
                <ul className="space-y-2.5 pt-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Local facial landmark computer vision tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Smart break reminders & cognitive reset exercises</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Subject-wise focus statistics & hourly breakdown</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800">
                <button
                  onClick={() => setCurrentRoute('student-login')}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer group"
                >
                  <span>Launch Student Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Enterprise SaaS Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#070A10] py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-brand font-bold text-white text-sm">CogniLearn</span>
            <span className="text-slate-600">|</span>
            <span>Enterprise Cognitive Intelligence Platform</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400">
            <span className="hover:text-slate-300 transition-colors">Edge Telemetry</span>
            <span className="hover:text-slate-300 transition-colors">Academic Privacy</span>
            <span className="hover:text-slate-300 transition-colors">FERPA Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
};



