import React from 'react';
import { Route } from '../types';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  setCurrentRoute: (route: Route) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setCurrentRoute }) => {
  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex flex-col justify-between py-12 px-6 sm:px-12 md:px-16 bg-[#111113] text-[#F8F7F4]">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#FF5A5F]/5 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto w-full text-center flex-1 flex flex-col justify-center my-auto">
        {/* Logo and Big Title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <h1 className="font-display font-extrabold text-6xl sm:text-7xl md:text-8xl tracking-tight text-[#F8F7F4] leading-[0.85] select-none">
            Cogni<span className="text-[#FF5A5F]">Learn</span>
          </h1>
          <p className="font-display text-sm sm:text-base md:text-lg text-[#F8F7F4]/60 tracking-wide font-light max-w-xl mx-auto">
            Next Generation Student Focus Improvement System
          </p>
        </motion.div>

        {/* Swiss Two-column Grid */}
        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto w-full">
          {/* Classroom Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="border-2 border-white/10 hover:border-[#FF5A5F] p-8 sm:p-10 text-left transition-all duration-300 flex flex-col justify-between bg-black/20"
            id="classroom-card"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#F8F7F4] tracking-tight">
                Classroom
              </h2>
              <p className="mt-4 text-sm text-[#F8F7F4]/70 leading-relaxed font-sans">
                Manage students, classes, and subjects. Intended for teachers, coordinators, and school staff.
              </p>
            </div>
            <div className="mt-8">
              <button
                onClick={() => setCurrentRoute('teacher-login')}
                className="w-full bg-[#F8F7F4] text-[#111113] hover:bg-[#FF5A5F] hover:text-[#111113] font-bold text-xs uppercase tracking-widest py-4 px-6 transition-colors duration-300 cursor-pointer flex items-center justify-center space-x-2"
                id="btn-classroom-continue"
              >
                <span>CONTINUE SESSION</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>

          {/* Individual Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="border-2 border-white/10 hover:border-[#FF5A5F] p-8 sm:p-10 text-left transition-all duration-300 flex flex-col justify-between bg-black/20"
            id="individual-card"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#F8F7F4] tracking-tight">
                Individual
              </h2>
              <p className="mt-4 text-sm text-[#F8F7F4]/70 leading-relaxed font-sans">
                Track your personal learning journey. Optimized for measuring and enhancing concentration.
              </p>
            </div>
            <div className="mt-8">
              <button
                onClick={() => setCurrentRoute('student-login')}
                className="w-full bg-[#F8F7F4] text-[#111113] hover:bg-[#FF5A5F] hover:text-[#111113] font-bold text-xs uppercase tracking-widest py-4 px-6 transition-colors duration-300 cursor-pointer flex items-center justify-center space-x-2"
                id="btn-individual-continue"
              >
                <span>BEGIN TRACKING</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Swiss Style Minimal Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-12 pt-8 border-t border-white/10 max-w-4xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-4 text-[10px] sm:text-xs font-mono text-[#F8F7F4]/50 tracking-widest uppercase"
      >
        <div className="text-center sm:text-left">[01] REAL-TIME MODELING</div>
        <div className="text-center">[02] DASHBOARD SUITE</div>
        <div className="text-center sm:text-right">[03] ACADEMIC PRIVACY</div>
      </motion.div>
    </div>
  );
};
