import React, { useState, useEffect, useRef } from 'react';
import { Route, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  User as UserIcon, ArrowLeft, Mail, Lock, AlertCircle, Eye, EyeOff,
  CheckCircle2, Camera, FileText, Sparkles, ChevronRight, Award, Target, BookOpen, ShieldCheck, SwitchCamera,
  School, Building2, KeyRound, Search, Hash
} from 'lucide-react';
import { getMobileCompatibleCameraStream, attachStreamToVideo } from '../utils/cameraUtils';

import { api } from '../services/api';
import { getFaceLandmarker, analyzeFaceLandmarks, drawFaceCalibrationOverlay, FaceCalibrationStatus } from '../services/faceTracker';
import { AcademicProfileForm } from './common/AcademicProfileForm';

interface StudentAuthProps {
  mode: 'login' | 'signup';
  setCurrentRoute: (route: Route) => void;
  onLoginSuccess: (user: User) => void;
}

export const StudentAuth: React.FC<StudentAuthProps> = ({ mode, setCurrentRoute, onLoginSuccess }) => {
  // Wizard step state (1: Credentials, 2: Academic Track / Class Code, 3: Photo Calibration)
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
  const [gradeLevel, setGradeLevel] = useState('Class 10');
  const [learningStyle, setLearningStyle] = useState<'Visual' | 'Auditory' | 'Kinesthetic' | 'Reading/Writing'>('Visual');
  const [curriculumTrack, setCurriculumTrack] = useState('CBSE');
  const [targetFocusSlot, setTargetFocusSlot] = useState('25'); // minutes
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics', 'Physics']);

  // Academic Onboarding (Step 2)
  const [academicMode, setAcademicMode] = useState<'code' | 'profile'>('code');
  const [joinCode, setJoinCode] = useState('');
  const [joinRollNo, setJoinRollNo] = useState('');
  const [verifiedCohort, setVerifiedCohort] = useState<any | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeVerifyError, setCodeVerifyError] = useState('');
  const [academicProfileData, setAcademicProfileData] = useState<any>(null);
  const [isProfileValid, setIsProfileValid] = useState(false);

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

  // Turn off camera if user navigates away from Step 3
  useEffect(() => {
    if (signupStep !== 3 && cameraActive) {
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
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 320, 320);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setAvatar(dataUrl);
      }
      stopCamera();
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawResult = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 320;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            setAvatar(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            setAvatar(rawResult);
          }
        };
        img.onerror = () => setAvatar(rawResult);
        img.src = rawResult;
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

  // Verify Class Join Code
  const handleVerifyCode = async (codeToVerify: string) => {
    const clean = codeToVerify.trim().toUpperCase();
    if (!clean) {
      setCodeVerifyError('Please enter a class join code');
      return;
    }
    setIsVerifyingCode(true);
    setCodeVerifyError('');
    try {
      const cohort = await api.cohorts.verifyCode(clean);
      setVerifiedCohort(cohort);
      setIsVerifyingCode(false);
    } catch (err: any) {
      setVerifiedCohort(null);
      setCodeVerifyError(err.message || 'Class cohort not found with code: ' + clean);
      setIsVerifyingCode(false);
    }
  };

  // Step 2 Next button handler
  const handleStep2Next = () => {
    const newErrors: { [key: string]: string } = {};

    if (academicMode === 'code') {
      if (!joinCode.trim()) {
        newErrors.joinCode = 'Please enter a class join code';
      } else if (!verifiedCohort) {
        newErrors.joinCode = 'Please verify class code before continuing';
      }
      if (!joinRollNo.trim()) {
        newErrors.joinRollNo = 'Roll number / USN is required';
      }
    } else {
      if (!isProfileValid) {
        newErrors.academic = 'Please resolve all required academic profile fields';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSignupStep(3);
  };

  // Final Signup Submit
  const handleFinalSignupSubmit = async () => {
    setLoading(true);
    setErrors({});

    try {
      const regPayload: any = {
        fullName,
        email,
        password,
        role: 'student',
        avatar,
      };

      if (academicMode === 'code' && verifiedCohort) {
        regPayload.tier = verifiedCohort.tier;
        regPayload.gradeLevel = verifiedCohort.standard || verifiedCohort.department;
        regPayload.rollNo = joinRollNo.trim();
        regPayload.enrolledSubjects = [verifiedCohort.subject];
        regPayload.academicProfile = {
          tier: verifiedCohort.tier,
          institutionName: verifiedCohort.name,
          standard: verifiedCohort.standard,
          department: verifiedCohort.department,
          section: verifiedCohort.section,
          rollNo: joinRollNo.trim(),
          subjects: [verifiedCohort.subject],
          classCode: verifiedCohort.code,
        };
      } else if (academicProfileData) {
        regPayload.tier = academicProfileData.tier;
        regPayload.academicProfile = academicProfileData;
        regPayload.gradeLevel = academicProfileData.standard || academicProfileData.department;
        regPayload.rollNo = academicProfileData.rollNo;
        regPayload.enrolledSubjects = academicProfileData.subjects;
        regPayload.institutionName = academicProfileData.institutionName;
      }

      const res = await api.auth.register(regPayload);

      // If joining via class code, bind enrollment
      if (academicMode === 'code' && verifiedCohort) {
        try {
          await api.cohorts.join(joinCode.trim(), joinRollNo.trim());
        } catch (joinErr: any) {
          console.warn('[Cohort Join Warning]:', joinErr.message);
        }
      }

      setLoading(false);
      onLoginSuccess(res.user);
      setCurrentRoute('student-dashboard');
    } catch (err: any) {
      setLoading(false);
      setErrors({ submit: err.message || 'Registration failed' });
    }
  };

  const fillMockData = (track: 'school' | 'college' = 'school') => {
    if (track === 'college') {
      setEmail('college-student@cognilearn.com');
      setPassword('password123');
      setFullName('Rohan Varma (Demo)');
      setConfirmPassword('password123');
      setJoinCode('CS3B-9X');
      setJoinRollNo('22CS084');
    } else {
      setEmail('student@cognilearn.com');
      setPassword('password123');
      setFullName('Ananya Sharma (Demo)');
      setConfirmPassword('password123');
      setJoinCode('KV10-A');
      setJoinRollNo('14');
    }
    setErrors({});
  };

  const handleQuickDemoLogin = async (track: 'school' | 'college' = 'school') => {
    setLoading(true);
    setErrors({});
    const targetEmail = track === 'college' ? 'college-student@cognilearn.com' : 'student@cognilearn.com';
    try {
      const res = await api.auth.login({ email: targetEmail, password: 'password123', role: 'student' });
      setLoading(false);
      onLoginSuccess({
        ...res.user,
        isDemo: true,
      });
      setCurrentRoute('student-dashboard');
    } catch {
      setLoading(false);
      if (track === 'college') {
        onLoginSuccess({
          id: 'mem-user-student-2',
          fullName: 'Rohan Varma (Demo)',
          email: 'college-student@cognilearn.com',
          role: 'student',
          tier: 'college',
          xp: 2180,
          totalHours: 42.0,
          completedSessions: 26,
          isDemo: true,
          gradeLevel: 'College 3rd Year',
          department: 'Computer Science & Engineering',
        });
      } else {
        onLoginSuccess({
          id: 'mem-user-student-1',
          fullName: 'Ananya Sharma (Demo)',
          email: 'student@cognilearn.com',
          role: 'student',
          tier: 'school',
          xp: 1450,
          totalHours: 24.5,
          completedSessions: 12,
          isDemo: true,
          gradeLevel: 'Class 10',
          institutionName: 'Delhi Public School, R.K. Puram',
        });
      }
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
                {signupStep === 2 && 'School / College Track'}
                {signupStep === 3 && 'Face Calibration & Reticle'}
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
                  className={`block w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm focus:outline-none transition-all placeholder:opacity-50 ${errors.email
                      ? 'border border-rose-500'
                      : 'border border-slate-800 focus:ring-2 focus:ring-indigo-500'
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
                  className={`block w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm focus:outline-none transition-all placeholder:opacity-50 ${errors.password
                      ? 'border border-rose-500'
                      : 'border border-slate-800 focus:ring-2 focus:ring-indigo-500'
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
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center space-y-3">
                <p className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Try Sandbox Student Demos (With Pre-loaded Stats)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('school')}
                    className="inline-flex items-center justify-center space-x-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    id="btn-student-instant-demo-school"
                  >
                    <School className="h-3.5 w-3.5 text-indigo-400" />
                    <span>School Demo (Class 10-A)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('college')}
                    className="inline-flex items-center justify-center space-x-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    id="btn-student-instant-demo-college"
                  >
                    <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>College Demo (B.Tech CSE)</span>
                  </button>
                </div>
                <div className="flex justify-center gap-2 pt-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => fillMockData('school')}
                    className="text-[11px] text-slate-400 hover:text-indigo-300 transition-colors"
                  >
                    Autofill School Credentials
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => fillMockData('college')}
                    className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
                  >
                    Autofill College Credentials
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
                        className={`block w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm focus:outline-none transition-all placeholder:opacity-50 ${errors.fullName ? 'border border-rose-500' : 'border border-slate-800 focus:ring-2 focus:ring-indigo-500'
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
                        className={`block w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm focus:outline-none transition-all placeholder:opacity-50 ${errors.email ? 'border border-rose-500' : 'border border-slate-800 focus:ring-2 focus:ring-indigo-500'
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
                        className={`block w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-900 text-slate-100 text-sm focus:outline-none transition-all placeholder:opacity-50 ${errors.password ? 'border border-rose-500' : 'border border-slate-800 focus:ring-2 focus:ring-indigo-500'
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
                        className={`block w-full pl-10 pr-4 py-2.5 bg-[#27272a] text-white text-sm focus:outline-none transition-all placeholder:opacity-40 ${errors.confirmPassword ? 'border-rose-500' : 'border-slate-700 focus:ring-2 focus:ring-indigo-500'
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
                      className="w-full inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-4 rounded-xl transition-colors cursor-pointer text-xs uppercase tracking-wider font-mono shadow-md shadow-indigo-600/30"
                    >
                      <span>Continue to Academic Setup</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="flex justify-center gap-2 pt-3 border-t border-slate-800/80 text-xs">
                      <button
                        type="button"
                        onClick={() => fillMockData('school')}
                        className="text-slate-400 hover:text-indigo-400 transition-colors"
                      >
                        Autofill School Demo
                      </button>
                      <span className="text-slate-600">•</span>
                      <button
                        type="button"
                        onClick={() => fillMockData('college')}
                        className="text-slate-400 hover:text-cyan-400 transition-colors"
                      >
                        Autofill College Demo
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}

              {/* STEP 2: ACADEMIC TRACK & CLASS CODE */}
              {signupStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                  id="student-signup-step2"
                >
                  {/* Mode Selector Tabs */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setAcademicMode('code')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        academicMode === 'code'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Join with Class Code</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAcademicMode('profile')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        academicMode === 'profile'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <School className="w-3.5 h-3.5" />
                      <span>Independent Profile</span>
                    </button>
                  </div>

                  {academicMode === 'code' ? (
                    <div className="space-y-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-left">
                      <div>
                        <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                          Enter 6-Character Class Join Code
                        </label>
                        <p className="text-[11px] text-slate-400 mb-2">
                          Ask your teacher or professor for the 6-character class code (e.g., <span className="text-indigo-400 font-mono">KV10-A</span> or <span className="text-cyan-400 font-mono">CS3B-9X</span>).
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => {
                              setJoinCode(e.target.value.toUpperCase());
                              setVerifiedCohort(null);
                              setCodeVerifyError('');
                            }}
                            placeholder="e.g. KV10-A"
                            className="flex-1 px-4 py-2.5 bg-slate-950 text-white font-mono uppercase text-sm border border-slate-800 rounded-xl tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            disabled={isVerifyingCode || !joinCode.trim()}
                            onClick={() => handleVerifyCode(joinCode)}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>{isVerifyingCode ? 'Checking...' : 'Verify'}</span>
                          </button>
                        </div>
                        {codeVerifyError && (
                          <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{codeVerifyError}</span>
                          </p>
                        )}
                        {errors.joinCode && (
                          <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.joinCode}</span>
                          </p>
                        )}
                      </div>

                      {/* Verified Cohort Preview Banner */}
                      {verifiedCohort && (
                        <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-2 animate-fadeIn text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Class Verified
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {verifiedCohort.tier === 'school' ? 'K-12 School' : 'Higher Ed'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{verifiedCohort.name}</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
                            <div><span className="text-slate-500">Subject:</span> {verifiedCohort.subject}</div>
                            <div><span className="text-slate-500">Section:</span> {verifiedCohort.section}</div>
                            <div><span className="text-slate-500">Faculty:</span> {verifiedCohort.teacherName}</div>
                            {verifiedCohort.room && <div><span className="text-slate-500">Room:</span> {verifiedCohort.room}</div>}
                          </div>
                        </div>
                      )}

                      {/* Roll Number Input */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                          Your Roll Number / USN in this Class
                        </label>
                        <input
                          type="text"
                          value={joinRollNo}
                          onChange={(e) => {
                            setJoinRollNo(e.target.value);
                            if (errors.joinRollNo) {
                              const updated = { ...errors };
                              delete updated.joinRollNo;
                              setErrors(updated);
                            }
                          }}
                          placeholder="e.g. 14 or 22CS084"
                          className="w-full px-4 py-2.5 bg-slate-950 text-white font-mono text-sm border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.joinRollNo && (
                          <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.joinRollNo}</span>
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-1">
                          Roll numbers are unique per class cohort to match teacher attendance records.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <AcademicProfileForm
                        mode="student"
                        onChange={(profile, isValid) => {
                          setAcademicProfileData(profile);
                          setIsProfileValid(isValid);
                          if (errors.academic && isValid) {
                            const updated = { ...errors };
                            delete updated.academic;
                            setErrors(updated);
                          }
                        }}
                      />
                      {errors.academic && (
                        <p className="text-rose-400 text-xs mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.academic}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Navigation buttons */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSignupStep(1)}
                      className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleStep2Next}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
                    >
                      <span>Continue to Face Calibration</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: FACE CALIBRATION & AVATAR RETICLE */}
              {signupStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 text-center"
                  id="student-signup-step3"
                >
                  <div className="bg-slate-900/80 border border-slate-800 p-3.5 text-center rounded-xl">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-indigo-400" />
                      <p className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-bold">
                        AI Real-Time Face Calibration Overlay
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      Align your face inside the target ring. The MediaPipe 468-point mesh generates high-precision vectors for classroom tracking.
                    </p>
                    {/* DPDP Act Compliance Notice */}
                    <div className="mt-2 text-[10px] text-emerald-400/90 font-mono bg-emerald-950/30 border border-emerald-500/20 p-1.5 rounded flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>DPDP Act Verified: On-device processing for Standards 6–12 & Higher Ed. No raw video stored.</span>
                    </div>
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
                          className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-5 font-mono uppercase tracking-wider cursor-pointer border-none shadow-md shadow-indigo-600/20"
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
                        className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-5 border border-transparent transition-colors cursor-pointer shadow-md shadow-indigo-600/20 font-mono"
                      >
                        <Camera className="h-4 w-4 text-white" />
                        <span>Start Camera Calibration</span>
                      </button>
                    )}

                    <label className="inline-flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs py-2.5 px-4 border border-white/20 transition-colors cursor-pointer font-mono">
                      <FileText className="h-4 w-4 text-indigo-400" />
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
                          className={`w-10 h-10 rounded-full border-2 overflow-hidden transition-all cursor-pointer ${avatar === url ? 'border-indigo-500 scale-110 shadow-md shadow-indigo-500/30' : 'border-white/20 hover:border-white/50'
                            }`}
                        >
                          <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Complete Submit */}
                  <div className="pt-4 flex items-center justify-between gap-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSignupStep(2)}
                      className="text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleFinalSignupSubmit}
                      className="w-full inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-5 text-xs uppercase tracking-widest font-mono cursor-pointer border-none disabled:opacity-50 shadow-lg shadow-indigo-600/30"
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
