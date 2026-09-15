import React, { useState, useEffect, useRef } from 'react';
import { Route, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  User as UserIcon, ArrowLeft, Mail, Lock, AlertCircle, Eye, EyeOff,
  CheckCircle2, Camera, FileText, Sparkles, ChevronRight, Award, Target, BookOpen, ShieldCheck, SwitchCamera
} from 'lucide-react';
import { getMobileCompatibleCameraStream, attachStreamToVideo } from '../utils/cameraUtils';

import { api } from '../services/api';
import { getFaceLandmarker, analyzeFaceLandmarks, drawFaceCalibrationOverlay, FaceCalibrationStatus } from '../services/faceTracker';

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

  // Clear credentials and errors on mode switch or mount
  useEffect(() => {
    setEmail('');
    setPassword('');
    setFullName('');
    setErrors({});
  }, [mode]);

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time Face Calibration Overlay state for Registration Step 2
  const [calibrationStatus, setCalibrationStatus] = useState<FaceCalibrationStatus>({
    isCalibrated: false,
    message: 'INITIALIZING CAMERA & MESH...',
    precisionScore: 0,
    faceDetected: false,
  });

  // MediaPipe Face Calibration Animation Loop when webcam is active
  useEffect(() => {
    let active = true;
    let animFrameId: number;

    const runCalibrationLoop = async () => {
      if (!cameraActive) return;
      const landmarker = await getFaceLandmarker();

      const processFrame = () => {
        if (!active || !cameraActive || !videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState >= 2 && video.videoWidth > 0) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const ctx = canvas.getContext('2d');
          if (ctx) {
            let landmarks = null;
            let analysis = null;

            if (landmarker) {
              try {
                const results = landmarker.detectForVideo(video, performance.now());
                if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
                  landmarks = results.faceLandmarks[0];
                  analysis = analyzeFaceLandmarks(landmarks, canvas.width, canvas.height);
                }
              } catch (e) {
                // ignore frame errors
              }
            }

            const status = drawFaceCalibrationOverlay(ctx, landmarks, canvas.width, canvas.height, analysis);
            setCalibrationStatus(status);
          }
        }

        if (active && cameraActive) {
          animFrameId = requestAnimationFrame(processFrame);
        }
      };

      processFrame();
    };

    if (cameraActive) {
      runCalibrationLoop();
    }

    return () => {
      active = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [cameraActive]);

  const validateEmail = (emailStr: string) => {
    return /\S+@\S+\.\S+/.test(emailStr);
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-800', textColor: 'text-slate-400' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1: return { score: 25, label: 'Weak', color: 'bg-rose-500', textColor: 'text-rose-400' };
      case 2: return { score: 50, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-400' };
      case 3: return { score: 75, label: 'Good', color: 'bg-emerald-400', textColor: 'text-emerald-400' };
      case 4: return { score: 100, label: 'Strong', color: 'bg-indigo-500', textColor: 'text-indigo-400' };
      default: return { score: 15, label: 'Too Short', color: 'bg-rose-500', textColor: 'text-rose-400' };
    }
  };

  const strength = getPasswordStrength(password);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const streamRef = useRef<MediaStream | null>(null);
  const cameraActiveRef = useRef<boolean>(cameraActive);

  useEffect(() => {
    cameraActiveRef.current = cameraActive;
  }, [cameraActive]);

  // Turn off camera if user navigates away from Step 2
  useEffect(() => {
    if (signupStep !== 2 && cameraActive) {
      stopCamera();
    }
  }, [signupStep, cameraActive]);

  // Ensure camera is stopped when StudentAuth unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const toggleCameraFacing = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (cameraActive) {
      stopCamera();
      setTimeout(() => startCameraWithFacing(nextMode), 200);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCameraWithFacing = async (mode: 'user' | 'environment') => {
    try {
      stopCamera();
      setCameraActive(true);
      cameraActiveRef.current = true;
      const stream = await getMobileCompatibleCameraStream(mode, 320, 240);

      if (!cameraActiveRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        await attachStreamToVideo(videoRef.current, stream);
        if (!cameraActiveRef.current) {
          stopCamera();
        }
      } else {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } catch (err) {
      console.error("Camera access failed", err);
      alert("Could not access camera. Please upload an image file or choose a preset avatar.");
      stopCamera();
    }
  };

  const startCamera = async () => {
    await startCameraWithFacing(facingMode);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 480, 480);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setAvatar(dataUrl);
      }
      stopCamera();
    }
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
      setErrors({ submit: err.message || 'Invalid email or password' });
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

  // Final Signup Submit
  const handleFinalSignupSubmit = async () => {
    setLoading(true);
    setErrors({});

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
      setErrors({ submit: err.message || 'Registration failed' });
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
    setEmail('student@cognilearn.com');
    setPassword('password123');
    setFullName('Ananya Sharma (Demo)');
    setConfirmPassword('password123');
    setErrors({});
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setErrors({});
    try {
      const res = await api.auth.login({ email: 'student@cognilearn.com', password: 'password123', role: 'student' });
      setLoading(false);
      onLoginSuccess({
        ...res.user,
        isDemo: true,
      });
      setCurrentRoute('student-dashboard');
    } catch {
      setLoading(false);
      onLoginSuccess({
        id: 'mem-user-student-1',
        fullName: 'Ananya Sharma (Demo)',
        email: 'student@cognilearn.com',
        role: 'student',
        xp: 1450,
        totalHours: 24.5,
        completedSessions: 12,
        isDemo: true,
      });
      setCurrentRoute('student-dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative bg-[#0B0F17] text-slate-100 font-sans overflow-hidden">
      {/* Background Grid & Ambient Glow */}
      <div className="grid-bg" />
      <div className="glow-effect" />

      {/* Back button */}
      <div className="max-w-xl mx-auto w-full mb-6 relative z-10">
        <button
          onClick={() => setCurrentRoute('landing')}
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer group"
          id="student-auth-back-btn"
        >
          <ArrowLeft className="h-4 w-4 text-sky-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="max-w-xl mx-auto w-full saas-card p-6 sm:p-10 rounded-xl border border-slate-800 shadow-2xl relative z-10 text-slate-100">
        {/* Header section */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 mx-auto mb-4 shadow-sm">
            <UserIcon className="h-7 w-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-white">
            {mode === 'login' ? 'Student Login' : 'Student Onboarding'}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-md mx-auto">
            {mode === 'login'
              ? 'Resume your personalized AI focus sessions & analytics logs'
              : 'Join CogniLearn to unlock automated cognitive focus tracking'}
          </p>
        </div>

        {/* Signup Multi-Step Wizard Indicator */}
        {mode === 'signup' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2 text-xs font-medium">
              <span className="text-indigo-400 font-semibold">
                Step {signupStep} of 3
              </span>
              <span className="text-slate-300">
                {signupStep === 1 && 'Account Credentials'}
                {signupStep === 2 && 'AI Profile Avatar'}
                {signupStep === 3 && 'Academic Focus Goals'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${(signupStep / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Form Implementation */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5" id="student-login-form" autoComplete="off">
            {errors.submit && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-medium flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errors.submit}</span>
              </div>
            )}
            {/* Email input */}
            <div>
              <label htmlFor="student-email" className="block text-xs font-semibold text-slate-200 mb-2">
                Student Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  id="student-email"
                  name="student-email"
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
                  placeholder="student@school.edu"
                  className={`block w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm focus:outline-none transition-all placeholder:text-slate-500 ${errors.email
                      ? 'border border-rose-500'
                      : 'border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    }`}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-xs font-medium text-rose-400 flex items-center space-x-1" id="student-email-error">
                  <AlertCircle className="h-3 w-3 shrink-0 text-rose-400" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="student-password" className="block text-xs font-semibold text-slate-200 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="student-password"
                  name="student-password"
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
                <p className="mt-2 text-xs font-medium text-rose-400 flex items-center space-x-1" id="student-password-error">
                  <AlertCircle className="h-3 w-3 shrink-0 text-rose-400" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/35 cursor-pointer disabled:opacity-50 text-sm"
                id="btn-student-login"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
            <div className="pt-4 border-t border-slate-800 flex flex-col space-y-4">
              <button
                type="button"
                onClick={() => {
                  setCurrentRoute('student-signup');
                  setSignupStep(1);
                }}
                className="w-full py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer text-center"
                id="btn-student-goto-signup"
              >
                New Student? Create Account & Calibrate Profile
              </button>

              {/* Quick Mock Login Helper */}
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg text-center space-y-2.5">
                <p className="text-xs font-semibold text-sky-300">
                  Sandbox Student Demo (With Pre-loaded Stats)
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleQuickDemoLogin}
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 py-1.5 px-3.5 rounded-md text-xs font-semibold cursor-pointer transition-colors"
                    id="btn-student-instant-demo"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
                    <span>Instant Demo Login</span>
                  </button>
                  <button
                    type="button"
                    onClick={fillMockData}
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 py-1.5 px-3.5 rounded-md text-xs font-medium cursor-pointer transition-colors"
                    id="btn-student-mock-fill"
                  >
                    <span>Autofill Form</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div>
            <AnimatePresence mode="wait">
              {/* Step 1: Account Credentials */}
              {signupStep === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleStep1Next}
                  className="space-y-4"
                >
                  {/* Full Name */}
                  <div>
                    <label htmlFor="student-fullname" className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        id="student-fullname"
                        name="student-fullname"
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
                        placeholder="Enter your full name"
                        className={`block w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm focus:outline-none transition-all placeholder:text-slate-500 ${errors.fullName ? 'border border-rose-500' : 'border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                          }`}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1.5 text-xs font-medium text-rose-400 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{errors.fullName}</span>
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="student-signup-email" className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Student Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        type="email"
                        id="student-signup-email"
                        name="student-signup-email"
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
                        placeholder="student@school.edu"
                        className={`block w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm focus:outline-none transition-all placeholder:text-slate-500 ${errors.email ? 'border border-rose-500' : 'border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                          }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1.5 text-xs font-medium text-rose-400 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="student-signup-password" className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="student-signup-password"
                        name="student-signup-password"
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
                        className={`block w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm focus:outline-none transition-all placeholder:text-slate-500 ${errors.password ? 'border border-rose-500' : 'border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
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
                    {password && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-400">Strength:</span>
                          <span className={`font-bold ${strength.textColor}`}>{strength.label}</span>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: `${strength.score}%` }} />
                        </div>
                      </div>
                    )}
                    {errors.password && (
                      <p className="mt-1 text-xs font-medium text-rose-400 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3 text-rose-400" />
                        <span>{errors.password}</span>
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="student-confirmPassword" className="block text-[10px] font-mono font-bold text-white/80 uppercase tracking-widest mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
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
                        className={`block w-full pl-10 pr-4 py-2.5 bg-[#27272a] text-white text-sm focus:outline-none transition-all placeholder:opacity-40 ${errors.confirmPassword ? 'border-rose-500' : 'border-slate-700 focus:border-indigo-500'
                          }`}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs font-medium text-rose-400 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3 text-rose-400" />
                        <span>{errors.confirmPassword}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center space-x-2 bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white font-bold py-3.5 px-4 transition-colors cursor-pointer text-xs uppercase tracking-widest font-mono border-none"
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
                  className="space-y-4 text-center"
                  id="student-signup-step2"
                >
                  <div className="bg-white/5 border border-white/10 p-3.5 text-center rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-[#FF5A5F]" />
                      <p className="text-xs font-mono uppercase tracking-wider text-[#FF5A5F] font-bold">
                        AI Real-Time Face Calibration Overlay
                      </p>
                    </div>
                    <p className="text-xs text-white/70">
                      Align your face inside the target ring. The MediaPipe 468-point mesh generates high-precision vectors for classroom tracking.
                    </p>
                  </div>

                  {/* Avatar & Camera Calibration Viewport */}
                  <div className="relative w-52 h-52 sm:w-60 sm:h-60 mx-auto rounded-2xl border-2 border-white/20 overflow-hidden bg-slate-950 flex items-center justify-center shadow-xl group">
                    {cameraActive ? (
                      <div className="relative w-full h-full">
                        <video ref={videoRef} className="w-full h-full object-cover transform -scale-x-100" />
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100" />

                        {/* Top HUD Badges Overlay */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
                          <div className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-md ${calibrationStatus.isCalibrated
                              ? 'bg-emerald-500/90 text-white border border-emerald-400/50'
                              : calibrationStatus.faceDetected
                                ? 'bg-amber-500/90 text-slate-950 font-black'
                                : 'bg-rose-500/90 text-white'
                            }`}>
                            {calibrationStatus.isCalibrated ? '✔ CALIBRATED' : calibrationStatus.faceDetected ? '🎯 ALIGNING' : '⚠️ NO FACE'}
                          </div>
                          <div className="text-[9px] font-mono bg-black/80 text-emerald-400 font-bold px-2 py-0.5 rounded border border-white/10 backdrop-blur-md">
                            VECTOR: {calibrationStatus.precisionScore}%
                          </div>
                        </div>
                      </div>
                    ) : avatar ? (
                      <div className="relative w-full h-full">
                        <img src={avatar} alt="Avatar preview" className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md text-emerald-400 text-[10px] font-mono font-bold py-1 px-2 rounded border border-emerald-500/30 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Facial Vector Calibrated</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-white/40 p-4">
                        <UserIcon className="h-12 w-12 mb-2 text-white/30" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/60 font-bold">No Avatar Enrolled</span>
                        <span className="text-[9px] text-white/40 mt-1">Start camera for live face mesh calibration</span>
                      </div>
                    )}
                  </div>

                  {/* Live Positioning Prompt Banner */}
                  {cameraActive && (
                    <div className={`p-3 rounded-lg border text-xs font-mono transition-all duration-300 flex items-center justify-between gap-2 text-left ${calibrationStatus.isCalibrated
                        ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/20'
                        : calibrationStatus.faceDetected
                          ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                          : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                      }`}>
                      <div className="flex items-center gap-2">
                        {calibrationStatus.isCalibrated ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 animate-bounce" />
                        ) : (
                          <Target className="h-4 w-4 text-amber-400 shrink-0 animate-spin" />
                        )}
                        <span className="font-bold text-[11px] tracking-tight">{calibrationStatus.message}</span>
                      </div>
                      <div className="text-[9px] font-bold px-2 py-0.5 bg-black/50 rounded border border-white/10 shrink-0 text-white font-mono">
                        {calibrationStatus.precisionScore}% Score
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    {cameraActive ? (
                      <>
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="inline-flex items-center space-x-1.5 bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white font-bold text-xs py-2.5 px-5 font-mono uppercase tracking-wider cursor-pointer border-none shadow-md shadow-[#FF5A5F]/20"
                        >
                          <Camera className="h-4 w-4" />
                          <span>Snap Calibrated Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={toggleCameraFacing}
                          className="inline-flex items-center space-x-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs py-2.5 px-3 border border-amber-500/40 cursor-pointer font-mono"
                          title="Switch between front/selfie and rear camera"
                        >
                          <SwitchCamera className="h-4 w-4" />
                          <span>{facingMode === 'user' ? 'Front' : 'Rear'}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="inline-flex items-center space-x-1.5 bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white font-semibold text-xs py-2.5 px-5 border border-transparent transition-colors cursor-pointer shadow-md shadow-[#FF5A5F]/20 font-mono"
                      >
                        <Camera className="h-4 w-4 text-white" />
                        <span>Start Camera Calibration</span>
                      </button>
                    )}

                    <label className="inline-flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs py-2.5 px-4 border border-white/20 transition-colors cursor-pointer font-mono">
                      <FileText className="h-4 w-4 text-[#FF5A5F]" />
                      <span>Upload File</span>
                      <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                    </label>
                  </div>

                  {/* Preset Avatars */}
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/60 mb-2">
                      Or Select Preset Avatar
                    </p>
                    <div className="flex justify-center space-x-3">
                      {presetAvatars.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(url)}
                          className={`w-10 h-10 rounded-full border-2 overflow-hidden transition-all cursor-pointer ${avatar === url ? 'border-[#FF5A5F] scale-110 shadow-md shadow-[#FF5A5F]/30' : 'border-white/20 hover:border-white/50'
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
                      className="text-xs font-mono uppercase tracking-wider text-white/70 hover:text-white"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupStep(3)}
                      className="inline-flex items-center space-x-2 bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white font-bold py-3 px-5 text-xs uppercase tracking-wider font-mono cursor-pointer border-none"
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
                    <label className="block text-[10px] font-mono font-bold text-white/80 uppercase tracking-widest mb-2">
                      Select Academic Level / Grade
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Class 9', 'Class 10', 'Class 11', 'Class 12', 'College'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setGradeLevel(lvl)}
                          className={`py-2 px-3 text-xs font-mono font-semibold border transition-all cursor-pointer ${gradeLevel === lvl
                              ? 'bg-[#FF5A5F]/20 border-[#FF5A5F] text-white'
                              : 'bg-[#27272a] border-white/10 text-white/70 hover:border-white/30'
                            }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Focus Session Slot */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-white/80 uppercase tracking-widest mb-2">
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
                          className={`py-2.5 px-3 text-center border transition-all cursor-pointer ${targetFocusSlot === slot.duration
                              ? 'bg-[#FF5A5F]/20 border-[#FF5A5F] text-white'
                              : 'bg-[#27272a] border-white/10 text-white/70 hover:border-white/30'
                            }`}
                        >
                          <p className="text-xs font-mono font-bold">{slot.title}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Subjects */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-white/80 uppercase tracking-widest mb-2">
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
                            className={`py-1.5 px-3 text-xs font-medium border transition-all cursor-pointer ${isSelected
                                ? 'bg-[#FF5A5F] border-[#FF5A5F] text-white'
                                : 'bg-[#27272a] border-white/10 text-white/70 hover:border-white/30'
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
                      className="text-xs font-mono uppercase tracking-wider text-white/70 hover:text-white"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleFinalSignupSubmit}
                      className="w-full inline-flex items-center justify-center space-x-2 bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white font-bold py-3.5 px-5 text-xs uppercase tracking-widest font-mono cursor-pointer border-none disabled:opacity-50"
                    >
                      {loading ? (
                        <span>Creating Account...</span>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-white" />
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
                className="text-xs font-mono uppercase tracking-wider text-white/70 hover:text-[#FF5A5F]"
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
