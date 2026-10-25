import React, { useState, useRef, useEffect } from 'react';
import { Route, User, ClassDiagnosticReport, StudentDiagnosticReport } from '../types';
import { motion } from 'motion/react';
import {
  Users, BookOpen, FileText, Settings, LogOut,
  School, Calendar, Award, GraduationCap, ChevronRight,
  UserCheck, AlertCircle, Sparkles, TrendingUp, Plus, Trash2, CheckCircle2, Sliders,
  Camera, Video, Play, Pause, Bell, ShieldAlert, Volume2, VolumeX, PlusCircle, Check,
  Lock, Mail, UserPlus, Info, ChevronDown, Clock, Square, History, SwitchCamera,
  Building2, Copy, KeyRound
} from 'lucide-react';
import {
  SCHOOL_STANDARDS_AND_SUBJECTS,
  COLLEGE_DEPARTMENTS,
  getCollegeSubjects,
  getSchoolSubjects,
} from '../config/academicCatalogs';
import { getMobileCompatibleCameraStream, attachStreamToVideo } from '../utils/cameraUtils';
import { api } from '../services/api';
import { StudentCameraFeed } from './StudentCameraFeed';
import { ClassroomAutoTracker } from './ClassroomAutoTracker';
import { DiagnosticReportModal } from './DiagnosticReportModal';
import { InfoTooltip } from './FocusTipCard';
import { isDemoAccount } from '../utils/demoUtils';
import { exportReportToPDF, exportReportToCSV } from '../utils/reportExport';
import { Download } from 'lucide-react';
import {
  getAllBiometricRecords,
  deleteBiometricRecord,
  StudentBiometricRecord,
} from '../utils/biometricStorage';
import { subscribeToTelemetry } from '../services/telemetryStream';

import { useTheme } from '../context/ThemeContext';

interface TeacherDashboardProps {
  user: User | null;
  setCurrentRoute: (route: Route) => void;
  onLogout: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  setCurrentRoute,
  onLogout,
}) => {
  const { isDark } = useTheme();
  const isDemo = isDemoAccount(user);
  const teacherName = user?.fullName || (isDemo ? 'Dr. Ramesh Kumar (Demo)' : 'Educator');
  const teacherEmail = user?.email || (isDemo ? 'teacher@cognilearn.com' : '');
  const teacherType = user?.teacherType || 'Class Teacher';

  // State to simulate an alert box or notice
  const [showNotice, setShowNotice] = useState(true);

  // Tab View Mode: 'overview' or 'room' (Classroom Room Mode Live Feed)
  const [dashboardMode, setDashboardMode] = useState<'overview' | 'room'>('overview');

  // User-scoped storage keys
  const teacherStorageId = user?.id || user?.email || 'educator';
  const classesStorageKey = `cognilearn_teacher_classes_${teacherStorageId}`;
  const studentsStorageKey = `cognilearn_teacher_students_${teacherStorageId}`;
  const reportsStorageKey = `cognilearn_teacher_diagnostic_history_${teacherStorageId}`;

  const isCollege = user?.tier === 'college' || (user?.email && user.email.includes('college')) || (user?.teacherProfile && user.teacherProfile.tier === 'college');

  // --- 1. Multi-Class Handling States ---
  // Standard datasets only loaded for demo accounts; newly created accounts start clean
  const [classes, setClasses] = useState<Array<{
    id: string;
    code?: string;
    name: string;
    room: string;
    strength: number;
    year: string;
    tier?: 'school' | 'college';
    standard?: string;
    department?: string;
    section?: string;
    subject?: string;
  }>>(() => {
    const saved = localStorage.getItem(classesStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // ignore
      }
    }
    if (isCollege) {
      return [
        { id: 'cs-301-b', code: 'CS301-B', name: 'B.Tech CSE - Year 3 Section B', room: 'Lab 304', strength: 5, year: '2026-2027', tier: 'college', subject: 'Operating Systems', section: 'B', department: 'Computer Science & Engineering' },
        { id: 'cs-402-a', code: 'CS402-A', name: 'B.Tech CSE - Year 4 Section A', room: 'LH 12', strength: 4, year: '2026-2027', tier: 'college', subject: 'Distributed Systems', section: 'A', department: 'Computer Science & Engineering' },
      ];
    }
    return [
      { id: 'class-10-a', code: 'KV10-A', name: 'Class 10-A Science & Tech', room: 'Room 102', strength: 5, year: '2026-2027', tier: 'school', subject: 'Mathematics & Science', section: 'A', standard: 'Class 10' },
      { id: 'class-10-b', code: 'KV10-B', name: 'Class 10-B Science', room: 'Room 104', strength: 4, year: '2026-2027', tier: 'school', subject: 'Natural Science', section: 'B', standard: 'Class 10' },
      { id: 'class-11-sci', code: 'KV11-S', name: 'Class 11-A Physics & Math', room: 'Lab 2', strength: 5, year: '2026-2027', tier: 'school', subject: 'Physics', section: 'A', standard: 'Class 11' },
      { id: 'class-12-comm', code: 'KV12-C', name: 'Class 12-A Commerce', room: 'Room 203', strength: 3, year: '2026-2027', tier: 'school', subject: 'Business Studies', section: 'A', standard: 'Class 12' },
    ];
  });

  const [activeClassId, setActiveClassId] = useState<string>(() => {
    const saved = localStorage.getItem(classesStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      } catch (e) { }
    }
    return isCollege ? 'cs-301-b' : 'class-10-a';
  });

  // Sync cohorts from backend on mount
  useEffect(() => {
    let isMounted = true;
    api.cohorts.getMyCohorts()
      .then((res) => {
        if (isMounted && res?.cohorts && res.cohorts.length > 0) {
          const mapped = res.cohorts.map((c: any) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            room: c.room || 'General Room',
            strength: c.studentCount || 0,
            year: c.academicYear || '2026-2027',
            tier: c.tier,
            subject: c.subject,
            section: c.section,
            standard: c.standard,
            department: c.department,
          }));
          setClasses(mapped);
          if (!mapped.some((c: any) => c.id === activeClassId)) {
            setActiveClassId(mapped[0].id);
          }
        }
      })
      .catch(() => {
        // Backend offline fallback, retain current state
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (classes.length > 0 && !classes.some(c => c.id === activeClassId)) {
      setActiveClassId(classes[0].id);
    } else if (classes.length === 0 && activeClassId !== '') {
      setActiveClassId('');
    }
  }, [classes, activeClassId]);

  // Interactive Class / Cohort Creation State
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [cohortTier, setCohortTier] = useState<'school' | 'college'>(isCollege ? 'college' : 'school');
  const [cohortStandard, setCohortStandard] = useState<string>('Class 10');
  const [cohortDepartment, setCohortDepartment] = useState<string>('Computer Science & Engineering');
  const [cohortSection, setCohortSection] = useState<string>('A');
  const [cohortSubject, setCohortSubject] = useState<string>('Mathematics');
  const [cohortAcademicYear, setCohortAcademicYear] = useState<string>('2026-2027');
  const [cohortSemester, setCohortSemester] = useState<string>('Semester 5');
  const [cohortRoom, setCohortRoom] = useState<string>('Room 102');
  const [cohortCreating, setCohortCreating] = useState<boolean>(false);
  const [cohortError, setCohortError] = useState<string | null>(null);
  const [classSuccessMsg, setClassSuccessMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // --- 2. Interactive Detailed Student Roster State ---
  // Clean empty roster for new accounts; demo accounts retain sample datasets
  const [students, setStudents] = useState<any[]>(() => {
    const saved = localStorage.getItem(studentsStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // ignore
      }
    }
    return [
      // Class X-A
      { id: 1, name: 'Karthik Sharma', email: 'karthik.sharma@kv.edu.in', rollNo: '12', classId: 'class-10-a', status: 'Optimal Focus', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
      { id: 2, name: 'Pooja Patel', email: 'pooja.patel@kv.edu.in', rollNo: '24', classId: 'class-10-a', status: 'Moderate Focus', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
      { id: 3, name: 'Aarav Mehta', email: 'aarav.mehta@kv.edu.in', rollNo: '03', classId: 'class-10-a', status: 'Distracted', color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
      { id: 4, name: 'Vikram Malhotra', email: 'vikram.m@kv.edu.in', rollNo: '31', classId: 'class-10-a', status: 'Optimal Focus', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
      { id: 5, name: 'Meera Deshmukh', email: 'meera.d@kv.edu.in', rollNo: '15', classId: 'class-10-a', status: 'Optimal Focus', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },

      // Class X-B
      { id: 6, name: 'Rohan Joshi', email: 'rohan.joshi@kv.edu.in', rollNo: '28', classId: 'class-10-b', status: 'Optimal Focus', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
      { id: 7, name: 'Ananya Iyer', email: 'ananya.iyer@kv.edu.in', rollNo: '05', classId: 'class-10-b', status: 'Optimal Focus', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
      { id: 8, name: 'Sanjay Dutt', email: 'sanjay.dutt@kv.edu.in', rollNo: '11', classId: 'class-10-b', status: 'Moderate Focus', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
      { id: 9, name: 'Kiran Rao', email: 'kiran.rao@kv.edu.in', rollNo: '19', classId: 'class-10-b', status: 'Distracted', color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },

      // Class XI-Science
      { id: 10, name: 'Siddharth Nair', email: 'sid.nair@kv.edu.in', rollNo: '42', classId: 'class-11-sci', status: 'Moderate Focus', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
      { id: 11, name: 'Diya Sen', email: 'diya.sen@kv.edu.in', rollNo: '12', classId: 'class-11-sci', status: 'Optimal Focus', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
      { id: 12, name: 'Rahul Prasad', email: 'rahul.prasad@kv.edu.in', rollNo: '29', classId: 'class-11-sci', status: 'Optimal Focus', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
      { id: 13, name: 'Neha Gupta', email: 'neha.gupta@kv.edu.in', rollNo: '22', classId: 'class-11-sci', status: 'Distracted', color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
      { id: 14, name: 'Abhishek Kumar', email: 'abhishek.k@kv.edu.in', rollNo: '02', classId: 'class-11-sci', status: 'Optimal Focus', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },

      // Class XII-Commerce
      { id: 15, name: 'Varun Dhawan', email: 'varun.d@kv.edu.in', rollNo: '45', classId: 'class-12-comm', status: 'Optimal Focus', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
      { id: 16, name: 'Alia Bhatt', email: 'alia.b@kv.edu.in', rollNo: '03', classId: 'class-12-comm', status: 'Moderate Focus', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
      { id: 17, name: 'Sid Malhotra', email: 'sid.m@kv.edu.in', rollNo: '33', classId: 'class-12-comm', status: 'Optimal Focus', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
    ];
  });

  // Save classes and students
  useEffect(() => {
    localStorage.setItem(classesStorageKey, JSON.stringify(classes));
  }, [classes, classesStorageKey]);

  useEffect(() => {
    localStorage.setItem(studentsStorageKey, JSON.stringify(students));
  }, [students, studentsStorageKey]);

  // DPDP Biometric Enrollment Tracking
  const [enrolledBiometrics, setEnrolledBiometrics] = useState<Map<string, StudentBiometricRecord>>(new Map());

  const refreshBiometrics = async () => {
    try {
      const map = await getAllBiometricRecords();
      setEnrolledBiometrics(map);
    } catch (e) {
      console.warn('Failed to load biometrics in TeacherDashboard:', e);
    }
  };

  useEffect(() => {
    refreshBiometrics();
  }, [dashboardMode]);

  // --- Detailed Student Registration Signup-Style Form States ---
  const [showDetailedAddForm, setShowDetailedAddForm] = useState(false);
  const [detailedName, setDetailedName] = useState('');
  const [detailedEmail, setDetailedEmail] = useState('');
  const [detailedRollNo, setDetailedRollNo] = useState('');
  const [detailedPassword, setDetailedPassword] = useState('student123');
  const [detailedFocusBaseline, setDetailedFocusBaseline] = useState('Optimal Focus');
  const [detailedGender, setDetailedGender] = useState('Male');
  const [detailedErrors, setDetailedErrors] = useState<Record<string, string>>({});
  const [studentSuccessMsg, setStudentSuccessMsg] = useState('');

  // Photo Upload and Camera Capture state
  const [detailedAvatar, setDetailedAvatar] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraActiveRef = useRef<boolean>(cameraActive);

  useEffect(() => {
    cameraActiveRef.current = cameraActive;
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      stopCamera();
      setCameraActive(true);
      cameraActiveRef.current = true;
      const stream = await getMobileCompatibleCameraStream(facingMode, 320, 240);

      if (!cameraActiveRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      cameraStreamRef.current = stream;

      if (videoRef.current) {
        await attachStreamToVideo(videoRef.current, stream);
        if (!cameraActiveRef.current) {
          stopCamera();
        }
      } else {
        stream.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }
    } catch (err) {
      console.error("Camera access failed", err);
      alert("Could not access camera. Please upload an image file instead.");
      stopCamera();
    }
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
        setDetailedAvatar(dataUrl);
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
            setDetailedAvatar(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            setDetailedAvatar(rawResult);
          }
        };
        img.onerror = () => setDetailedAvatar(rawResult);
        img.src = rawResult;
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle detailed student sign-up style registration
  const handleDetailedStudentAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!detailedName.trim()) {
      errors.name = 'Full Name is required';
    }
    if (!detailedEmail.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(detailedEmail)) {
      errors.email = 'Enter a valid email address';
    }
    if (!detailedRollNo.trim()) {
      errors.rollNo = 'Roll Number is required';
    } else {
      // Check for uniqueness of Roll No inside the active class
      const isDuplicate = students.some(
        s => s.classId === activeClassId && s.rollNo.trim().toLowerCase() === detailedRollNo.trim().toLowerCase()
      );
      if (isDuplicate) {
        errors.rollNo = `Roll No ${detailedRollNo} is already assigned in this class`;
      }
    }
    if (!detailedPassword || detailedPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setDetailedErrors(errors);
      return;
    }

    setDetailedErrors({});

    const statusColors: Record<string, string> = {
      'Optimal Focus': 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      'Moderate Focus': 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      'Distracted': 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    };

    const newStudent = {
      id: Date.now(),
      name: detailedName.trim(),
      email: detailedEmail.trim(),
      rollNo: detailedRollNo.trim(),
      classId: activeClassId,
      status: detailedFocusBaseline,
      color: statusColors[detailedFocusBaseline] || 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      avatar: detailedAvatar || undefined,
    };

    setStudents([newStudent, ...students]);

    // Increment Class Strength count
    setClasses(classes.map(c => c.id === activeClassId ? { ...c, strength: c.strength + 1 } : c));

    // Success State
    setStudentSuccessMsg(`Successfully registered "${detailedName}" (Roll No. ${detailedRollNo}) with password credentials!`);

    // Reset Form
    setDetailedName('');
    setDetailedEmail('');
    setDetailedRollNo('');
    setDetailedPassword('student123');
    setDetailedFocusBaseline('Optimal Focus');
    setDetailedAvatar(null);

    setTimeout(() => {
      setStudentSuccessMsg('');
    }, 5000);
  };

  const removeStudent = (id: number | string) => {
    const studentToRemove = students.find(s => s.id === id);
    if (studentToRemove) {
      setClasses(classes.map(c => c.id === studentToRemove.classId ? { ...c, strength: Math.max(0, c.strength - 1) } : c));
    }
    setStudents(students.filter(s => s.id !== id));
  };

  // Structured Cohort Creation Handler
  const handleCreateCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    setCohortCreating(true);
    setCohortError(null);
    try {
      const isSchoolCohort = cohortTier === 'school';
      const cohortName = isSchoolCohort
        ? `${cohortStandard}-${cohortSection} (${cohortSubject})`
        : `${cohortDepartment.split(' ')[0]} ${cohortSemester} Sec ${cohortSection} (${cohortSubject})`;

      const payload = {
        tier: cohortTier,
        name: cohortName,
        standard: isSchoolCohort ? cohortStandard : undefined,
        department: !isSchoolCohort ? cohortDepartment : undefined,
        academicYear: cohortAcademicYear,
        semester: !isSchoolCohort ? cohortSemester : undefined,
        section: cohortSection,
        subject: cohortSubject,
        room: cohortRoom.trim() || 'Room 101',
      };

      let newCode = `${isSchoolCohort ? 'SCH' : 'COL'}${cohortSection}${Math.floor(10 + Math.random() * 90)}`;
      let createdCohort: any = null;

      try {
        const res = await api.cohorts.create(payload);
        createdCohort = res.cohort;
        if (createdCohort?.code) newCode = createdCohort.code;
      } catch (err: any) {
        console.warn('Backend cohort creation fallback:', err);
      }

      const newId = createdCohort?.id || `class-${Date.now()}`;
      const newClassItem = {
        id: newId,
        code: newCode,
        name: createdCohort?.name || cohortName,
        room: createdCohort?.room || cohortRoom.trim() || 'Room 101',
        strength: 0,
        year: cohortAcademicYear,
        tier: cohortTier,
        standard: isSchoolCohort ? cohortStandard : undefined,
        department: !isSchoolCohort ? cohortDepartment : undefined,
        section: cohortSection,
        subject: cohortSubject,
      };

      setClasses(prev => [newClassItem, ...prev]);
      setActiveClassId(newId);
      setShowAddClassForm(false);
      setClassSuccessMsg(`Successfully initialized "${newClassItem.name}" with Join Code: ${newClassItem.code}!`);
      setTimeout(() => setClassSuccessMsg(''), 5000);
    } catch (err: any) {
      setCohortError(err.message || 'Failed to create cohort');
    } finally {
      setCohortCreating(false);
    }
  };

  // --- 3. Room Mode / 5-Cam Live Grid State ---
  const [isRoomTracking, setIsRoomTracking] = useState(false);
  const [gazeAlertSound, setGazeAlertSound] = useState(false);

  // Auto-identification status map for registered students
  const [autoTrackedMap, setAutoTrackedMap] = useState<
    Record<string | number, { matched: boolean; score: number; gaze: string; confidence: number }>
  >({});
  const [unknownDetectedInRoom, setUnknownDetectedInRoom] = useState<number>(0);

  const handleAutoTrackingUpdate = (
    updates: Record<string | number, { matched: boolean; score: number; gaze: string; confidence: number }>,
    unknownCount: number
  ) => {
    setAutoTrackedMap(updates);
    setUnknownDetectedInRoom(unknownCount);

    const updatedCams: Record<string | number, number> = {};
    Object.entries(updates).forEach(([studentId, data]) => {
      if (data.matched) {
        updatedCams[studentId] = data.score;
      }
    });

    if (Object.keys(updatedCams).length > 0) {
      setRoomCamsFocus(updatedCams);
    }
  };

  // Real-time scores for Room Cams focus averaging
  const [roomCamsFocus, setRoomCamsFocus] = useState<Record<string | number, number>>({
    'cam-1': 94,
    'cam-2': 81,
    'cam-3': 52,
    'cam-4': 85,
    'cam-5': 92,
  });

  const handleCamStatusChange = (id: string | number, status: string, score: number) => {
    setRoomCamsFocus(prev => ({
      ...prev,
      [id]: score
    }));

    if (gazeAlertSound && status === 'Distracted' && score < 50) {
      console.log('ALERT BUZZER: Distracted student detected - Gaze Shift!');
    }
  };

  // Live per-device telemetry subscription from student cameras
  useEffect(() => {
    const unsubscribe = subscribeToTelemetry('default_class', (packet) => {
      setAutoTrackedMap((prev) => ({
        ...prev,
        [packet.studentId]: {
          matched: true,
          score: packet.focusScore,
          gaze: packet.state,
          confidence: 95,
        },
      }));
      setRoomCamsFocus((prev) => ({
        ...prev,
        [packet.studentId]: packet.focusScore,
      }));
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Get active class details
  const activeClass = classes.find(c => c.id === activeClassId) || classes[0] || {
    id: '',
    code: isCollege ? 'CS301-B' : 'KV10-A',
    name: 'No Class Selected',
    room: '-',
    strength: 0,
    year: '2026-2027',
    tier: isCollege ? 'college' : 'school',
    subject: 'General',
  };

  // Helper to get students for the active class (auto-padded with demo profiles ONLY for demo accounts)
  const getTestingStudents = (classId: string) => {
    if (!classId) return [];
    const classStudents = students.filter(s => s.classId === classId);
    if (classStudents.length >= 5) {
      return classStudents;
    }
    const padded = [...classStudents];

    // Selection of realistic Indianised student profile templates (for Demo mode only)
    const placeholderPool = [
      { name: 'Karthik Sharma', email: 'karthik.sharma@kv.edu.in', rollNo: '12' },
      { name: 'Pooja Patel', email: 'pooja.patel@kv.edu.in', rollNo: '24' },
      { name: 'Aarav Mehta', email: 'aarav.mehta@kv.edu.in', rollNo: '03' },
      { name: 'Rohan Deshmukh', email: 'rohan.d@kv.edu.in', rollNo: '18' },
      { name: 'Ananya Iyer', email: 'ananya.iyer@kv.edu.in', rollNo: '05' },
      { name: 'Meera Deshmukh', email: 'meera.d@kv.edu.in', rollNo: '15' },
      { name: 'Vikram Malhotra', email: 'vikram.m@kv.edu.in', rollNo: '31' },
      { name: 'Siddharth Nair', email: 'sid.nair@kv.edu.in', rollNo: '42' },
      { name: 'Kiran Rao', email: 'kiran.rao@kv.edu.in', rollNo: '19' }
    ];

    let index = 0;
    while (padded.length < 5 && index < placeholderPool.length) {
      const candidate = placeholderPool[index];
      if (!padded.some(s => s.name === candidate.name)) {
        padded.push({
          id: `placeholder-${index}-${classId}`,
          name: candidate.name,
          email: candidate.email,
          rollNo: candidate.rollNo,
          classId: classId,
          status: 'Optimal Focus',
          color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
        });
      }
      index++;
    }
    return padded.slice(0, 5);
  };

  // Calculate live classroom focus average dynamically
  const liveClassFocusAvg = Math.round(
    (Object.values(roomCamsFocus) as number[]).reduce((sum: number, score: number) => sum + score, 0) /
    Math.max(1, Object.keys(roomCamsFocus).length)
  );

  // --- Teacher Configurable Tracking Timer & Class Diagnostic Reports State ---
  const [teacherDiagDuration, setTeacherDiagDuration] = useState<number>(30); // in minutes
  const [teacherCustomDurationInput, setTeacherCustomDurationInput] = useState<string>('');
  const [teacherIsCustomDuration, setTeacherIsCustomDuration] = useState<boolean>(false);
  const [teacherDiagTimeLeft, setTeacherDiagTimeLeft] = useState<number>(30 * 60); // seconds
  const [teacherStartTimestamp, setTeacherStartTimestamp] = useState<number | null>(null);

  // Modal & Latest Class Report State
  const [latestClassReport, setLatestClassReport] = useState<ClassDiagnosticReport | null>(null);
  const [showTeacherReportModal, setShowTeacherReportModal] = useState<boolean>(false);
  const [viewingClassHistoryReport, setViewingClassHistoryReport] = useState<ClassDiagnosticReport | null>(null);

  // Class Report History initialized from user-scoped localStorage or fallback defaults
  const [classReportHistory, setClassReportHistory] = useState<ClassDiagnosticReport[]>(() => {
    const saved = localStorage.getItem(reportsStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // ignore
      }
    }
    // New non-demo educator accounts start clean with 0 records
    if (!isDemo) {
      return [];
    }

    const savedGlobal = localStorage.getItem('cognilearn_teacher_diagnostic_history');
    if (savedGlobal) {
      try {
        return JSON.parse(savedGlobal);
      } catch (e) {
        // ignore
      }
    }

    return [
      {
        id: 'class-diag-hist-1',
        classId: 'class-10-a',
        className: 'Class X-A',
        sessionTitle: 'Mathematics Focus Assessment Block',
        date: '08 Aug 2026',
        timestamp: Date.now() - 86400000,
        configuredDurationMinutes: 30,
        actualDurationSeconds: 1800,
        status: 'Completed',
        studentsCount: 5,
        avgClassFocus: 87,
        peakClassFocus: 95,
        distractedStudentsCount: 1,
        optimalStudentsCount: 4,
        classObservations: [
          'Class X-A demonstrated high focus coherence across all 5 live telemetry feeds.',
          'Average class focus score peaked at 95% during the mid-session problem solving interval.',
        ],
        classRecommendations: [
          'Maintain 30-minute structured diagnostic blocks for Class X-A.',
          'Conduct 2-minute visual stretch rest before introducing complex geometry topics.',
        ],
        studentReports: [
          {
            id: 'std-rep-1',
            studentId: 1,
            studentName: 'Karthik Sharma',
            sessionTitle: 'Mathematics Focus Assessment Block',
            date: '08 Aug 2026',
            timestamp: Date.now() - 86400000,
            configuredDurationMinutes: 30,
            actualDurationSeconds: 1800,
            status: 'Completed',
            metrics: {
              avgFocusScore: 94,
              peakFocusScore: 98,
              minFocusScore: 88,
              optimalFocusPercent: 90,
              moderateFocusPercent: 8,
              distractedPercent: 2,
              gazeShiftsCount: 2,
              meshQuality: 'Optimal (68 Coordinates)',
            },
            observations: ['Exceptional gaze stability and mesh tracking lock.'],
            recommendations: ['Eligible for advanced problem solving tracks.'],
          },
          {
            id: 'std-rep-2',
            studentId: 2,
            studentName: 'Pooja Patel',
            sessionTitle: 'Mathematics Focus Assessment Block',
            date: '08 Aug 2026',
            timestamp: Date.now() - 86400000,
            configuredDurationMinutes: 30,
            actualDurationSeconds: 1800,
            status: 'Completed',
            metrics: {
              avgFocusScore: 81,
              peakFocusScore: 89,
              minFocusScore: 70,
              optimalFocusPercent: 78,
              moderateFocusPercent: 15,
              distractedPercent: 7,
              gazeShiftsCount: 4,
              meshQuality: 'Optimal (68 Coordinates)',
            },
            observations: ['Good consistency with occasional screen-edge gaze shifts.'],
            recommendations: ['Encourage brief rest breaks between sets.'],
          },
          {
            id: 'std-rep-3',
            studentId: 3,
            studentName: 'Aarav Mehta',
            sessionTitle: 'Mathematics Focus Assessment Block',
            date: '08 Aug 2026',
            timestamp: Date.now() - 86400000,
            configuredDurationMinutes: 30,
            actualDurationSeconds: 1800,
            status: 'Completed',
            metrics: {
              avgFocusScore: 52,
              peakFocusScore: 68,
              minFocusScore: 40,
              optimalFocusPercent: 45,
              moderateFocusPercent: 25,
              distractedPercent: 30,
              gazeShiftsCount: 9,
              meshQuality: 'Moderate (68 Coordinates)',
            },
            observations: ['Recorded 9 distraction alerts due to frequent off-screen gaze shifts.'],
            recommendations: ['Consider seat repositioning closer to front board area.'],
          },
        ],
      },
    ];
  });

  const [deleteReportTarget, setDeleteReportTarget] = useState<{ id: string; title: string } | null>(null);
  const [showClearAllReportsModal, setShowClearAllReportsModal] = useState<boolean>(false);

  // Save teacher history to user-scoped localStorage
  useEffect(() => {
    localStorage.setItem(reportsStorageKey, JSON.stringify(classReportHistory));
  }, [classReportHistory, reportsStorageKey]);

  const handleDeleteClassReport = (reportId: string) => {
    setClassReportHistory((prev) => {
      const updated = prev.filter((item) => item.id !== reportId);
      localStorage.setItem(reportsStorageKey, JSON.stringify(updated));
      return updated;
    });
    if (viewingClassHistoryReport?.id === reportId) {
      setViewingClassHistoryReport(null);
    }
    if (latestClassReport?.id === reportId) {
      setLatestClassReport(null);
    }
    setDeleteReportTarget(null);
  };

  const handleConfirmClearAllClassReports = () => {
    setClassReportHistory([]);
    localStorage.removeItem(reportsStorageKey);
    setViewingClassHistoryReport(null);
    setLatestClassReport(null);
    setShowClearAllReportsModal(false);
  };

  // Handle Starting Classroom Diagnostic Tracking
  const handleStartClassroomDiagnostic = () => {
    const durationMins = teacherIsCustomDuration ? (parseInt(teacherCustomDurationInput, 10) || 15) : teacherDiagDuration;
    setTeacherDiagDuration(durationMins);
    setTeacherDiagTimeLeft(durationMins * 60);
    setTeacherStartTimestamp(Date.now());
    setIsRoomTracking(true);
  };

  const [isGeneratingClassroomAI, setIsGeneratingClassroomAI] = useState(false);

  // Handle Stopping Classroom Diagnostic Tracking (Automatic or Manual Stop)
  const handleStopClassroomDiagnostic = async (status: 'Completed' | 'Manually Stopped') => {
    setIsRoomTracking(false);
    setIsGeneratingClassroomAI(true);
    const now = Date.now();
    const startTime = teacherStartTimestamp || now;
    const elapsedSeconds = Math.max(1, Math.round((now - startTime) / 1000));

    const testingStudents = getTestingStudents(activeClassId);

    // Generate individual student reports for all students in the active class session
    const studentReports: StudentDiagnosticReport[] = testingStudents.map((student, idx) => {
      const studentFocusScore = roomCamsFocus[`cam-${idx + 1}`] || 85;
      return {
        id: `std-diag-${student.id}-${Date.now()}`,
        studentId: student.id,
        studentName: student.name,
        sessionTitle: `${activeClass.name} Diagnostic Session`,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        timestamp: now,
        configuredDurationMinutes: teacherDiagDuration,
        actualDurationSeconds: elapsedSeconds,
        status,
        metrics: {
          avgFocusScore: studentFocusScore,
          peakFocusScore: Math.min(99, studentFocusScore + 8),
          minFocusScore: Math.max(45, studentFocusScore - 15),
          optimalFocusPercent: Math.round(studentFocusScore * 0.85),
          moderateFocusPercent: Math.round((100 - studentFocusScore) * 0.6),
          distractedPercent: Math.max(0, 100 - Math.round(studentFocusScore * 0.85) - Math.round((100 - studentFocusScore) * 0.6)),
          gazeShiftsCount: studentFocusScore < 60 ? 8 : 3,
          meshQuality: 'Optimal (68 Coordinates)',
        },
        observations: [
          `Maintained average focus index of ${studentFocusScore}% during class tracking block.`,
          `Live face mesh vector telemetry stayed synchronized.`,
        ],
        recommendations: [
          studentFocusScore < 60
            ? 'Provide individualized feedback on off-screen distractions.'
            : 'Sustaining optimal focus; keep up current study routine.',
        ],
      };
    });

    const distractedStudentsCount = studentReports.filter(s => s.metrics.avgFocusScore < 60).length;
    const optimalStudentsCount = studentReports.filter(s => s.metrics.avgFocusScore >= 80).length;

    let classObservations = [
      `${activeClass.name} achieved a live classroom focus average of ${liveClassFocusAvg}% across ${testingStudents.length} monitored camera channels.`,
      `Class session status recorded as ${status} after ${Math.floor(elapsedSeconds / 60)} minutes and ${elapsedSeconds % 60} seconds.`,
    ];
    let classRecommendations = [
      'Review individual student distraction logs for pupils below 60% focus.',
      'Incorporate 3-minute mental refresh breaks between dense lecture segments.',
    ];

    try {
      const aiRes = await api.report.generateAIReport({
        isClassroom: true,
        telemetry: {
          className: activeClass.name,
          studentsCount: testingStudents.length,
          configuredDurationMinutes: teacherDiagDuration,
          actualDurationSeconds: elapsedSeconds,
          status,
          avgClassFocus: liveClassFocusAvg,
          peakClassFocus: Math.min(99, liveClassFocusAvg + 8),
          distractedStudentsCount,
          optimalStudentsCount,
        },
      });

      if (aiRes?.aiGenerated && aiRes?.report) {
        if (Array.isArray(aiRes.report.classObservations) && aiRes.report.classObservations.length > 0) {
          classObservations = aiRes.report.classObservations;
        }
        if (Array.isArray(aiRes.report.classRecommendations) && aiRes.report.classRecommendations.length > 0) {
          classRecommendations = aiRes.report.classRecommendations;
        }
      }
    } catch (err) {
      console.warn('[CogniLearn] Classroom AI report call failed or unavailable; using fallback rules:', err);
    } finally {
      setIsGeneratingClassroomAI(false);
    }

    const classReport: ClassDiagnosticReport = {
      id: `class-diag-${Date.now()}`,
      classId: activeClassId,
      className: activeClass.name,
      sessionTitle: `${activeClass.name} Focus Assessment`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timestamp: now,
      configuredDurationMinutes: teacherDiagDuration,
      actualDurationSeconds: elapsedSeconds,
      status,
      studentsCount: testingStudents.length,
      avgClassFocus: liveClassFocusAvg,
      peakClassFocus: Math.min(99, liveClassFocusAvg + 8),
      distractedStudentsCount,
      optimalStudentsCount,
      classObservations,
      classRecommendations,
      studentReports,
    };

    setLatestClassReport(classReport);
    setClassReportHistory(prev => [classReport, ...prev]);
    setShowTeacherReportModal(true);
  };

  // Countdown effect for teacher room tracking
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRoomTracking) {
      timer = setInterval(() => {
        setTeacherDiagTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleStopClassroomDiagnostic('Completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRoomTracking, teacherStartTimestamp, liveClassFocusAvg, teacherDiagDuration, activeClassId, roomCamsFocus]);

  const formatTeacherCountdown = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- 4. Interactive Subjects State ---
  const [subjects, setSubjects] = useState<string[]>(() => {
    if (user?.teacherProfile?.primarySubjects && user.teacherProfile.primarySubjects.length > 0) {
      return [...user.teacherProfile.primarySubjects];
    }
    if (isCollege) {
      const dept = user?.teacherProfile?.tier === 'college' ? user.teacherProfile.department : user?.department;
      return getCollegeSubjects(dept).slice(0, 5);
    }
    return ['Mathematics', 'Physics', 'Chemistry', 'English Literature'];
  });
  const [newSubject, setNewSubject] = useState('');

  const addSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    if (subjects.includes(newSubject.trim())) return;
    setSubjects([...subjects, newSubject.trim()]);
    setNewSubject('');
  };

  const removeSubject = (sub: string) => {
    setSubjects(subjects.filter(s => s !== sub));
  };

  // --- 5. Interactive Reports View State ---
  const [activeReportView, setActiveReportView] = useState<'class' | 'weekly' | 'subject'>('class');

  // --- 6. Interactive Settings State ---
  const [strictCalibration, setStrictCalibration] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [cameraSensitivity, setCameraSensitivity] = useState(6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-slate-900 dark:text-slate-100 bg-transparent transition-colors duration-200" id="teacher-dashboard-container">
      {/* Welcome Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] font-semibold font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            [TEACHER PORTAL]
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mt-3">
            Welcome Back, {teacherName}
          </h1>
          <p className="text-xs mt-1 text-slate-600 dark:text-slate-400 font-medium">
            Monitor focus diagnostics, student learning pathways, and coordinate curriculum tracking.
          </p>
        </div>

        {/* Institution Info Card */}
        <div className="saas-card flex items-center space-x-3 p-3.5 rounded-xl self-start">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            {isCollege ? <Building2 className="h-5 w-5" /> : <School className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider font-mono text-slate-500 dark:text-slate-400">Institution</p>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              {user?.teacherProfile?.institutionName || (isDemo ? (isCollege ? 'National Institute of Technology' : 'Kendriya Vidyalaya No. 1') : 'Academic Institution')}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="saas-card p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 rounded-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xl tracking-tight shadow-md shrink-0">
            {teacherName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{teacherName}</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                {user?.teacherProfile?.role || teacherType}
              </span>
              <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold border ${
                isCollege
                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
                  : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20'
              }`}>
                {isCollege ? <Building2 className="h-3 w-3" /> : <School className="h-3 w-3" />}
                <span>{isCollege ? 'Higher Education Faculty' : 'School Educator (6–12)'}</span>
              </span>
            </div>
            <p className="text-xs font-mono font-medium mt-1 text-slate-500 dark:text-slate-400">
              {teacherEmail} • <span className="text-slate-700 dark:text-slate-300">
                {isCollege ? (user?.teacherProfile?.tier === 'college' ? user.teacherProfile.department : 'Computer Science & Engineering') : `Board: ${user?.teacherProfile?.tier === 'school' ? user.teacherProfile.board || 'CBSE' : 'CBSE'}`}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-mono font-medium uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all cursor-pointer self-start sm:self-center"
          id="teacher-dashboard-logout"
        >
          <LogOut className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          <span>Logout</span>
        </button>
      </div>

      {/* Mode View Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 gap-6 font-mono text-xs uppercase tracking-wider">
        <button
          onClick={() => setDashboardMode('overview')}
          className={`pb-4 px-1 font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${dashboardMode === 'overview'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          id="tab-overview"
        >
          <Sliders className="h-4 w-4" />
          <span>Overview Dashboard</span>
        </button>
        <button
          onClick={() => setDashboardMode('room')}
          className={`pb-4 px-1 font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${dashboardMode === 'room'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          id="tab-room-mode"
        >
          <Video className="h-4 w-4" />
          <span className="flex items-center gap-2">
            Classroom Room Mode
            <span className="bg-indigo-600 text-white dark:bg-indigo-500 dark:text-slate-950 font-mono text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase">Live Feed</span>
          </span>
        </button>
      </div>

      {/* Dynamic Success notifications */}
      {classSuccessMsg && (
        <div className="mb-6 p-4 rounded-xl flex items-center space-x-2 animate-fade-in text-xs font-mono font-bold border bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-200 shadow-xs">
          <CheckCircle2 className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{classSuccessMsg}</span>
        </div>
      )}

      {/* Render selected dashboard view */}
      {dashboardMode === 'overview' ? (
        <div className="space-y-8">
          {/* Notice Banner */}
          {showNotice && (
            <div className="mb-8 p-5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/80 dark:bg-indigo-950/40 relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex items-start space-x-3.5">
                <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg shrink-0 mt-0.5 border border-indigo-200 dark:border-indigo-500/40">
                  <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-sm sm:text-base tracking-tight font-heading text-indigo-950 dark:text-white">CogniLearn Focus System Active</p>
                  <p className="text-xs mt-0.5 font-sans leading-relaxed font-medium text-indigo-900/80 dark:text-slate-300">
                    The multiple classroom manager, student registers, and 5-Cam live room-mode focus simulator are configured.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNotice(false)}
                className="text-indigo-700 dark:text-indigo-300 hover:text-indigo-950 dark:hover:text-white text-[10px] font-mono font-bold tracking-wider uppercase shrink-0 self-start sm:self-center cursor-pointer border border-indigo-200 dark:border-indigo-500/40 px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Classroom Selector Hub Card */}
          <div className="saas-card p-6 sm:p-8 rounded-xl shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center space-x-2">
                  <School className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                  <span>My Active Classrooms</span>
                </h3>
                <p className="text-xs mt-1 font-sans text-slate-600 dark:text-slate-300">
                  Select, coordinate, and register rosters for different academic segments.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <select
                    value={activeClassId}
                    onChange={(e) => {
                      setActiveClassId(e.target.value);
                      setShowDetailedAddForm(false);
                    }}
                    className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 font-bold outline-none cursor-pointer pr-8 appearance-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 transition-colors shadow-xs"
                  >
                    {classes.length === 0 ? (
                      <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        No Classes Created (Click '+ New Class')
                      </option>
                    ) : (
                      classes.map(c => (
                        <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {c.name} ({c.room})
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="h-4 w-4 absolute right-2.5 top-3.5 pointer-events-none text-slate-400" />
                </div>

                <button
                  onClick={() => setShowAddClassForm(!showAddClassForm)}
                  className="text-xs font-mono font-bold uppercase tracking-wider rounded-lg px-4 py-2.5 flex items-center space-x-1 transition-all cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 border-none"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Class</span>
                </button>
              </div>
            </div>

            {/* Expander to create a classroom cohort */}
            {showAddClassForm && (
              <form onSubmit={handleCreateCohort} className="mt-6 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-4 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Initialize Academic Cohort</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Generates unique 6-character Join Code</span>
                </div>

                {cohortError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{cohortError}</span>
                  </div>
                )}                {/* Track Selector */}
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">
                    Institution Tier / Track
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCohortTier('school')}
                      className={`p-2.5 rounded-lg border text-left flex items-center space-x-2 cursor-pointer transition-all ${
                        cohortTier === 'school'
                          ? 'bg-indigo-600/10 dark:bg-indigo-600/20 border-indigo-500 text-indigo-950 dark:text-white font-bold'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <School className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div>
                        <p className="font-bold text-xs">School Track</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Classes 6 to 12</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCohortTier('college')}
                      className={`p-2.5 rounded-lg border text-left flex items-center space-x-2 cursor-pointer transition-all ${
                        cohortTier === 'college'
                          ? 'bg-purple-600/10 dark:bg-purple-600/20 border-purple-500 text-purple-950 dark:text-white font-bold'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <div>
                        <p className="font-bold text-xs">College Track</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Higher Education</p>
                      </div>
                    </button>
                  </div>
                </div>

                {cohortTier === 'school' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">Standard / Grade</label>
                      <select
                        value={cohortStandard}
                        onChange={(e) => {
                          setCohortStandard(e.target.value);
                          const subjects = SCHOOL_STANDARDS_AND_SUBJECTS[e.target.value as keyof typeof SCHOOL_STANDARDS_AND_SUBJECTS] || [];
                          if (subjects.length > 0) setCohortSubject(subjects[0]);
                        }}
                        className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 outline-none font-medium focus:ring-1 focus:ring-indigo-500"
                      >
                        {Object.keys(SCHOOL_STANDARDS_AND_SUBJECTS).map((std) => (
                          <option key={std} value={std}>{std}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">Section</label>
                      <select
                        value={cohortSection}
                        onChange={(e) => setCohortSection(e.target.value)}
                        className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 outline-none font-medium focus:ring-1 focus:ring-indigo-500"
                      >
                        {['A', 'B', 'C', 'D', 'E'].map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">Subject</label>
                      <select
                        value={cohortSubject}
                        onChange={(e) => setCohortSubject(e.target.value)}
                        className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 outline-none font-medium focus:ring-1 focus:ring-indigo-500"
                      >
                        {(SCHOOL_STANDARDS_AND_SUBJECTS[cohortStandard as keyof typeof SCHOOL_STANDARDS_AND_SUBJECTS] || ['Mathematics', 'Science', 'English']).map(subj => (
                          <option key={subj} value={subj}>{subj}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">Department</label>
                      <select
                        value={cohortDepartment}
                        onChange={(e) => setCohortDepartment(e.target.value)}
                        className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 outline-none font-medium focus:ring-1 focus:ring-indigo-500 truncate"
                      >
                        {COLLEGE_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">Semester & Section</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={cohortSemester}
                          onChange={(e) => setCohortSemester(e.target.value)}
                          className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-2 py-2.5 outline-none font-medium focus:ring-1 focus:ring-indigo-500"
                        >
                          {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'].map(sem => (
                            <option key={sem} value={sem}>{sem}</option>
                          ))}
                        </select>
                        <select
                          value={cohortSection}
                          onChange={(e) => setCohortSection(e.target.value)}
                          className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-2 py-2.5 outline-none font-medium focus:ring-1 focus:ring-indigo-500"
                        >
                          {['A', 'B', 'C', 'D'].map(sec => <option key={sec} value={sec}>Sec {sec}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">Course / Subject</label>
                      <input
                        type="text"
                        required
                        value={cohortSubject}
                        onChange={(e) => setCohortSubject(e.target.value)}
                        placeholder="e.g. Operating Systems"
                        className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 outline-none font-medium focus:ring-1 focus:ring-indigo-500"
                      >
                      </input>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">Room / Lab Number</label>
                    <input
                      type="text"
                      placeholder="e.g. Room 204 or Systems Lab 3"
                      value={cohortRoom}
                      onChange={(e) => setCohortRoom(e.target.value)}
                      className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 outline-none font-medium focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">Academic Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026-2027"
                      value={cohortAcademicYear}
                      onChange={(e) => setCohortAcademicYear(e.target.value)}
                      className="w-full text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2.5 outline-none font-medium focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 text-indigo-900 dark:text-slate-200 text-[11px] flex items-center justify-between">
                  <span>
                    Cohort Name: <strong className="text-indigo-950 dark:text-white font-mono">{cohortTier === 'school' ? `${cohortStandard}-${cohortSection} (${cohortSubject})` : `${cohortDepartment.split(' ')[0]} ${cohortSemester} Sec ${cohortSection} (${cohortSubject})`}</strong>
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-bold">Unique Join Code auto-allocated</span>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddClassForm(false)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-mono uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cohortCreating}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer font-mono uppercase tracking-wider shadow-md transition-colors flex items-center space-x-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{cohortCreating ? 'Creating...' : 'Initialize Cohort'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Quick overview metric pills for selected class */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/50 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider block text-slate-500 dark:text-slate-400">Class Segment</span>
                <span className="font-bold text-sm mt-1 block text-slate-900 dark:text-white truncate">{activeClass.name}</span>
              </div>
              <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/30 shadow-xs hover:border-indigo-300 transition-colors">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider block text-indigo-700 dark:text-indigo-300">Join Code</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{activeClass.code || 'KV10-A'}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(activeClass.code || 'KV10-A')}
                    className="p-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-white transition-colors cursor-pointer"
                    title="Copy 6-char Class Code for Students"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider block text-slate-500 dark:text-slate-400">Assigned Location</span>
                <span className="font-bold text-sm mt-1 block text-slate-900 dark:text-white truncate">{activeClass.room}</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider block text-slate-500 dark:text-slate-400">Active Pupils</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-1 block font-mono">{students.filter(s => s.classId === activeClassId).length} Registered</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider block text-slate-500 dark:text-slate-400">Track & Session</span>
                <span className="font-bold text-sm mt-1 block text-slate-900 dark:text-white truncate">
                  {activeClass.tier === 'college' ? 'Higher Ed' : 'School 6–12'} • {activeClass.year || '2026-2027'}
                </span>
              </div>
            </div>
          </div>

          {/* Grid of 4 Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1: Students */}
            <div className="saas-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" id="card-teacher-students">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-12 w-12 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                  <button
                    onClick={() => setShowDetailedAddForm(!showDetailedAddForm)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg cursor-pointer shadow-xs transition-all bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Add Student</span>
                  </button>
                </div>

                <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Student Roster</h3>
                <p className="mt-2 text-xs leading-relaxed font-sans font-medium text-slate-600 dark:text-slate-400">
                  Manage student profiles for <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{activeClass.name}</strong>, assign unique roll credentials, and monitor baseline indexes.
                </p>

                {/* Registration detailed state alert banner */}
                {studentSuccessMsg && (
                  <div className="mt-4 text-[10px] p-3.5 rounded-xl flex items-start space-x-2 animate-fade-in font-mono font-bold border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{studentSuccessMsg}</span>
                  </div>
                )}

                {/* Expanded signup-style form */}
                {showDetailedAddForm && (
                  <form onSubmit={handleDetailedStudentAdd} className="mt-6 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 animate-fade-in text-xs bg-slate-50 dark:bg-slate-900/60">
                    <div className="flex items-center justify-between border-b pb-2 font-mono text-[10px] uppercase tracking-widest border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5">
                        <UserPlus className="h-4 w-4" />
                        <span>Add Student (Registration Flow)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowDetailedAddForm(false)}
                        className="font-bold cursor-pointer text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
                      >
                        Collapse
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Name input */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">Full Student Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Karthik Sharma"
                          value={detailedName}
                          onChange={(e) => setDetailedName(e.target.value)}
                          className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 outline-none font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                        />
                        {detailedErrors.name && (
                          <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-0.5">
                            <AlertCircle className="h-3 w-3" /> {detailedErrors.name}
                          </p>
                        )}
                      </div>

                      {/* Email input */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">Email Address</label>
                        <input
                          type="email"
                          placeholder="e.g. karthik.sharma@kv.edu.in"
                          value={detailedEmail}
                          onChange={(e) => setDetailedEmail(e.target.value)}
                          className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 outline-none font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                        />
                        {detailedErrors.email && (
                          <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-0.5">
                            <AlertCircle className="h-3 w-3" /> {detailedErrors.email}
                          </p>
                        )}
                      </div>

                      {/* Roll Number input */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">Roll Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 12"
                          value={detailedRollNo}
                          onChange={(e) => setDetailedRollNo(e.target.value)}
                          className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 outline-none font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                        />
                        {detailedErrors.rollNo && (
                          <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-0.5">
                            <AlertCircle className="h-3 w-3" /> {detailedErrors.rollNo}
                          </p>
                        )}
                      </div>

                      {/* Password input */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">Set Password (Min 6 Chars)</label>
                        <input
                          type="password"
                          placeholder="student123"
                          value={detailedPassword}
                          onChange={(e) => setDetailedPassword(e.target.value)}
                          className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 outline-none font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                        />
                        {detailedErrors.password && (
                          <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-0.5">
                            <AlertCircle className="h-3 w-3" /> {detailedErrors.password}
                          </p>
                        )}
                      </div>

                      {/* Gender select */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">Gender</label>
                        <select
                          value={detailedGender}
                          onChange={(e) => setDetailedGender(e.target.value)}
                          className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 outline-none font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Male" className={isDark ? 'bg-[#0F172A]' : 'bg-white'}>Male</option>
                          <option value="Female" className={isDark ? 'bg-[#0F172A]' : 'bg-white'}>Female</option>
                          <option value="Other" className={isDark ? 'bg-[#0F172A]' : 'bg-white'}>Other</option>
                        </select>
                      </div>

                      {/* Initial Focus baseline */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 text-slate-700 dark:text-slate-300">Focus Baseline</label>
                        <select
                          value={detailedFocusBaseline}
                          onChange={(e) => setDetailedFocusBaseline(e.target.value)}
                          className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 outline-none font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Optimal Focus" className={isDark ? 'bg-[#0F172A]' : 'bg-white'}>Optimal Focus</option>
                          <option value="Moderate Focus" className={isDark ? 'bg-[#0F172A]' : 'bg-white'}>Moderate Focus</option>
                          <option value="Distracted" className={isDark ? 'bg-[#0F172A]' : 'bg-white'}>Distracted</option>
                        </select>
                      </div>
                    </div>

                    {/* AI Facial Recognition Enrollment Section */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 mt-2 bg-white dark:bg-slate-900">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1.5 mb-3">
                        <Camera className="h-4 w-4" />
                        <span>AI Face Model Enrollment (Snapshot Photo)</span>
                      </h4>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Profile Photo Preview Circle */}
                        <div className="relative shrink-0">
                          {detailedAvatar ? (
                            <div className="relative">
                              <img
                                src={detailedAvatar}
                                alt="Student Snapshot"
                                className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-sm"
                                referrerPolicy="no-referrer"
                              />
                              <button
                                type="button"
                                onClick={() => setDetailedAvatar(null)}
                                className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 shadow-sm text-xs leading-none cursor-pointer w-5 h-5 flex items-center justify-center font-bold"
                                title="Remove Image"
                              >
                                &times;
                              </button>
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-full border-2 border-dashed flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400">
                              <UserPlus className="h-6 w-6 mb-1" />
                              <span className="text-[8px] font-mono uppercase tracking-widest font-bold">No Photo</span>
                            </div>
                          )}
                        </div>

                        {/* Control Interface: Camera Capture & File Upload */}
                        <div className="flex-1 w-full space-y-3.5">
                          {cameraActive ? (
                            <div className="rounded-xl p-2 border text-center relative overflow-hidden max-w-[280px] mx-auto sm:mx-0 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                              <video
                                ref={videoRef}
                                className="w-full h-auto aspect-video rounded-lg bg-black block mx-auto"
                                playsInline
                                muted
                              />
                              <div className="flex items-center justify-center gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={capturePhoto}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-mono font-bold rounded cursor-pointer"
                                >
                                  Capture Face
                                </button>
                                <button
                                  type="button"
                                  onClick={stopCamera}
                                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-mono font-bold rounded cursor-pointer"
                                >
                                  Stop Camera
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {/* Webcam Launch */}
                              <button
                                type="button"
                                onClick={startCamera}
                                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:border-indigo-400"
                              >
                                <Camera className="h-4 w-4 mb-1 text-indigo-600 dark:text-indigo-400" />
                                <span>Webcam Photo</span>
                              </button>

                              {/* Image Upload Input */}
                              <label className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 transition-all text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer text-center bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:border-indigo-400">
                                <FileText className="h-4 w-4 mb-1 text-indigo-600 dark:text-indigo-400" />
                                <span>Upload Image</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageFileChange}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowDetailedAddForm(false)}
                        className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold font-mono uppercase tracking-wider text-[10px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 font-bold font-mono uppercase tracking-wider text-[10px] cursor-pointer shadow-xs transition-colors"
                      >
                        Save Student
                      </button>
                    </div>
                  </form>
                )}

                {/* Interactive student roster list */}
                <div className="mt-6 space-y-4">
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {students.filter(s => s.classId === activeClassId).length === 0 ? (
                      <div className="text-center py-8 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-semibold">No students registered in this segment yet.</p>
                        <button
                          onClick={() => setShowDetailedAddForm(true)}
                          className="text-indigo-600 dark:text-indigo-400 underline font-bold mt-1 block mx-auto cursor-pointer"
                        >
                          Register the first student
                        </button>
                      </div>
                    ) : (
                      students.filter(s => s.classId === activeClassId).map((s) => (
                        <div key={s.id} className="flex justify-between items-center text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            {s.avatar ? (
                              <img
                                src={s.avatar}
                                alt={s.name}
                                className="w-8 h-8 rounded-lg object-cover border border-indigo-400 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-[10px] shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                {s.rollNo}
                              </div>
                            )}
                            <div className="truncate text-left">
                              <span className="font-bold block truncate text-slate-900 dark:text-white">{s.name}</span>
                              <span className="text-[10px] block truncate font-mono text-slate-500 dark:text-slate-400">{s.email || 'no-email@student.in'}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            <span className={`px-2.5 py-1 rounded font-extrabold font-mono text-[8px] uppercase tracking-wider border ${s.color}`}>
                              {s.status}
                            </span>
                            <button
                              onClick={() => removeStudent(s.id)}
                              className="p-1 cursor-pointer rounded-lg transition-colors text-slate-400 hover:text-rose-600"
                              title="Remove Student"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                <span>Roster count: {students.filter(s => s.classId === activeClassId).length} Pupils</span>
                <span className="text-[9px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded font-bold">
                  Class: {activeClass.name}
                </span>
              </div>
            </div>

            {/* Card 2: Subjects */}
            <div className="saas-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" id="card-teacher-subjects">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-12 w-12 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    [CURRICULUM]
                  </span>
                </div>

                <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Academic Curriculum</h3>
                <p className="mt-2 text-xs leading-relaxed font-sans font-medium text-slate-600 dark:text-slate-400">
                  Define trackable focus domains, structure lecture intervals, and tag customized session tags to target course objectives.
                </p>

                {/* Interactive Subject List Planner */}
                <div className="mt-6 space-y-4">
                  <form onSubmit={addSubject} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add custom subject (e.g., Biology)..."
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="flex-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="rounded-lg px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider cursor-pointer shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors"
                    >
                      Add
                    </button>
                  </form>

                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                    {subjects.map((sub, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center transition-all bg-slate-50 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white shadow-xs">
                        <span className="text-xs font-bold truncate">{sub}</span>
                        <button
                          onClick={() => removeSubject(sub)}
                          className="p-1 rounded cursor-pointer ml-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                <span>Configured: {subjects.length} Course Domains</span>
                <ChevronRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>

            {/* Card 3: Reports */}
            <div className="saas-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" id="card-teacher-reports">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-12 w-12 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    [ANALYTICS]
                  </span>
                </div>

                <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Attention Reports</h3>
                <p className="mt-2 text-xs leading-relaxed font-sans font-medium text-slate-600 dark:text-slate-400">
                  Visualize concentration indexes, weekly attention timelines, or look at individual subject focal metrics.
                </p>

                {/* Interactive Chart/Selector */}
                <div className="mt-6 border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Metric Breakdown</span>
                    <div className="flex gap-1">
                      {(['class', 'weekly', 'subject'] as const).map((view) => (
                        <button
                          key={view}
                          onClick={() => setActiveReportView(view)}
                          className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors capitalize border ${activeReportView === view
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                        >
                          {view}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeReportView === 'class' && (
                    <div>
                      <div className="flex items-end space-x-2.5 h-16 pt-2">
                        <div className="w-full bg-indigo-300 dark:bg-indigo-500/40 rounded-t h-[40%] text-center text-[9px] font-bold text-indigo-950 dark:text-white pt-1" title="Mon: 40%">M</div>
                        <div className="w-full bg-indigo-400 dark:bg-indigo-500/60 rounded-t h-[60%] text-center text-[9px] font-bold text-white pt-1" title="Tue: 60%">T</div>
                        <div className="w-full bg-indigo-500 dark:bg-indigo-500/80 rounded-t h-[80%] text-center text-[9px] font-bold text-white pt-1" title="Wed: 80%">W</div>
                        <div className="w-full bg-indigo-600 dark:bg-indigo-500 rounded-t h-[95%] text-center text-[9px] text-white font-extrabold pt-1" title="Thu: 95%">T</div>
                        <div className="w-full bg-indigo-400 dark:bg-indigo-500/70 rounded-t h-[70%] text-center text-[9px] font-bold text-white pt-1" title="Fri: 70%">F</div>
                      </div>
                      <p className="text-[10px] font-mono mt-2 text-center font-bold text-slate-600 dark:text-slate-400">Class Focus Index (87% Peak Gaze Sync)</p>
                    </div>
                  )}

                  {activeReportView === 'weekly' && (
                    <div className="space-y-2 pt-1 text-xs font-mono font-bold">
                      <div className="flex justify-between items-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs">
                        <span>Weekly Focused:</span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">18.4 Hrs / Student</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs">
                        <span>Peak Gaze Day:</span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">Thursday (9:45 AM)</span>
                      </div>
                    </div>
                  )}

                  {activeReportView === 'subject' && (
                    <div className="space-y-2 pt-1 text-xs font-mono font-bold">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] w-14 font-mono font-bold text-slate-700 dark:text-slate-300">Math:</span>
                        <div className="flex-1 mx-2 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800">
                          <motion.div
                            className="bg-indigo-600 h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: '90%' }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                          />
                        </div>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-[10px] font-mono">90%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] w-14 font-mono font-bold text-slate-700 dark:text-slate-300">Physics:</span>
                        <div className="flex-1 mx-2 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800">
                          <motion.div
                            className="bg-indigo-600 h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: '78%' }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                          />
                        </div>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-[10px] font-mono">78%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] w-14 font-mono font-bold text-slate-700 dark:text-slate-300">Chem:</span>
                        <div className="flex-1 mx-2 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800">
                          <motion.div
                            className="bg-indigo-600 h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: '85%' }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                          />
                        </div>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-[10px] font-mono">85%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                <span>Last report update: Real-time Live</span>
                <ChevronRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>

            {/* Card 4: Settings */}
            <div className="saas-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" id="card-teacher-settings">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-12 w-12 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Settings className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    [SYSTEM]
                  </span>
                </div>

                <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">System Controls</h3>
                <p className="mt-2 text-xs leading-relaxed font-sans font-medium text-slate-600 dark:text-slate-400">
                  Adjust webcam tracking filters, diagnostic sensitivities, secure domain authentication parameters, and logging frequencies.
                </p>

                {/* Interactive Settings controls */}
                <div className="mt-6 space-y-3 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/60">
                  <div className="flex justify-between items-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs">
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-slate-900 dark:text-white">Strict Focus Calibration</span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Prunes minor eye-shifts</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStrictCalibration(!strictCalibration)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors border ${strictCalibration ? 'bg-indigo-600 border-indigo-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start'
                        }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs">
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-slate-900 dark:text-white">Daily Digest Reports</span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Email compiled classroom PDFs</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailDigest(!emailDigest)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors border ${emailDigest ? 'bg-indigo-600 border-indigo-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 justify-start'
                        }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs">
                    <div className="flex justify-between items-center mb-2 font-mono text-[10px] uppercase tracking-wider font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Calibration Sensitivity</span>
                      <span className="bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-400 font-mono font-extrabold border border-indigo-200 dark:border-indigo-800">{cameraSensitivity} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={cameraSensitivity}
                      onChange={(e) => setCameraSensitivity(Number(e.target.value))}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                <span>System State: Calibrated & Configured</span>
                <ChevronRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Classroom Room Mode 5-Cam Live Video Tracking Grid */
        <div className="space-y-8 animate-fade-in text-slate-900 dark:text-white" id="classroom-room-mode-view">
          {/* Room Mode Live HUD Control Card */}
          <div className="saas-card rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                    <Camera className="h-3.5 w-3.5" />
                    <span>Holographic Eye Mesh Active</span>
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <span>CBSE Class Roster</span>
                  </span>
                </div>
                <h3 className="text-2xl font-black font-heading tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Classroom Live Focus Room</span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold font-mono">({activeClass.name})</span>
                  <InfoTooltip title="Multi-Camera Focus Telemetry" content="Analyzes simultaneous face mesh coordinate arrays across all student webcams to monitor attention coherence." isDark={isDark} />
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-xs max-w-xl leading-relaxed">
                  Real-time multi-gaze focus assessment console. Stream simulated high-fidelity telemetry, track eye-gaze vector drift, and send vibration cues to study pads instantly.
                </p>

                {/* Class selector & Duration selector in room mode */}
                <div className="pt-2 flex flex-col gap-3 font-mono text-[10px] uppercase">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">Monitor Class:</span>
                    <div className="relative">
                      <select
                        value={activeClassId}
                        onChange={(e) => setActiveClassId(e.target.value)}
                        className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none pr-8 text-[11px] shadow-xs"
                      >
                        {classes.length === 0 ? (
                          <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                            No Classes Available
                          </option>
                        ) : (
                          classes.map(c => (
                            <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                              {c.name}
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-2.5 pointer-events-none text-slate-500 dark:text-slate-400" />
                    </div>
                  </div>

                  {/* Configurable Timer Selector */}
                  {!isRoomTracking && (
                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl space-y-2.5 max-w-md">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Class Session Timer:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                          Configured: {teacherIsCustomDuration ? (teacherCustomDurationInput || '15') : teacherDiagDuration} min
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[15, 30, 45, 60].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => {
                              setTeacherDiagDuration(mins);
                              setTeacherIsCustomDuration(false);
                            }}
                            className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer border ${!teacherIsCustomDuration && teacherDiagDuration === mins
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                              }`}
                          >
                            {mins}m
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setTeacherIsCustomDuration(true)}
                          className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer border ${teacherIsCustomDuration
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                            }`}
                        >
                          Custom
                        </button>
                      </div>

                      {teacherIsCustomDuration && (
                        <div className="pt-1">
                          <input
                            type="number"
                            min="1"
                            max="300"
                            placeholder="Custom Minutes (e.g. 20)..."
                            value={teacherCustomDurationInput}
                            onChange={(e) => setTeacherCustomDurationInput(e.target.value)}
                            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Master Live Focus Average Circular HUD Indicator & Timer */}
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0 self-start lg:self-center shadow-xs">
                <div className="relative flex items-center justify-center">
                  {/* Circular progress background */}
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="34" stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"} strokeWidth="6" fill="transparent" />
                    <motion.circle
                      cx="40" cy="40" r="34"
                      stroke="#4F46E5"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 34}
                      initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - (isRoomTracking ? liveClassFocusAvg : 0) / 100) }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-black font-mono tracking-tighter text-slate-900 dark:text-white">
                      {isRoomTracking ? `${liveClassFocusAvg}%` : '0%'}
                    </span>
                    <span className="text-[8px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Average</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-center sm:text-left">
                  {isRoomTracking && (
                    <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg text-indigo-700 dark:text-indigo-300 font-mono text-sm font-bold">
                      <Clock className="h-4 w-4 animate-pulse text-indigo-600 dark:text-indigo-400" />
                      <span>{formatTeacherCountdown(teacherDiagTimeLeft)}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {!isRoomTracking ? (
                      <button
                        onClick={handleStartClassroomDiagnostic}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs bg-indigo-600 hover:bg-indigo-500 text-white"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        <span>Start Tracking</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStopClassroomDiagnostic('Manually Stopped')}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs bg-rose-600 hover:bg-rose-500 text-white border border-rose-600"
                      >
                        <Square className="h-3.5 w-3.5 fill-white" />
                        <span>Stop Tracking</span>
                      </button>
                    )}

                    <button
                      onClick={() => setGazeAlertSound(!gazeAlertSound)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${gazeAlertSound
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      title="Buzz smartwatch on high student distraction"
                    >
                      {gazeAlertSound ? <Volume2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}
                      <span>{gazeAlertSound ? 'Buzzer ON' : 'Buzzer OFF'}</span>
                    </button>

                    {latestClassReport && !isRoomTracking && (
                      <button
                        onClick={() => setShowTeacherReportModal(true)}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs"
                      >
                        <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Generate Class Report</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-center sm:justify-start space-x-2 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">
                    <div className={`w-2 h-2 rounded-full ${isRoomTracking ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span>
                      {isRoomTracking ? 'Receiving active multi-webcam telemetry' : 'Webcam telemetry suspended. Click Start.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Classroom Video Stream & Multi-Face Auto Identification */}
          <div className="space-y-6">
            <ClassroomAutoTracker
              registeredStudents={getTestingStudents(activeClassId)}
              isTracking={isRoomTracking}
              onAutoTrackingUpdate={handleAutoTrackingUpdate}
            />

            {/* Auto-Assigned Student Panels Grid */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 font-mono">
                  <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Auto-Assigned Student Panels ({getTestingStudents(activeClassId).length} Registered)</span>
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                  Active Class: <strong className="text-slate-900 dark:text-white font-bold">{activeClass.name}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {getTestingStudents(activeClassId).map((student) => {
                  const matchData = autoTrackedMap[student.id];
                  const isRecognized = isRoomTracking && matchData?.matched;

                  let score = matchData?.score || 0;
                  let gaze = matchData?.gaze || (isRoomTracking ? 'Standby' : 'Offline');
                  let statusText = isRoomTracking ? 'Awaiting Direct Camera Focus' : 'Session Paused';
                  let themeBorder = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs';
                  let badgeText = isRoomTracking ? '📡 In-Class Standby' : '⏸ Session Paused';
                  let badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                  if (isRecognized) {
                    badgeText = `✔ Auto-Recognized (${matchData.confidence}%)`;
                    badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold';
                    themeBorder = 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs';

                    if (matchData.cognitiveState === 'NOTE_TAKING') {
                      statusText = 'Note-Taking / Solving';
                      themeBorder = 'border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs';
                    } else if (matchData.cognitiveState === 'COGNITIVE_REFLECTION') {
                      statusText = 'Cognitive Reflection';
                      themeBorder = 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs';
                    } else if (
                      matchData.cognitiveState === 'OFF_TASK_ESTIMATED' ||
                      (matchData.cognitiveState as string) === 'GENUINE_DISTRACTION' ||
                      score < 60
                    ) {
                      statusText = 'Off-Task (Estimated)';
                      themeBorder = 'border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs';
                    } else if (score >= 80) {
                      statusText = 'Optimal Focus';
                    } else {
                      statusText = 'Moderate Focus';
                      themeBorder = 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs';
                    }
                  }

                  return (
                    <div
                      key={student.id}
                      className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all relative overflow-hidden ${themeBorder}`}
                    >
                      {/* Top Header */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${badgeClass}`}>
                            {badgeText}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                            Roll: {student.rollNo}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 my-1">
                          {student.avatar ? (
                            <img
                              src={student.avatar}
                              alt={student.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-700 dark:text-white shrink-0 font-serif">
                              {student.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                          )}
                          <div className="truncate">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate font-heading">{student.name}</h5>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate font-mono">{student.email || 'Registered Pupil'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Score & Telemetry info */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 space-y-2 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-slate-600 dark:text-slate-400 uppercase font-bold">Focus Level</span>
                          <span
                            className={`text-sm font-black ${isRecognized
                                ? score >= 80
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : score >= 60
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-rose-600 dark:text-rose-400 animate-pulse'
                              : 'text-slate-400 dark:text-slate-600'
                              }`}
                          >
                            {isRecognized ? `${score}%` : '--'}
                          </span>
                        </div>

                        {/* Focus Score Bar */}
                        {isRecognized && (
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                              style={{ width: `${Math.max(5, score)}%` }}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-slate-600 dark:text-slate-400 uppercase font-bold">Status</span>
                          <span className={isRecognized ? (score < 60 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-900 dark:text-white font-bold') : 'text-amber-600 dark:text-amber-400 font-medium'}>
                            {statusText}
                          </span>
                        </div>

                        {isRecognized && (
                          <div className="flex items-center justify-between text-[8px] pt-1 border-t border-slate-200 dark:border-slate-800">
                            <span className="text-slate-500 dark:text-slate-400">Eye Gaze Vector:</span>
                            <span className={`font-bold px-1.5 py-0.5 rounded ${gaze === 'Center'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : gaze === 'Eyes Closed'
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-bounce'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              }`}>
                              {gaze}
                            </span>
                          </div>
                        )}

                        {/* Biometric Template Status & DPDP Erasure */}
                        <div className="flex items-center justify-between text-[8px] pt-1.5 border-t border-slate-200 dark:border-slate-800 font-mono">
                          {enrolledBiometrics.has(String(student.id)) ? (
                            <>
                              <span className="text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 px-1.5 py-0.5 rounded font-bold">
                                512-D ENROLLED
                              </span>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Delete encrypted 512-D biometric template for ${student.name}? This permanently removes all local biometric data.`)) {
                                    await deleteBiometricRecord(student.id);
                                    await refreshBiometrics();
                                  }
                                }}
                                className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                                title="Permanently erase encrypted biometric template from device"
                              >
                                Erase Biometric
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 px-1.5 py-0.5 rounded">
                              NO BIOMETRIC
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-start space-x-3 text-xs text-slate-700 dark:text-slate-300 mt-4 text-left shadow-xs">
              <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white font-heading">Hands-Free Classroom Auto-Tracking Workflow</p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5 font-sans leading-relaxed text-[11px]">
                  When Classroom Mode is active, the single classroom camera stream automatically identifies every visible student using 468 scale-invariant facial landmark ratios matched against stored student profile photos. Recognized students are assigned to their monitoring cards with real-time focus tracking without manual camera switching.
                </p>
              </div>
            </div>
          </div>

          {/* Class Diagnostic History Table in Room Mode */}
          <div className="saas-card rounded-2xl p-6 sm:p-8 mt-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" id="teacher-class-diagnostic-history">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  [CLASS DIAGNOSTIC ARCHIVE]
                </span>
                <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                  <History className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Class Diagnostic Session Reports</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Historical archive of classroom-wide attention diagnostic sessions, average focus indexes, and student reports.
                </p>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1.5 font-mono text-[10px] text-slate-700 dark:text-slate-300 font-bold uppercase rounded-lg shadow-xs">
                  Archived: {classReportHistory.length} Sessions
                </div>
                {classReportHistory.length > 0 && (
                  <button
                    onClick={() => setShowClearAllReportsModal(true)}
                    className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1"
                    title="Delete All Reports"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>

            {classReportHistory.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono rounded-xl">
                No classroom diagnostic sessions recorded yet. Start a session using the HUD above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Topic / Session</th>
                      <th className="py-3 px-4">Duration (Config / Actual)</th>
                      <th className="py-3 px-4">Avg Focus</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-sans">
                    {classReportHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {item.date}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {item.className}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {item.sessionTitle}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {item.configuredDurationMinutes}m / {Math.floor(item.actualDurationSeconds / 60)}m {item.actualDurationSeconds % 60}s
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {item.avgClassFocus}%
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => exportReportToPDF(item, true)}
                              className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center space-x-1"
                              title="Download Class PDF Report"
                            >
                              <Download className="h-3 w-3" />
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => exportReportToCSV(item, true)}
                              className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center space-x-1"
                              title="Download Class CSV Dataset"
                            >
                              <FileText className="h-3 w-3" />
                              <span>CSV</span>
                            </button>
                            <button
                              onClick={() => {
                                setViewingClassHistoryReport(item);
                                setShowTeacherReportModal(true);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer inline-flex items-center space-x-1"
                              title="View Interactive Modal"
                            >
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => setDeleteReportTarget({ id: item.id, title: item.sessionTitle })}
                              className="bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer inline-flex items-center space-x-1"
                              title="Delete Unnecessary Report"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Single Report Delete */}
      {deleteReportTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white p-6 max-w-md w-full shadow-2xl text-center rounded-xl space-y-4">
            <div className="mx-auto w-12 h-12 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Delete Class Report?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete the report for <span className="text-white font-semibold">"{deleteReportTarget.title}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteReportTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs uppercase font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteClassReport(deleteReportTarget.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs uppercase font-bold rounded-lg cursor-pointer"
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear All Class Reports */}
      {showClearAllReportsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white p-6 max-w-md w-full shadow-2xl text-center rounded-xl space-y-4">
            <div className="mx-auto w-12 h-12 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Clear All Class Reports?</h3>
              <p className="text-xs text-slate-400 mt-1">
                This will permanently delete all {classReportHistory.length} archived class diagnostic reports. This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => setShowClearAllReportsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs uppercase font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearAllClassReports}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs uppercase font-bold rounded-lg cursor-pointer"
              >
                Clear All Reports
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Class Diagnostic Report Modal */}
      {showTeacherReportModal && (
        <DiagnosticReportModal
          classReport={viewingClassHistoryReport || latestClassReport}
          onClose={() => {
            setShowTeacherReportModal(false);
            setViewingClassHistoryReport(null);
          }}
          onDeleteReport={handleDeleteClassReport}
        />
      )}
    </div>
  );
};
