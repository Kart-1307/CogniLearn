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

  // Clear credentials on mode change or mount
  React.useEffect(() => {
    setEmail('');
    setPassword('');
    setFullName('');
    setErrors({});
  }, [mode]);

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
      setErrors({ submit: err.message || 'Invalid email or password' });
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
      setErrors({ submit: err.message || 'Registration failed' });
    }
  };

  const fillMockData = () => {
    setEmail('teacher@cognilearn.com');
    setPassword('password123');
    setFullName('Dr. Ramesh Kumar (Demo)');
    setTeacherType('Subject Teacher');
    setErrors({});
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setErrors({});
    try {
      const res = await api.auth.login({ email: 'teacher@cognilearn.com', password: 'password123', role: 'teacher' });
      setLoading(false);
      onLoginSuccess({
        ...res.user,
        isDemo: true,
      });
      setCurrentRoute('teacher-dashboard');
    } catch {
      setLoading(false);
      onLoginSuccess({
        id: 'mem-user-teacher-1',
        fullName: 'Dr. Ramesh Kumar (Demo)',
        email: 'teacher@cognilearn.com',
        role: 'teacher',
        teacherType: 'Subject Teacher',
        isDemo: true,
        institutionName: 'Delhi Public School',
        assignedClasses: ['Class 11-A', 'Class 11-B', 'Class 12-A'],
      });
      setCurrentRoute('teacher-dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative bg-[#0B0F17] text-slate-100 font-sans overflow-hidden">
      {/* Background Grid & Ambient Glow */}
      <div className="grid-bg" />
      <div className="glow-effect" />

      {/* Navigation Top Header */}
      <div className="max-w-5xl mx-auto w-full mb-6 relative z-10">
        <button
          onClick={() => setCurrentRoute('landing')}
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer group"
          id="teacher-auth-back-btn"
        >
          <ArrowLeft className="h-4 w-4 text-indigo-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Split-Screen Portal Container */}
      <div className="max-w-5xl mx-auto w-full grid lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* LEFT COLUMN: Live AI Classroom Showcase Card */}
        <div className="lg:col-span-5 hidden lg:flex flex-col space-y-6 saas-card p-8 rounded-xl border border-slate-800 shadow-2xl relative text-slate-100">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-md text-xs font-medium text-indigo-300 w-fit backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>AI Educator Intelligence Suite</span>
          </div>

          <div>
            <h3 className="text-2xl font-heading font-extrabold text-white leading-snug">
              Real-Time Classroom Engagement Analytics
            </h3>
            <p className="mt-2 text-xs text-slate-300 font-normal leading-relaxed">
              Empower your teaching with automated cognitive focus monitoring, baseline diagnostics, and instant student attention alerts.
            </p>
          </div>

          {/* Live Teaser Metrics Card */}
          <div className="space-y-3 pt-2">
            <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Avg Class Engagement</p>
                  <p className="text-[11px] text-slate-400 font-mono">32 Students Active</p>
                </div>
              </div>
              <span className="text-lg font-mono font-bold text-emerald-400">94.8%</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Attention Risk Alerts</p>
                  <p className="text-[11px] text-slate-400 font-mono">Automated Intervention</p>
                </div>
              </div>
              <span className="text-xs font-mono font-medium bg-emerald-500/10 text-emerald-300 py-1 px-2.5 rounded border border-emerald-500/20">0 Critical</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Cognitive Baseline Index</p>
                  <p className="text-[11px] text-slate-400 font-mono">CBSE & KV Standard</p>
                </div>
              </div>
              <span className="text-lg font-mono font-bold text-indigo-400">88.5</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center space-x-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>FERPA & Student Data Privacy Compliant</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Form Container */}
        <div className="lg:col-span-7 saas-card p-6 sm:p-10 rounded-xl border border-slate-800 shadow-2xl text-slate-100">
          {/* Header section */}
          <div className="text-left mb-8">
            <div className="h-12 w-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-sm">
              <School className="h-6 w-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-white">
              {mode === 'login' ? 'Educator & Admin Portal' : 'Register Educator Profile'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              {mode === 'login'
                ? 'Sign in with your institutional credentials to view real-time classroom focus analytics'
                : 'Create an administrator account to start tracking student focus analytics'}
            </p>
          </div>

          {/* Form Implementation */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5" id="teacher-login-form" autoComplete="off">
              {errors.submit && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-medium flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{errors.submit}</span>
                </div>
              )}
              {/* Work Email input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-200">
                    Work Email Address
                  </label>
                  {email && isVerifiedDomain(email) && (
                    <span className="text-xs font-medium text-emerald-400 flex items-center space-x-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Verified Institution</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        const updated = { ...errors };
                        delete updated.email;
                        setErrors(updated);
                      }
                    }}
                    placeholder="teacher@school.edu"
                    className={`block w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm focus:outline-none transition-all placeholder:text-slate-500 ${errors.email
                        ? 'border border-rose-500'
                        : 'border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-xs font-medium text-rose-400 flex items-center space-x-1" id="email-error">
                    <AlertCircle className="h-3 w-3 shrink-0 text-rose-400" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Password input */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    autoComplete="new-password"
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
                    className={`block w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm focus:outline-none transition-all placeholder:text-slate-500 ${errors.password
                        ? 'border border-rose-500'
                        : 'border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-xs font-medium text-rose-400 flex items-center space-x-1" id="password-error">
                    <AlertCircle className="h-3 w-3 shrink-0 text-rose-400" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Submit & Navigation */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/35 cursor-pointer disabled:opacity-50 text-sm"
                  id="btn-teacher-login"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
              <div className="pt-4 border-t border-slate-800 flex flex-col space-y-4">
                <button
                  type="button"
                  onClick={() => setCurrentRoute('teacher-signup')}
                  className="w-full py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer text-center"
                  id="btn-teacher-goto-signup"
                >
                  Register New Educator Account
                </button>

                {/* Quick Mock Login Helper */}
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg text-center space-y-2.5">
                  <p className="text-xs font-semibold text-indigo-300">
                    Sandbox Educator Demo (With Sample Records)
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleQuickDemoLogin}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 py-1.5 px-3.5 rounded-md text-xs font-semibold cursor-pointer transition-colors"
                      id="btn-teacher-instant-demo"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Instant Demo Login</span>
                    </button>
                    <button
                      type="button"
                      onClick={fillMockData}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 py-1.5 px-3.5 rounded-md text-xs font-medium cursor-pointer transition-colors"
                      id="btn-teacher-mock-fill"
                    >
                      <span>Autofill Form</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Demo login retains sample datasets. Newly created accounts start clean with 0 records.
                  </p>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4" id="teacher-signup-form">
              {/* Teacher Role Selector Cards */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  Select Educator Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Class Teacher', 'Subject Teacher', 'Coordinator'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTeacherType(role)}
                      className={`p-2.5 rounded-lg text-center border transition-all cursor-pointer ${teacherType === role
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                    >
                      <p className="text-xs font-medium">{role}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name input */}
              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Full Name & Title
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    autoComplete="off"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) {
                        const updated = { ...errors };
                        delete updated.fullName;
                        setErrors(updated);
                      }
                    }}
                    placeholder="Enter full name"
                    className={`block w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm focus:outline-none transition-all placeholder:text-slate-500 ${errors.fullName
                        ? 'border border-rose-500'
                        : 'border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1.5 text-xs font-medium text-rose-400 flex items-center space-x-1" id="fullname-error">
                    <AlertCircle className="h-3 w-3 shrink-0 text-rose-400" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Work Email input */}
              <div>
                <label htmlFor="signup-email" className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Institutional Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    id="signup-email"
                    name="signup-email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        const updated = { ...errors };
                        delete updated.email;
                        setErrors(updated);
                      }
                    }}
                    placeholder="teacher@school.edu"
                    className={`block w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm focus:outline-none transition-all placeholder:text-slate-500 ${errors.email
                        ? 'border border-rose-500'
                        : 'border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs font-medium text-rose-400 flex items-center space-x-1" id="signup-email-error">
                    <AlertCircle className="h-3 w-3 shrink-0 text-rose-400" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Password input */}
              <div>
                <label htmlFor="signup-password" className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
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
                    className={`block w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm focus:outline-none transition-all placeholder:text-slate-500 ${errors.password
                        ? 'border border-rose-500'
                        : 'border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-rose-400 flex items-center space-x-1" id="signup-password-error">
                    <AlertCircle className="h-3 w-3 shrink-0 text-rose-400" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
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
                    className={`block w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm focus:outline-none transition-all placeholder:text-slate-500 ${errors.confirmPassword
                        ? 'border border-rose-500'
                        : 'border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs font-medium text-rose-400 flex items-center space-x-1" id="confirmpassword-error">
                    <AlertCircle className="h-3 w-3 shrink-0 text-rose-400" />
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>

              {/* Submit & Navigation */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/35 cursor-pointer disabled:opacity-50 text-sm"
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
              <div className="pt-3 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => setCurrentRoute('teacher-login')}
                  className="text-xs font-medium text-slate-400 hover:text-indigo-300 transition-colors"
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
