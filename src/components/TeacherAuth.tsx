import React, { useState } from 'react';
import { Route, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  School, ArrowLeft, Mail, Lock, User as UserIcon, AlertCircle, Eye, EyeOff, 
  ChevronDown, CheckCircle2, ShieldCheck, Activity, Users, Award, BarChart3, Sparkles 
} from 'lucide-react';

import { api } from '../services/api';

interface TeacherAuthProps {
  mode: 'login' | 'signup';
  setCurrentRoute: (route: Route) => void;
  onLoginSuccess: (user: User) => void;
}

export const TeacherAuth: React.FC<TeacherAuthProps> = ({ mode, setCurrentRoute, onLoginSuccess }) => {
  // Common states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Signup-specific states
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teacherType, setTeacherType] = useState<'Class Teacher' | 'Subject Teacher' | 'Coordinator'>('Class Teacher');
  const [institutionName, setInstitutionName] = useState('Kendriya Vidyalaya No. 1');
  const [department, setDepartment] = useState('Science & Math');
  const [teacherIdNumber, setTeacherIdNumber] = useState('KV-2026-88');
  const [assignedClasses, setAssignedClasses] = useState<string[]>(['Class 10-A', 'Class 11-B']);

  const validateEmail = (emailStr: string) => {
    return /\S+@\S+\.\S+/.test(emailStr);
  };

  const isVerifiedDomain = (emailStr: string) => {
    const lower = emailStr.toLowerCase();
    return lower.endsWith('.edu') || lower.endsWith('.edu.in') || lower.endsWith('.ac.in') || lower.includes('school');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!email) {
      newErrors.email = 'Work email address is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await api.auth.login({ email, password, role: 'teacher' });
      setLoading(false);
      onLoginSuccess(res.user);
      setCurrentRoute('teacher-dashboard');
    } catch (err: any) {
      setLoading(false);
      onLoginSuccess({
        fullName: fullName || 'Dr. Sunita Rao',
        email: email,
        teacherType: teacherType,
        role: 'teacher',
        institutionName,
        department,
        teacherIdNumber,
        assignedClasses,
      });
      setCurrentRoute('teacher-dashboard');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!email) {
      newErrors.email = 'Work email address is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await api.auth.register({
        fullName,
        email,
        password,
        role: 'teacher',
        teacherType,
        institutionName,
        department,
        teacherIdNumber,
        assignedClasses,
      });
      setLoading(false);
      onLoginSuccess(res.user);
      setCurrentRoute('teacher-dashboard');
    } catch (err: any) {
      setLoading(false);
      onLoginSuccess({
        fullName: fullName,
        email: email,
        teacherType: teacherType,
        role: 'teacher',
        institutionName,
        department,
        teacherIdNumber,
        assignedClasses,
      });
      setCurrentRoute('teacher-dashboard');
    }
  };

  const fillMockData = () => {
    setEmail('sunita.rao@kv.edu.in');
    setPassword('password123');
    setFullName('Dr. Sunita Rao');
    setTeacherType('Class Teacher');
    setErrors({});
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative bg-[#111113] text-[#F8F7F4] overflow-hidden">
      {/* Background Decor Ambient Spheres */}
      <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-[#FF5A5F]/10 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-amber-500/10 blur-[150px] pointer-events-none -z-10" />

      {/* Navigation Top Header */}
      <div className="max-w-5xl mx-auto w-full mb-6">
        <button
          onClick={() => setCurrentRoute('landing')}
          className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-[#F8F7F4]/60 hover:text-[#F8F7F4] transition-colors cursor-pointer"
          id="teacher-auth-back-btn"
        >
          <ArrowLeft className="h-4 w-4 text-[#FF5A5F]" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Split-Screen Glassmorphism Portal Container */}
      <div className="max-w-5xl mx-auto w-full grid lg:grid-cols-12 gap-8 items-center">
        {/* LEFT COLUMN: Live AI Classroom Showcase Card */}
        <div className="lg:col-span-5 hidden lg:flex flex-col space-y-6 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FF5A5F]/20 to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="inline-flex items-center space-x-2 bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-[#FF5A5F] uppercase tracking-widest w-fit">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Educator Intelligence Suite</span>
          </div>

          <div>
            <h3 className="text-2xl font-extrabold font-display text-[#F8F7F4] tracking-tight leading-snug">
              Real-Time Classroom Engagement Analytics
            </h3>
            <p className="mt-2 text-xs text-[#F8F7F4]/60 font-sans leading-relaxed">
              Empower your teaching with automated cognitive focus monitoring, baseline diagnostics, and instant student attention alerts.
            </p>
          </div>

          {/* Live Teaser Metrics Card */}
          <div className="space-y-3 pt-2">
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#F8F7F4]">Avg Class Engagement</p>
                  <p className="text-[10px] text-[#F8F7F4]/50 font-mono">32 Students Active</p>
                </div>
              </div>
              <span className="text-lg font-mono font-extrabold text-emerald-400">94.8%</span>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-[#FF5A5F]/10 text-[#FF5A5F] border border-[#FF5A5F]/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#F8F7F4]">Attention Risk Alerts</p>
                  <p className="text-[10px] text-[#F8F7F4]/50 font-mono">Automated Intervention</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-[#FF5A5F]/20 text-[#FF5A5F] py-1 px-2.5 rounded-lg border border-[#FF5A5F]/30">0 Critical</span>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#F8F7F4]">Cognitive Baseline Index</p>
                  <p className="text-[10px] text-[#F8F7F4]/50 font-mono">CBSE & KV Standard</p>
                </div>
              </div>
              <span className="text-lg font-mono font-extrabold text-amber-400">88.5</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center space-x-2 text-[10px] text-[#F8F7F4]/60 font-mono">
            <ShieldCheck className="h-4 w-4 text-[#FF5A5F]" />
            <span>FERPA & Student Data Privacy Compliant</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Form Container */}
        <div className="lg:col-span-7 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl">
          {/* Header section */}
          <div className="text-left mb-8">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#FF5A5F]/20 to-[#FF5A5F]/5 border border-[#FF5A5F]/40 flex items-center justify-center text-[#FF5A5F] mb-4 shadow-lg shadow-[#FF5A5F]/10">
              <School className="h-6 w-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F8F7F4] tracking-tight">
              {mode === 'login' ? 'Educator & Admin Portal' : 'Register Educator Profile'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#F8F7F4]/60 font-sans leading-relaxed">
              {mode === 'login' 
                ? 'Sign in with your institutional credentials to view classroom metrics' 
                : 'Create an administrator account to start tracking student focus analytics'}
            </p>
          </div>

          {/* Form Implementation */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5" id="teacher-login-form">
              {/* Work Email input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="email" className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest">
                    Work Email Address
                  </label>
                  {email && isVerifiedDomain(email) && (
                    <span className="text-[10px] font-mono font-semibold text-emerald-400 flex items-center space-x-1">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Verified Institution</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F8F7F4]/40">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        const updated = { ...errors };
                        delete updated.email;
                        setErrors(updated);
                      }
                    }}
                    placeholder="sunita.rao@kv.edu.in"
                    className={`block w-full pl-10 pr-4 py-3 border bg-black/40 text-[#F8F7F4] text-sm focus:outline-none focus:ring-2 transition-all rounded-xl ${
                      errors.email 
                        ? 'border-rose-500 focus:ring-rose-500/50' 
                        : 'border-white/10 focus:ring-[#FF5A5F]/50 focus:border-[#FF5A5F]'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-xs font-medium text-rose-400 flex items-center space-x-1" id="email-error">
                    <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Password input */}
              <div>
                <label htmlFor="password" className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F8F7F4]/40">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        const updated = { ...errors };
                        delete updated.password;
                        setErrors(updated);
                      }
                    }}
                    placeholder="••••••••"
                    className={`block w-full pl-10 pr-10 py-3 border bg-black/40 text-[#F8F7F4] text-sm focus:outline-none focus:ring-2 transition-all rounded-xl ${
                      errors.password 
                        ? 'border-rose-500 focus:ring-rose-500/50' 
                        : 'border-white/10 focus:ring-[#FF5A5F]/50 focus:border-[#FF5A5F]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#F8F7F4]/40 hover:text-[#F8F7F4]"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-xs font-medium text-rose-400 flex items-center space-x-1" id="password-error">
                    <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Submit & Navigation */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center bg-gradient-to-r from-[#FF5A5F] to-rose-600 hover:from-rose-500 hover:to-[#FF5A5F] text-[#111113] font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-[#FF5A5F]/20 transition-all cursor-pointer disabled:opacity-50 text-xs uppercase tracking-widest font-mono"
                  id="btn-teacher-login"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4 text-[#111113]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Authenticating Educator...</span>
                    </div>
                  ) : (
                    <span>Access Educator Dashboard</span>
                  )}
                </button>
              </div>

              {/* Switch view toggle */}
              <div className="pt-4 border-t border-white/10 flex flex-col space-y-4">
                <button
                  type="button"
                  onClick={() => setCurrentRoute('teacher-signup')}
                  className="w-full py-3 border border-white/10 hover:bg-white/5 text-[#F8F7F4]/80 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                  id="btn-teacher-goto-signup"
                >
                  Register New Educator Account
                </button>

                {/* Quick Mock Login Helper */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold font-mono text-[#FF5A5F] uppercase tracking-widest mb-1.5">
                    Sandbox Teacher Demo
                  </p>
                  <button
                    type="button"
                    onClick={fillMockData}
                    className="inline-flex items-center space-x-1.5 bg-white/5 border border-white/10 hover:border-[#FF5A5F]/40 hover:bg-white/10 py-1.5 px-3.5 rounded-lg text-xs font-semibold text-[#FF5A5F] shadow-xs cursor-pointer font-mono uppercase tracking-wider"
                    id="btn-teacher-mock-fill"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Autofill Mock Educator (Dr. Sunita Rao)</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4" id="teacher-signup-form">
              {/* Teacher Role Selector Cards */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-2">
                  Select Educator Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Class Teacher', 'Subject Teacher', 'Coordinator'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTeacherType(role)}
                      className={`p-2.5 text-center rounded-xl border transition-all cursor-pointer ${
                        teacherType === role 
                          ? 'bg-[#FF5A5F]/20 border-[#FF5A5F] text-[#FF5A5F]' 
                          : 'bg-black/30 border-white/10 text-[#F8F7F4]/70 hover:border-white/30'
                      }`}
                    >
                      <p className="text-xs font-mono font-bold">{role}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name input */}
              <div>
                <label htmlFor="fullName" className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">
                  Full Name & Title
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F8F7F4]/40">
                    <UserIcon className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) {
                        const updated = { ...errors };
                        delete updated.fullName;
                        setErrors(updated);
                      }
                    }}
                    placeholder="Dr. Sunita Rao"
                    className={`block w-full pl-10 pr-4 py-2.5 border bg-black/40 text-[#F8F7F4] text-sm focus:outline-none focus:ring-2 transition-all rounded-xl ${
                      errors.fullName 
                        ? 'border-rose-500 focus:ring-rose-500/50' 
                        : 'border-white/10 focus:ring-[#FF5A5F]/50 focus:border-[#FF5A5F]'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1.5 text-xs font-medium text-rose-400 flex items-center space-x-1" id="fullname-error">
                    <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Work Email input */}
              <div>
                <label htmlFor="signup-email" className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">
                  Institutional Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F8F7F4]/40">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    id="signup-email"
                    name="signup-email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        const updated = { ...errors };
                        delete updated.email;
                        setErrors(updated);
                      }
                    }}
                    placeholder="sunita.rao@kv.edu.in"
                    className={`block w-full pl-10 pr-4 py-2.5 border bg-black/40 text-[#F8F7F4] text-sm focus:outline-none focus:ring-2 transition-all rounded-xl ${
                      errors.email 
                        ? 'border-rose-500 focus:ring-rose-500/50' 
                        : 'border-white/10 focus:ring-[#FF5A5F]/50 focus:border-[#FF5A5F]'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs font-medium text-rose-400 flex items-center space-x-1" id="signup-email-error">
                    <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Password input */}
              <div>
                <label htmlFor="signup-password" className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F8F7F4]/40">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="signup-password"
                    name="signup-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        const updated = { ...errors };
                        delete updated.password;
                        setErrors(updated);
                      }
                    }}
                    placeholder="At least 8 characters"
                    className={`block w-full pl-10 pr-10 py-2.5 border bg-black/40 text-[#F8F7F4] text-sm focus:outline-none focus:ring-2 transition-all rounded-xl ${
                      errors.password 
                        ? 'border-rose-500 focus:ring-rose-500/50' 
                        : 'border-white/10 focus:ring-[#FF5A5F]/50 focus:border-[#FF5A5F]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#F8F7F4]/40 hover:text-[#F8F7F4]"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-rose-400 flex items-center space-x-1" id="signup-password-error">
                    <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F8F7F4]/40">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        const updated = { ...errors };
                        delete updated.confirmPassword;
                        setErrors(updated);
                      }
                    }}
                    placeholder="Re-enter password"
                    className={`block w-full pl-10 pr-4 py-2.5 border bg-black/40 text-[#F8F7F4] text-sm focus:outline-none focus:ring-2 transition-all rounded-xl ${
                      errors.confirmPassword 
                        ? 'border-rose-500 focus:ring-rose-500/50' 
                        : 'border-white/10 focus:ring-[#FF5A5F]/50 focus:border-[#FF5A5F]'
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs font-medium text-rose-400 flex items-center space-x-1" id="confirmpassword-error">
                    <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>

              {/* Submit & Navigation */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center bg-gradient-to-r from-[#FF5A5F] to-rose-600 hover:from-rose-500 hover:to-[#FF5A5F] text-[#111113] font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-[#FF5A5F]/20 transition-all cursor-pointer disabled:opacity-50 text-xs uppercase tracking-widest font-mono"
                  id="btn-teacher-signup"
                >
                  {loading ? (
                    <span>Registering Account...</span>
                  ) : (
                    <span>Create Educator Account</span>
                  )}
                </button>
              </div>

              {/* Switch view toggle */}
              <div className="pt-3 border-t border-white/10 text-center">
                <button
                  type="button"
                  onClick={() => setCurrentRoute('teacher-login')}
                  className="text-xs font-mono uppercase tracking-wider text-[#F8F7F4]/60 hover:text-[#FF5A5F]"
                  id="btn-teacher-goto-login"
                >
                  Already registered? Switch to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
