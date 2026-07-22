import React, { useState } from 'react';
import { Route, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, ArrowLeft, Mail, Lock, AlertCircle, Eye, EyeOff, 
  CheckCircle2, Camera, FileText, Sparkles, ChevronRight, Award, Target, BookOpen, ShieldCheck
} from 'lucide-react';

import { api } from '../services/api';

interface StudentAuthProps {
  mode: 'login' | 'signup';
  setCurrentRoute: (route: Route) => void;
  onLoginSuccess: (user: User) => void;
}

export const StudentAuth: React.FC<StudentAuthProps> = ({ mode, setCurrentRoute, onLoginSuccess }) => {
  // Wizard step state (1: Credentials, 2: Photo Capture, 3: Academic Preferences)
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);

  // Common states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Signup-specific states
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Class 11');
  const [learningStyle, setLearningStyle] = useState<'Visual' | 'Auditory' | 'Kinesthetic' | 'Reading/Writing'>('Visual');
  const [curriculumTrack, setCurriculumTrack] = useState('CBSE');
  const [targetFocusSlot, setTargetFocusSlot] = useState('25'); // minutes
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics', 'Physics']);

  // Preset Avatars
  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
  ];

  // Photo Upload and Web Camera Capture state
  const [avatar, setAvatar] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const validateEmail = (emailStr: string) => {
    return /\S+@\S+\.\S+/.test(emailStr);
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-white/10' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1: return { score: 25, label: 'Weak', color: 'bg-rose-500' };
      case 2: return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3: return { score: 75, label: 'Good', color: 'bg-emerald-400' };
      case 4: return { score: 100, label: 'Strong', color: 'bg-[#FF5A5F]' };
      default: return { score: 15, label: 'Too Short', color: 'bg-rose-500' };
    }
  };

  const strength = getPasswordStrength(password);

  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access failed", err);
      alert("Could not access camera. Please upload an image file or choose a preset avatar.");
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 200, 200);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatar(dataUrl);
      }
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!email) {
      newErrors.email = 'Email address is required';
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
      const res = await api.auth.login({ email, password, role: 'student' });
      setLoading(false);
      onLoginSuccess(res.user);
      setCurrentRoute('student-dashboard');
    } catch (err: any) {
      setLoading(false);
      const lowerEmail = email.toLowerCase().trim();
      const resolvedName = lowerEmail.includes('karthik') ? 'Karthik Sharma' 
                           : lowerEmail.includes('pooja') ? 'Pooja Patel'
                           : lowerEmail.includes('aarav') ? 'Aarav Mehta'
                           : lowerEmail.includes('ananya') ? 'Ananya Iyer'
                           : fullName || 'Karthik Sharma';

      onLoginSuccess({
        fullName: resolvedName,
        email: email,
        role: 'student',
        avatar: avatar || undefined,
      });
      setCurrentRoute('student-dashboard');
    }
  };

  // Step 1 Next button handler
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!email) {
      newErrors.email = 'Email address is required';
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
    setSignupStep(2);
  };

  // Final Signup Submission (Step 3)
  const handleFinalSignup = async () => {
    setLoading(true);

    try {
      const res = await api.auth.register({
        fullName,
        email,
        password,
        role: 'student',
        avatar,
        gradeLevel,
        learningStyle,
        curriculumTrack,
        studySchedule: targetFocusSlot === '25' ? '25m Pomodoro' : targetFocusSlot === '45' ? '45m Deep Work' : '60m Sprint',
      });
      setLoading(false);
      onLoginSuccess(res.user);
      setCurrentRoute('student-dashboard');
    } catch (err: any) {
      setLoading(false);
      onLoginSuccess({
        fullName,
        email,
        role: 'student',
        avatar: avatar || undefined,
        gradeLevel,
        learningStyle,
        curriculumTrack,
      });
      setCurrentRoute('student-dashboard');
    }
  };

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const fillMockData = () => {
    setEmail('karthik.sharma@kv.edu.in');
    setPassword('password123');
    setFullName('Karthik Sharma');
    setConfirmPassword('password123');
    setErrors({});
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative bg-[#111113] text-[#F8F7F4] overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-[#FF5A5F]/10 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[140px] pointer-events-none -z-10" />

      {/* Back button */}
      <div className="max-w-xl mx-auto w-full mb-6">
        <button
          onClick={() => setCurrentRoute('landing')}
          className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-[#F8F7F4]/60 hover:text-[#F8F7F4] transition-colors cursor-pointer"
          id="student-auth-back-btn"
        >
          <ArrowLeft className="h-4 w-4 text-[#FF5A5F]" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="max-w-xl mx-auto w-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Header section */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#FF5A5F]/20 to-[#FF5A5F]/5 border border-[#FF5A5F]/40 flex items-center justify-center text-[#FF5A5F] mx-auto mb-4 shadow-lg shadow-[#FF5A5F]/10">
            <UserIcon className="h-7 w-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F8F7F4] tracking-tight">
            {mode === 'login' ? 'Student Login' : 'Student Onboarding'}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#F8F7F4]/60 font-sans leading-relaxed max-w-md mx-auto">
            {mode === 'login' 
              ? 'Resume your personalized AI focus sessions & analytics logs' 
              : 'Join CogniLearn to unlock automated cognitive focus tracking'}
          </p>
        </div>

        {/* Signup Multi-Step Wizard Indicator */}
        {mode === 'signup' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF5A5F]">
                Step {signupStep} of 3
              </span>
              <span className="text-xs font-medium text-[#F8F7F4]/70">
                {signupStep === 1 && 'Account Credentials'}
                {signupStep === 2 && 'AI Profile Avatar'}
                {signupStep === 3 && 'Academic Focus Goals'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-[#FF5A5F] to-rose-400 transition-all duration-500 rounded-full"
                style={{ width: `${(signupStep / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Form Implementation */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5" id="student-login-form">
            {/* Email input */}
            <div>
              <label htmlFor="student-email" className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-2">
                Student Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F8F7F4]/40">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  id="student-email"
                  name="student-email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      const updated = { ...errors };
                      delete updated.email;
                      setErrors(updated);
                    }
                  }}
                  placeholder="karthik.sharma@kv.edu.in"
                  className={`block w-full pl-10 pr-4 py-3 border bg-black/40 text-[#F8F7F4] text-sm focus:outline-none focus:ring-2 transition-all rounded-xl ${
                    errors.email 
                      ? 'border-rose-500 focus:ring-rose-500/50' 
                      : 'border-white/10 focus:ring-[#FF5A5F]/50 focus:border-[#FF5A5F]'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-xs font-medium text-rose-400 flex items-center space-x-1" id="student-email-error">
                  <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="student-password" className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F8F7F4]/40">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="student-password"
                  name="student-password"
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
                <p className="mt-2 text-xs font-medium text-rose-400 flex items-center space-x-1" id="student-password-error">
                  <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center bg-gradient-to-r from-[#FF5A5F] to-rose-600 hover:from-rose-500 hover:to-[#FF5A5F] text-[#111113] font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-[#FF5A5F]/20 transition-all cursor-pointer disabled:opacity-50 text-xs uppercase tracking-widest font-mono"
                id="btn-student-login"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-[#111113]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <span>Login to Student Portal</span>
                )}
              </button>
            </div>

            {/* Navigation & Sandbox autofill */}
            <div className="pt-4 border-t border-white/10 flex flex-col space-y-4">
              <button
                type="button"
                onClick={() => {
                  setCurrentRoute('student-signup');
                  setSignupStep(1);
                }}
                className="w-full py-3 border border-white/10 hover:bg-white/5 text-[#F8F7F4]/80 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                id="btn-student-goto-signup"
              >
                Don't have an account? Sign Up
              </button>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-[10px] font-bold font-mono text-[#FF5A5F] uppercase tracking-widest mb-1.5">
                  Sandbox Quick Demo
                </p>
                <button
                  type="button"
                  onClick={fillMockData}
                  className="inline-flex items-center space-x-1.5 bg-white/5 border border-white/10 hover:border-[#FF5A5F]/40 hover:bg-white/10 py-1.5 px-3.5 rounded-lg text-xs font-semibold text-[#FF5A5F] shadow-xs cursor-pointer font-mono uppercase tracking-wider"
                  id="btn-student-mock-fill"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Autofill Mock Student</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {/* STEP 1: CREDENTIALS */}
              {signupStep === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleStep1Next}
                  className="space-y-4"
                  id="student-signup-step1"
                >
                  {/* Full Name */}
                  <div>
                    <label htmlFor="student-fullName" className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F8F7F4]/40">
                        <UserIcon className="h-4.5 w-4.5" />
                      </span>
                      <input
                        type="text"
                        id="student-fullName"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (errors.fullName) {
                            const updated = { ...errors };
                            delete updated.fullName;
                            setErrors(updated);
                          }
                        }}
                        placeholder="Karthik Sharma"
                        className={`block w-full pl-10 pr-4 py-2.5 border bg-black/40 text-[#F8F7F4] text-sm focus:outline-none focus:ring-2 transition-all rounded-xl ${
                          errors.fullName ? 'border-rose-500 focus:ring-rose-500/50' : 'border-white/10 focus:ring-[#FF5A5F]/50 focus:border-[#FF5A5F]'
                        }`}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1 text-xs font-medium text-rose-400 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3 text-rose-500" />
                        <span>{errors.fullName}</span>
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="student-signup-email" className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">
                      Student Email
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F8F7F4]/40">
                        <Mail className="h-4.5 w-4.5" />
                      </span>
                      <input
                        type="text"
                        id="student-signup-email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) {
                            const updated = { ...errors };
                            delete updated.email;
                            setErrors(updated);
                          }
                        }}
                        placeholder="karthik.sharma@kv.edu.in"
                        className={`block w-full pl-10 pr-4 py-2.5 border bg-black/40 text-[#F8F7F4] text-sm focus:outline-none focus:ring-2 transition-all rounded-xl ${
                          errors.email ? 'border-rose-500 focus:ring-rose-500/50' : 'border-white/10 focus:ring-[#FF5A5F]/50 focus:border-[#FF5A5F]'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs font-medium text-rose-400 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3 text-rose-500" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Password & Strength Meter */}
                  <div>
                    <label htmlFor="student-signup-password" className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">
                      Create Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F8F7F4]/40">
                        <Lock className="h-4.5 w-4.5" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="student-signup-password"
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
                          errors.password ? 'border-rose-500 focus:ring-rose-500/50' : 'border-white/10 focus:ring-[#FF5A5F]/50 focus:border-[#FF5A5F]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#F8F7F4]/40 hover:text-[#F8F7F4]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Strength Indicator */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                          <span className="text-[#F8F7F4]/50">Password Strength</span>
                          <span className="font-bold text-[#F8F7F4]">{strength.label}</span>
                        </div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: `${strength.score}%` }} />
                        </div>
                      </div>
                    )}
                    {errors.password && (
                      <p className="mt-1 text-xs font-medium text-rose-400 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3 text-rose-500" />
                        <span>{errors.password}</span>
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="student-confirmPassword" className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#F8F7F4]/40">
                        <Lock className="h-4.5 w-4.5" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="student-confirmPassword"
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
                          errors.confirmPassword ? 'border-rose-500 focus:ring-rose-500/50' : 'border-white/10 focus:ring-[#FF5A5F]/50 focus:border-[#FF5A5F]'
                        }`}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs font-medium text-rose-400 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3 text-rose-500" />
                        <span>{errors.confirmPassword}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center space-x-2 bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-[#111113] font-bold py-3.5 px-4 rounded-xl shadow-lg transition-colors cursor-pointer text-xs uppercase tracking-widest font-mono"
                    >
                      <span>Continue to Profile Setup</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.form>
              )}

              {/* STEP 2: PROFILE PHOTO & CAMERA RETICLE */}
              {signupStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5 text-center"
                  id="student-signup-step2"
                >
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-xs font-mono uppercase tracking-wider text-[#FF5A5F] font-bold mb-1">
                      AI Facial Recognition Avatar Setup
                    </p>
                    <p className="text-xs text-[#F8F7F4]/60">
                      Upload a photo or capture via webcam for your personalized student profile.
                    </p>
                  </div>

                  {/* Avatar Display Box with AI reticle overlay */}
                  <div className="relative w-36 h-36 mx-auto rounded-full border-2 border-[#FF5A5F]/50 overflow-hidden bg-black/50 flex items-center justify-center shadow-xl group">
                    {cameraActive ? (
                      <div className="relative w-full h-full">
                        <video ref={videoRef} className="w-full h-full object-cover" />
                        {/* Animated AI Scanning Reticle */}
                        <div className="absolute inset-0 border-2 border-dashed border-[#FF5A5F]/70 rounded-full animate-spin pointer-events-none" style={{ animationDuration: '8s' }} />
                        <div className="absolute top-2 left-2 text-[9px] font-mono bg-[#FF5A5F] text-[#111113] font-bold px-1.5 py-0.5 rounded">
                          AI ACTIVE
                        </div>
                      </div>
                    ) : avatar ? (
                      <img src={avatar} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#F8F7F4]/40">
                        <UserIcon className="h-12 w-12 mb-1" />
                        <span className="text-[10px] font-mono">No Avatar</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {cameraActive ? (
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="inline-flex items-center space-x-1.5 bg-[#FF5A5F] text-[#111113] font-bold text-xs py-2 px-4 rounded-xl font-mono uppercase tracking-wider cursor-pointer"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Snap Photo</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="inline-flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-[#F8F7F4] font-semibold text-xs py-2 px-4 rounded-xl border border-white/10 transition-colors cursor-pointer"
                      >
                        <Camera className="h-4 w-4 text-[#FF5A5F]" />
                        <span>Open WebCam</span>
                      </button>
                    )}

                    <label className="inline-flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-[#F8F7F4] font-semibold text-xs py-2 px-4 rounded-xl border border-white/10 transition-colors cursor-pointer">
                      <FileText className="h-4 w-4 text-[#FF5A5F]" />
                      <span>Upload File</span>
                      <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                    </label>
                  </div>

                  {/* Preset Avatars */}
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F8F7F4]/60 mb-2.5">
                      Or Select Preset Avatar
                    </p>
                    <div className="flex justify-center space-x-3">
                      {presetAvatars.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(url)}
                          className={`w-10 h-10 rounded-full border-2 overflow-hidden transition-all cursor-pointer ${
                            avatar === url ? 'border-[#FF5A5F] scale-110' : 'border-white/20 hover:border-white/50'
                          }`}
                        >
                          <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Next Step buttons */}
                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSignupStep(1)}
                      className="text-xs font-mono uppercase tracking-wider text-[#F8F7F4]/60 hover:text-[#F8F7F4]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupStep(3)}
                      className="inline-flex items-center space-x-2 bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-[#111113] font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-wider font-mono cursor-pointer"
                    >
                      <span>Continue to Preferences</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: ACADEMIC FOCUS & GOALS */}
              {signupStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                  id="student-signup-step3"
                >
                  {/* Grade Level Selection */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-2">
                      Select Academic Level / Grade
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Class 9', 'Class 10', 'Class 11', 'Class 12', 'College'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setGradeLevel(lvl)}
                          className={`py-2 px-3 text-xs font-mono font-semibold rounded-xl border transition-all cursor-pointer ${
                            gradeLevel === lvl 
                              ? 'bg-[#FF5A5F]/20 border-[#FF5A5F] text-[#FF5A5F]' 
                              : 'bg-black/30 border-white/10 text-[#F8F7F4]/70 hover:border-white/30'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Focus Session Slot */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-2">
                      Target Daily Focus Slot
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { duration: '25', title: '25m Pomodoro' },
                        { duration: '45', title: '45m Deep Work' },
                        { duration: '60', title: '60m Sprint' },
                      ].map((slot) => (
                        <button
                          key={slot.duration}
                          type="button"
                          onClick={() => setTargetFocusSlot(slot.duration)}
                          className={`py-2.5 px-3 text-center rounded-xl border transition-all cursor-pointer ${
                            targetFocusSlot === slot.duration
                              ? 'bg-[#FF5A5F]/20 border-[#FF5A5F] text-[#FF5A5F]'
                              : 'bg-black/30 border-white/10 text-[#F8F7F4]/70 hover:border-white/30'
                          }`}
                        >
                          <p className="text-xs font-mono font-bold">{slot.title}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Subjects */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-2">
                      Primary Target Subjects
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'].map((sub) => {
                        const isSelected = selectedSubjects.includes(sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => toggleSubject(sub)}
                            className={`py-1.5 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white/15 border-white/40 text-[#F8F7F4]'
                                : 'bg-black/20 border-white/10 text-[#F8F7F4]/50 hover:border-white/20'
                            }`}
                          >
                            {isSelected ? `✓ ${sub}` : `+ ${sub}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Account Creation */}
                  <div className="pt-4 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setSignupStep(2)}
                      className="text-xs font-mono uppercase tracking-wider text-[#F8F7F4]/60 hover:text-[#F8F7F4]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleFinalSignup}
                      className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-[#FF5A5F] to-rose-600 hover:from-rose-500 hover:to-[#FF5A5F] text-[#111113] font-bold py-3.5 px-5 rounded-xl shadow-lg shadow-[#FF5A5F]/20 text-xs uppercase tracking-widest font-mono cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <span>Creating Account...</span>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-[#111113]" />
                          <span>Complete & Launch Portal</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Switch to Login */}
            <div className="pt-4 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={() => setCurrentRoute('student-login')}
                className="text-xs font-mono uppercase tracking-wider text-[#F8F7F4]/60 hover:text-[#FF5A5F]"
              >
                Already registered? Switch to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
