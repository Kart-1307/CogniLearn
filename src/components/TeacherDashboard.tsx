import React, { useState, useRef } from 'react';
import { Route, User } from '../types';
import { motion } from 'motion/react';
import { 
  Users, BookOpen, FileText, Settings, LogOut, 
  School, Calendar, Award, GraduationCap, ChevronRight,
  UserCheck, AlertCircle, Sparkles, TrendingUp, Plus, Trash2, CheckCircle2, Sliders,
  Camera, Video, Play, Pause, Bell, ShieldAlert, Volume2, VolumeX, PlusCircle, Check, 
  Lock, Mail, UserPlus, Info, ChevronDown
} from 'lucide-react';
import { StudentCameraFeed } from './StudentCameraFeed';

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
  const teacherName = user?.fullName || 'Dr. Sunita Rao';
  const teacherEmail = user?.email || 'sunita.rao@kv.edu.in';
  const teacherType = user?.teacherType || 'Class Teacher';

  // State to simulate an alert box or notice
  const [showNotice, setShowNotice] = useState(true);

  // Tab View Mode: 'overview' or 'room' (Classroom Room Mode Live Feed)
  const [dashboardMode, setDashboardMode] = useState<'overview' | 'room'>('overview');

  // --- 1. Multi-Class Handling States ---
  const [classes, setClasses] = useState([
    { id: 'class-10-a', name: 'Class X-A', room: 'Room 102', strength: 5, year: '2026' },
    { id: 'class-10-b', name: 'Class X-B', room: 'Room 104', strength: 4, year: '2026' },
    { id: 'class-11-sci', name: 'Class XI-Science', room: 'Lab 2', strength: 5, year: '2026' },
    { id: 'class-12-comm', name: 'Class XII-Commerce', room: 'Room 203', strength: 3, year: '2026' },
  ]);
  const [activeClassId, setActiveClassId] = useState<string>('class-10-a');

  // Interactive Class Creation State
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassRoom, setNewClassRoom] = useState('');
  const [classSuccessMsg, setClassSuccessMsg] = useState('');

  // --- 2. Interactive Detailed Student Roster State (Indianised & AI-Free) ---
  const [students, setStudents] = useState([
    // Class X-A
    { id: 1, name: 'Karthik Sharma', email: 'karthik.sharma@kv.edu.in', rollNo: '12', classId: 'class-10-a', status: 'Optimal Focus', color: 'text-[#F8F7F4] bg-white/5 border-white/10' },
    { id: 2, name: 'Pooja Patel', email: 'pooja.patel@kv.edu.in', rollNo: '24', classId: 'class-10-a', status: 'Moderate Focus', color: 'text-amber-400 bg-amber-400/5 border-amber-400/20' },
    { id: 3, name: 'Aarav Mehta', email: 'aarav.mehta@kv.edu.in', rollNo: '03', classId: 'class-10-a', status: 'Distracted', color: 'text-[#FF5A5F] bg-[#FF5A5F]/5 border-[#FF5A5F]/20' },
    { id: 4, name: 'Vikram Malhotra', email: 'vikram.m@kv.edu.in', rollNo: '31', classId: 'class-10-a', status: 'Optimal Focus', color: 'text-[#F8F7F4] bg-white/5 border-white/10' },
    { id: 5, name: 'Meera Deshmukh', email: 'meera.d@kv.edu.in', rollNo: '15', classId: 'class-10-a', status: 'Optimal Focus', color: 'text-[#F8F7F4] bg-white/5 border-white/10' },

    // Class X-B
    { id: 6, name: 'Rohan Joshi', email: 'rohan.joshi@kv.edu.in', rollNo: '28', classId: 'class-10-b', status: 'Optimal Focus', color: 'text-[#F8F7F4] bg-white/5 border-white/10' },
    { id: 7, name: 'Ananya Iyer', email: 'ananya.iyer@kv.edu.in', rollNo: '05', classId: 'class-10-b', status: 'Optimal Focus', color: 'text-[#F8F7F4] bg-white/5 border-white/10' },
    { id: 8, name: 'Sanjay Dutt', email: 'sanjay.dutt@kv.edu.in', rollNo: '11', classId: 'class-10-b', status: 'Moderate Focus', color: 'text-amber-400 bg-amber-400/5 border-amber-400/20' },
    { id: 9, name: 'Kiran Rao', email: 'kiran.rao@kv.edu.in', rollNo: '19', classId: 'class-10-b', status: 'Distracted', color: 'text-[#FF5A5F] bg-[#FF5A5F]/5 border-[#FF5A5F]/20' },

    // Class XI-Science
    { id: 10, name: 'Siddharth Nair', email: 'sid.nair@kv.edu.in', rollNo: '42', classId: 'class-11-sci', status: 'Moderate Focus', color: 'text-amber-400 bg-amber-400/5 border-amber-400/20' },
    { id: 11, name: 'Diya Sen', email: 'diya.sen@kv.edu.in', rollNo: '12', classId: 'class-11-sci', status: 'Optimal Focus', color: 'text-[#F8F7F4] bg-white/5 border-white/10' },
    { id: 12, name: 'Rahul Prasad', email: 'rahul.prasad@kv.edu.in', rollNo: '29', classId: 'class-11-sci', status: 'Optimal Focus', color: 'text-[#F8F7F4] bg-white/5 border-white/10' },
    { id: 13, name: 'Neha Gupta', email: 'neha.gupta@kv.edu.in', rollNo: '22', classId: 'class-11-sci', status: 'Distracted', color: 'text-[#FF5A5F] bg-[#FF5A5F]/5 border-[#FF5A5F]/20' },
    { id: 14, name: 'Abhishek Kumar', email: 'abhishek.k@kv.edu.in', rollNo: '02', classId: 'class-11-sci', status: 'Optimal Focus', color: 'text-[#F8F7F4] bg-white/5 border-white/10' },

    // Class XII-Commerce
    { id: 15, name: 'Varun Dhawan', email: 'varun.d@kv.edu.in', rollNo: '45', classId: 'class-12-comm', status: 'Optimal Focus', color: 'text-[#F8F7F4] bg-white/5 border-white/10' },
    { id: 16, name: 'Alia Bhatt', email: 'alia.b@kv.edu.in', rollNo: '03', classId: 'class-12-comm', status: 'Moderate Focus', color: 'text-amber-400 bg-amber-400/5 border-amber-400/20' },
    { id: 17, name: 'Sid Malhotra', email: 'sid.m@kv.edu.in', rollNo: '33', classId: 'class-12-comm', status: 'Optimal Focus', color: 'text-[#F8F7F4] bg-white/5 border-white/10' },
  ]);

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
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
      alert("Could not access camera. Please upload an image file instead.");
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 150;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 150, 150);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setDetailedAvatar(dataUrl);
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
        setDetailedAvatar(reader.result as string);
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
      'Optimal Focus': 'text-[#F8F7F4] bg-white/5 border-white/10',
      'Moderate Focus': 'text-amber-400 bg-amber-400/5 border-amber-400/20',
      'Distracted': 'text-[#FF5A5F] bg-[#FF5A5F]/5 border-[#FF5A5F]/20',
    };

    const newStudent = {
      id: Date.now(),
      name: detailedName.trim(),
      email: detailedEmail.trim(),
      rollNo: detailedRollNo.trim(),
      classId: activeClassId,
      status: detailedFocusBaseline,
      color: statusColors[detailedFocusBaseline] || 'text-[#F8F7F4] bg-white/5 border-white/10',
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

  // Helper to add a Class
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const newId = `class-${Date.now()}`;
    const newClass = {
      id: newId,
      name: newClassName.trim(),
      room: newClassRoom.trim() || 'Room TBD',
      strength: 0,
      year: '2026'
    };
    setClasses([...classes, newClass]);
    setActiveClassId(newId);
    setNewClassName('');
    setNewClassRoom('');
    setShowAddClassForm(false);
    setClassSuccessMsg(`Successfully created classroom "${newClass.name}"!`);
    setTimeout(() => setClassSuccessMsg(''), 4000);
  };

  // --- 3. Room Mode / 5-Cam Live Grid State ---
  const [isRoomTracking, setIsRoomTracking] = useState(false);
  const [gazeAlertSound, setGazeAlertSound] = useState(false);
  
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

  // Get active class details
  const activeClass = classes.find(c => c.id === activeClassId) || classes[0];

  // Helper to get exactly 5 testing students for the active class (padded if needed)
  const getTestingStudents = (classId: string) => {
    const classStudents = students.filter(s => s.classId === classId);
    const padded = [...classStudents];
    
    // Selection of realistic Indianised student profile templates (NO sample avatar paths as requested!)
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
          color: 'text-[#F8F7F4] bg-white/5 border-white/10'
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

  // --- 4. Interactive Subjects State ---
  const [subjects, setSubjects] = useState(['Mathematics', 'Physics', 'Chemistry', 'English Literature']);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-[#F8F7F4] bg-[#111113]" id="teacher-dashboard-container">
      {/* Welcome Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#FF5A5F] bg-[#FF5A5F]/10 border border-[#FF5A5F]/35 px-3 py-1 rounded">
            [TEACHER PORTAL]
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F8F7F4] font-display mt-3 tracking-tight">
            Welcome Back, {teacherName}
          </h1>
          <p className="text-[#F8F7F4]/60 text-xs mt-1 font-sans">
            Monitor focus diagnostics, student learning pathways, and coordinate curriculum tracking.
          </p>
        </div>

        {/* Institution Info Card */}
        <div className="flex items-center space-x-3 bg-black/20 border border-white/10 p-3 rounded-xl self-start">
          <div className="bg-[#FF5A5F]/10 text-[#FF5A5F] p-2.5 rounded-xl border border-[#FF5A5F]/20">
            <School className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[8px] text-[#F8F7F4]/40 font-bold uppercase tracking-wider font-mono">Institution</p>
            <p className="text-xs font-semibold text-[#F8F7F4] font-sans">Kendriya Vidyalaya No. 1</p>
          </div>
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="bg-black/20 border-2 border-white/10 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-xl bg-[#FF5A5F]/10 border border-[#FF5A5F]/20 text-[#FF5A5F] flex items-center justify-center font-extrabold text-2xl font-display">
            {teacherName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-[#F8F7F4] font-display">{teacherName}</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-white/5 text-[#FF5A5F] border border-[#FF5A5F]/25">
                {teacherType}
              </span>
            </div>
            <p className="text-xs font-mono text-[#F8F7F4]/60 mt-1">{teacherEmail}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center justify-center space-x-2 border-2 border-white/10 hover:border-[#FF5A5F] hover:bg-white/5 text-[#F8F7F4] text-xs font-mono font-bold uppercase tracking-widest py-2.5 px-5 transition-all cursor-pointer self-start sm:self-center"
          id="teacher-dashboard-logout"
        >
          <LogOut className="h-4 w-4 text-[#FF5A5F]" />
          <span>Logout</span>
        </button>
      </div>

      {/* Mode View Tab Navigation */}
      <div className="flex border-b border-white/10 mb-8 gap-6 font-mono text-[10px] uppercase tracking-widest">
        <button
          onClick={() => setDashboardMode('overview')}
          className={`pb-4 px-1 font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            dashboardMode === 'overview' 
              ? 'border-[#FF5A5F] text-[#FF5A5F]' 
              : 'border-transparent text-[#F8F7F4]/50 hover:text-[#F8F7F4]'
          }`}
          id="tab-overview"
        >
          <Sliders className="h-4 w-4" />
          <span>Overview Dashboard</span>
        </button>
        <button
          onClick={() => setDashboardMode('room')}
          className={`pb-4 px-1 font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            dashboardMode === 'room' 
              ? 'border-[#FF5A5F] text-[#FF5A5F]' 
              : 'border-transparent text-[#F8F7F4]/50 hover:text-[#F8F7F4]'
          }`}
          id="tab-room-mode"
        >
          <Video className="h-4 w-4" />
          <span className="flex items-center gap-2">
            Classroom Room Mode
            <span className="bg-[#FF5A5F] text-[#111113] font-mono text-[8px] px-1.5 py-0.5 rounded-full font-black tracking-wider animate-pulse uppercase">Live Feed</span>
          </span>
        </button>
      </div>

      {/* Dynamic Success notifications */}
      {classSuccessMsg && (
        <div className="mb-6 bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 text-[#F8F7F4] p-4 rounded-xl flex items-center space-x-2 animate-fade-in text-xs font-mono">
          <CheckCircle2 className="h-4.5 w-4.5 text-[#FF5A5F] shrink-0" />
          <span>{classSuccessMsg}</span>
        </div>
      )}

      {/* Render selected dashboard view */}
      {dashboardMode === 'overview' ? (
        <div className="space-y-8">
          {/* Notice Banner */}
          {showNotice && (
            <div className="mb-8 border-2 border-[#FF5A5F]/40 bg-[#FF5A5F]/5 text-[#F8F7F4] p-5 rounded-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex items-start space-x-3.5">
                <div className="bg-[#FF5A5F]/15 p-2 rounded shrink-0 mt-0.5 border border-[#FF5A5F]/30">
                  <Sparkles className="h-5 w-5 text-[#FF5A5F] animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-sm sm:text-base tracking-tight font-display text-[#F8F7F4]">CogniLearn Focus System Active</p>
                  <p className="text-[#F8F7F4]/70 text-xs mt-0.5 font-sans leading-relaxed">
                    The multiple classroom manager, student registers, and 5-Cam live room-mode focus simulator are configured.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNotice(false)}
                className="text-[#FF5A5F] hover:text-[#FF5A5F]/80 text-[10px] font-mono font-bold tracking-wider uppercase shrink-0 self-start sm:self-center cursor-pointer border border-[#FF5A5F]/35 px-2.5 py-1 rounded"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Classroom Selector Hub Card */}
          <div className="bg-black/20 border-2 border-white/10 rounded-xl p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#F8F7F4] font-display flex items-center space-x-2">
                  <School className="h-5 w-5 text-[#FF5A5F]" />
                  <span>My Active Classrooms</span>
                </h3>
                <p className="text-xs text-[#F8F7F4]/60 mt-1 font-sans">
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
                    className="text-xs border border-white/10 rounded-xl px-4 py-2.5 bg-[#111113] text-[#F8F7F4] font-bold focus:border-[#FF5A5F]/50 outline-none cursor-pointer hover:bg-black/40 transition-colors appearance-none pr-8"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#111113] text-[#F8F7F4]">
                        {c.name} ({c.room})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-4 w-4 absolute right-2.5 top-3 pointer-events-none text-[#F8F7F4]/50" />
                </div>

                <button
                  onClick={() => setShowAddClassForm(!showAddClassForm)}
                  className="bg-[#F8F7F4] hover:bg-[#FF5A5F] text-[#111113] text-xs font-mono font-bold uppercase tracking-wider rounded-xl px-4 py-2.5 flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Class</span>
                </button>
              </div>
            </div>

            {/* Expander to create a classroom */}
            {showAddClassForm && (
              <form onSubmit={handleAddClass} className="mt-6 p-5 bg-black/40 rounded-xl border border-white/10 space-y-4 animate-fade-in text-xs">
                <h4 className="text-xs font-bold text-[#FF5A5F] uppercase tracking-wider font-mono">Initialize Classroom</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">Class Segment Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Class XI-Science"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="w-full text-xs bg-[#111113] border border-white/10 rounded-xl px-3 py-2.5 text-[#F8F7F4] focus:border-[#FF5A5F]/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">Room / Lab Number</label>
                    <input
                      type="text"
                      placeholder="e.g. Chemistry Lab 3"
                      value={newClassRoom}
                      onChange={(e) => setNewClassRoom(e.target.value)}
                      className="w-full text-xs bg-[#111113] border border-white/10 rounded-xl px-3 py-2.5 text-[#F8F7F4] focus:border-[#FF5A5F]/50 outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddClassForm(false)}
                    className="px-3 py-2 border border-white/10 rounded-xl text-xs font-bold text-[#F8F7F4]/60 hover:bg-white/5 cursor-pointer font-mono uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-[#111113] rounded-xl text-xs font-bold cursor-pointer font-mono uppercase tracking-wider"
                  >
                    Create Classroom
                  </button>
                </div>
              </form>
            )}

            {/* Quick overview metric pills for selected class */}
            <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/10">
                <span className="text-[9px] font-mono font-bold text-[#F8F7F4]/40 uppercase tracking-wider">Class Segment</span>
                <span className="font-bold text-[#F8F7F4] text-sm mt-0.5 block">{activeClass.name}</span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/10">
                <span className="text-[9px] font-mono font-bold text-[#F8F7F4]/40 uppercase tracking-wider">Assigned Location</span>
                <span className="font-bold text-[#F8F7F4] text-sm mt-0.5 block">{activeClass.room}</span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/10">
                <span className="text-[9px] font-mono font-bold text-[#F8F7F4]/40 uppercase tracking-wider">Active Pupils</span>
                <span className="font-bold text-[#FF5A5F] text-sm mt-0.5 block font-mono">{students.filter(s => s.classId === activeClassId).length} Registered</span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/10">
                <span className="text-[9px] font-mono font-bold text-[#F8F7F4]/40 uppercase tracking-wider">Academic Session</span>
                <span className="font-bold text-[#F8F7F4] text-sm mt-0.5 block">{activeClass.year} / CBSE</span>
              </div>
            </div>
          </div>

          {/* Grid of 4 Dashboard Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Card 1: Students */}
            <div className="border-2 border-white/10 bg-black/20 hover:border-[#FF5A5F]/50 transition-all rounded-xl p-6 sm:p-8 flex flex-col justify-between group relative overflow-hidden" id="card-teacher-students">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-12 w-12 rounded bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 flex items-center justify-center text-[#FF5A5F]">
                    <Users className="h-6 w-6" />
                  </div>
                  <button
                    onClick={() => setShowDetailedAddForm(!showDetailedAddForm)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#F8F7F4] hover:bg-[#FF5A5F] text-[#111113] text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-all"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Add Student</span>
                  </button>
                </div>
                
                <h3 className="text-xl font-bold text-[#F8F7F4] font-display">Student Roster</h3>
                <p className="mt-2 text-xs text-[#F8F7F4]/60 leading-relaxed font-sans">
                  Manage student profiles for <strong className="text-[#FF5A5F] font-semibold">{activeClass.name}</strong>, assign unique roll credentials, and monitor baseline indexes.
                </p>

                {/* Registration detailed state alert banner */}
                {studentSuccessMsg && (
                  <div className="mt-4 bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 text-[#F8F7F4] text-[10px] p-3.5 rounded-xl flex items-start space-x-2 animate-fade-in font-mono">
                    <Check className="h-4 w-4 text-[#FF5A5F] shrink-0 mt-0.5" />
                    <span>{studentSuccessMsg}</span>
                  </div>
                )}

                {/* Expanded signup-style form */}
                {showDetailedAddForm && (
                  <form onSubmit={handleDetailedStudentAdd} className="mt-6 p-4 bg-black/40 border border-white/10 rounded-xl space-y-4 animate-fade-in text-xs">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 font-mono text-[10px] uppercase tracking-widest">
                      <span className="font-bold text-[#FF5A5F] flex items-center space-x-1.5">
                        <UserPlus className="h-4 w-4" />
                        <span>Add Student (Registration Flow)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowDetailedAddForm(false)}
                        className="text-[#F8F7F4]/60 hover:text-[#F8F7F4] underline cursor-pointer"
                      >
                        Collapse
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Name input */}
                      <div>
                        <label className="block text-[9px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">Full Student Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Karthik Sharma"
                          value={detailedName}
                          onChange={(e) => setDetailedName(e.target.value)}
                          className="w-full text-xs bg-[#111113] border border-white/10 rounded-xl px-3 py-2.5 text-[#F8F7F4] outline-none focus:border-[#FF5A5F]/50"
                        />
                        {detailedErrors.name && (
                          <p className="text-rose-400 text-[10px] font-bold mt-1 flex items-center gap-0.5">
                            <AlertCircle className="h-3 w-3 text-rose-500" /> {detailedErrors.name}
                          </p>
                        )}
                      </div>

                      {/* Email input */}
                      <div>
                        <label className="block text-[9px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">Email Address</label>
                        <input
                          type="email"
                          placeholder="e.g. karthik.sharma@kv.edu.in"
                          value={detailedEmail}
                          onChange={(e) => setDetailedEmail(e.target.value)}
                          className="w-full text-xs bg-[#111113] border border-white/10 rounded-xl px-3 py-2.5 text-[#F8F7F4] outline-none focus:border-[#FF5A5F]/50"
                        />
                        {detailedErrors.email && (
                          <p className="text-rose-400 text-[10px] font-bold mt-1 flex items-center gap-0.5">
                            <AlertCircle className="h-3 w-3 text-rose-500" /> {detailedErrors.email}
                          </p>
                        )}
                      </div>

                      {/* Roll Number input */}
                      <div>
                        <label className="block text-[9px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">Roll Number</label>
                        <input
                          type="text"
                          placeholder="e.g. 12"
                          value={detailedRollNo}
                          onChange={(e) => setDetailedRollNo(e.target.value)}
                          className="w-full text-xs bg-[#111113] border border-white/10 rounded-xl px-3 py-2.5 text-[#F8F7F4] outline-none focus:border-[#FF5A5F]/50"
                        />
                        {detailedErrors.rollNo && (
                          <p className="text-rose-400 text-[10px] font-bold mt-1 flex items-center gap-0.5">
                            <AlertCircle className="h-3 w-3 text-rose-500" /> {detailedErrors.rollNo}
                          </p>
                        )}
                      </div>

                      {/* Password input */}
                      <div>
                        <label className="block text-[9px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">Set Password (Min 6 Chars)</label>
                        <input
                          type="password"
                          placeholder="student123"
                          value={detailedPassword}
                          onChange={(e) => setDetailedPassword(e.target.value)}
                          className="w-full text-xs bg-[#111113] border border-white/10 rounded-xl px-3 py-2.5 text-[#F8F7F4] outline-none focus:border-[#FF5A5F]/50"
                        />
                        {detailedErrors.password && (
                          <p className="text-rose-400 text-[10px] font-bold mt-1 flex items-center gap-0.5">
                            <AlertCircle className="h-3 w-3 text-rose-500" /> {detailedErrors.password}
                          </p>
                        )}
                      </div>

                      {/* Gender select */}
                      <div>
                        <label className="block text-[9px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">Gender</label>
                        <select
                          value={detailedGender}
                          onChange={(e) => setDetailedGender(e.target.value)}
                          className="w-full text-xs bg-[#111113] border border-white/10 rounded-xl px-3 py-2.5 text-[#F8F7F4] outline-none focus:border-[#FF5A5F]/50"
                        >
                          <option value="Male" className="bg-[#111113]">Male</option>
                          <option value="Female" className="bg-[#111113]">Female</option>
                          <option value="Other" className="bg-[#111113]">Other</option>
                        </select>
                      </div>

                      {/* Initial Focus baseline */}
                      <div>
                        <label className="block text-[9px] font-mono font-bold text-[#F8F7F4]/70 uppercase tracking-widest mb-1.5">Focus Baseline</label>
                        <select
                          value={detailedFocusBaseline}
                          onChange={(e) => setDetailedFocusBaseline(e.target.value)}
                          className="w-full text-xs bg-[#111113] border border-white/10 rounded-xl px-3 py-2.5 text-[#F8F7F4] outline-none focus:border-[#FF5A5F]/50"
                        >
                          <option value="Optimal Focus" className="bg-[#111113]">Optimal Focus</option>
                          <option value="Moderate Focus" className="bg-[#111113]">Moderate Focus</option>
                          <option value="Distracted" className="bg-[#111113]">Distracted</option>
                        </select>
                      </div>
                    </div>

                    {/* AI Facial Recognition Enrollment Section */}
                    <div className="bg-[#111113] border border-white/10 rounded-xl p-4 mt-2">
                      <h4 className="text-xs font-bold text-[#FF5A5F] uppercase tracking-wider font-mono flex items-center gap-1.5 mb-3">
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
                                className="w-20 h-20 rounded-full object-cover border-2 border-[#FF5A5F] shadow-sm"
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
                            <div className="w-20 h-20 rounded-full bg-black/40 border border-dashed border-white/20 flex flex-col items-center justify-center text-[#F8F7F4]/40">
                              <UserPlus className="h-6 w-6 mb-1 text-[#F8F7F4]/30" />
                              <span className="text-[8px] font-mono uppercase tracking-widest text-[#F8F7F4]/40">No Photo</span>
                            </div>
                          )}
                        </div>

                        {/* Control Interface: Camera Capture & File Upload */}
                        <div className="flex-1 w-full space-y-3.5">
                          {cameraActive ? (
                            <div className="bg-black/40 rounded-xl p-2 border border-white/10 text-center relative overflow-hidden max-w-[280px] mx-auto sm:mx-0">
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
                                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[#F8F7F4] text-[10px] font-mono font-bold rounded cursor-pointer"
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
                                className="flex flex-col items-center justify-center p-2 rounded-xl border border-white/10 bg-[#111113] hover:border-[#FF5A5F]/40 text-[#F8F7F4]/80 hover:text-[#F8F7F4] transition-all text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                              >
                                <Camera className="h-4 w-4 mb-1 text-[#FF5A5F]" />
                                <span>Webcam Photo</span>
                              </button>

                              {/* Image Upload Input */}
                              <label className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-white/10 bg-[#111113] hover:border-[#FF5A5F]/40 text-[#F8F7F4]/80 hover:text-[#F8F7F4] transition-all text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer text-center">
                                <FileText className="h-4 w-4 mb-1 text-[#FF5A5F]" />
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

                    <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setShowDetailedAddForm(false)}
                        className="px-3 py-2 border border-white/10 rounded-xl text-[#F8F7F4]/60 hover:bg-white/5 font-bold font-mono uppercase tracking-wider text-[10px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-[#111113] rounded-xl px-4 py-2 font-bold font-mono uppercase tracking-wider text-[10px] cursor-pointer"
                      >
                        Save Student
                      </button>
                    </div>
                  </form>
                )}

                {/* Interactive student roster list with fallback monogram instead of default avatar paths */}
                <div className="mt-6 space-y-4">
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {students.filter(s => s.classId === activeClassId).length === 0 ? (
                      <div className="text-center py-8 bg-black/30 rounded-xl border border-white/10 text-[#F8F7F4]/40 text-xs">
                        <Users className="h-8 w-8 mx-auto mb-2 text-[#F8F7F4]/25" />
                        <p className="font-semibold">No students registered in this segment yet.</p>
                        <button
                          onClick={() => setShowDetailedAddForm(true)}
                          className="text-[#FF5A5F] underline font-bold mt-1 block mx-auto cursor-pointer"
                        >
                          Register the first student
                        </button>
                      </div>
                    ) : (
                      students.filter(s => s.classId === activeClassId).map((s) => (
                        <div key={s.id} className="flex justify-between items-center text-xs bg-black/40 p-3 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            {s.avatar ? (
                              <img
                                src={s.avatar}
                                alt={s.name}
                                className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              // Custom generated initials fallback matching Swiss colors
                              <div className="w-8 h-8 rounded-lg bg-white/5 text-[#FF5A5F] border border-white/10 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                                {s.rollNo}
                              </div>
                            )}
                            <div className="truncate text-left">
                              <span className="font-bold text-[#F8F7F4] block truncate">{s.name}</span>
                              <span className="text-[10px] text-[#F8F7F4]/50 block truncate font-mono">{s.email || 'no-email@student.in'}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            <span className={`px-2.5 py-1 rounded font-bold font-mono text-[8px] uppercase tracking-wider border ${s.color}`}>
                              {s.status}
                            </span>
                            <button
                              onClick={() => removeStudent(s.id)}
                              className="text-[#F8F7F4]/30 hover:text-[#FF5A5F] p-1 cursor-pointer rounded-lg transition-colors"
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
              
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[#F8F7F4]/40 text-[10px] font-mono uppercase tracking-wider">
                <span>Roster count: {students.filter(s => s.classId === activeClassId).length} Pupils</span>
                <span className="text-[9px] text-[#FF5A5F] bg-[#FF5A5F]/10 border border-[#FF5A5F]/20 px-2 py-0.5 rounded font-bold">
                  Class: {activeClass.name}
                </span>
              </div>
            </div>

            {/* Card 2: Subjects */}
            <div className="border-2 border-white/10 bg-black/20 hover:border-[#FF5A5F]/50 transition-all rounded-xl p-6 sm:p-8 flex flex-col justify-between group relative overflow-hidden" id="card-teacher-subjects">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-12 w-12 rounded bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 flex items-center justify-center text-[#FF5A5F]">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-white/5 text-[#FF5A5F] border border-[#FF5A5F]/20 uppercase tracking-widest">
                    [CURRICULUM]
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-[#F8F7F4] font-display">Academic Curriculum</h3>
                <p className="mt-2 text-xs text-[#F8F7F4]/60 leading-relaxed font-sans">
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
                      className="flex-1 text-xs border border-white/10 bg-[#111113] rounded px-3 py-2 outline-none focus:border-[#FF5A5F]/50 text-[#F8F7F4]"
                    />
                    <button
                      type="submit"
                      className="bg-[#F8F7F4] hover:bg-[#FF5A5F] text-[#111113] rounded px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider cursor-pointer shrink-0"
                    >
                      Add
                    </button>
                  </form>

                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                    {subjects.map((sub, idx) => (
                      <div key={idx} className="bg-black/30 p-2.5 rounded border border-white/5 hover:border-white/20 flex justify-between items-center transition-all">
                        <span className="text-xs font-semibold text-[#F8F7F4]/80 truncate">{sub}</span>
                        <button
                          onClick={() => removeSubject(sub)}
                          className="text-[#F8F7F4]/30 hover:text-[#FF5A5F] p-0.5 rounded cursor-pointer ml-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[#F8F7F4]/40 text-[10px] font-mono uppercase tracking-wider">
                <span>Configured: {subjects.length} Course Domains</span>
                <ChevronRight className="h-4 w-4 text-[#FF5A5F]" />
              </div>
            </div>

            {/* Card 3: Reports */}
            <div className="border-2 border-white/10 bg-black/20 hover:border-[#FF5A5F]/50 transition-all rounded-xl p-6 sm:p-8 flex flex-col justify-between group relative overflow-hidden" id="card-teacher-reports">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-12 w-12 rounded bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 flex items-center justify-center text-[#FF5A5F]">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-white/5 text-[#FF5A5F] border border-[#FF5A5F]/20 uppercase tracking-widest">
                    [ANALYTICS]
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-[#F8F7F4] font-display">Attention Reports</h3>
                <p className="mt-2 text-xs text-[#F8F7F4]/60 leading-relaxed font-sans">
                  Visualize concentration indexes, weekly attention timelines, or look at individual subject focal metrics.
                </p>

                {/* Interactive Chart/Selector */}
                <div className="mt-6 bg-black/30 border border-white/10 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-mono font-bold text-[#F8F7F4]/40 uppercase tracking-widest">Metric Breakdown</span>
                    <div className="flex gap-1">
                      {(['class', 'weekly', 'subject'] as const).map((view) => (
                        <button
                          key={view}
                          onClick={() => setActiveReportView(view)}
                          className={`text-[9px] font-mono font-bold px-2 py-1 rounded cursor-pointer transition-colors capitalize ${
                            activeReportView === view
                              ? 'bg-[#FF5A5F] text-[#111113]'
                              : 'bg-[#111113] text-[#F8F7F4]/60 border border-white/10 hover:text-[#F8F7F4]'
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
                        <div className="w-full bg-[#FF5A5F]/30 rounded-t h-[40%] text-center text-[8px] text-white pt-1" title="Mon: 40%">M</div>
                        <div className="w-full bg-[#FF5A5F]/50 rounded-t h-[60%] text-center text-[8px] text-white pt-1" title="Tue: 60%">T</div>
                        <div className="w-full bg-[#FF5A5F]/80 rounded-t h-[80%] text-center text-[8px] text-white pt-1" title="Wed: 80%">W</div>
                        <div className="w-full bg-[#FF5A5F] rounded-t h-[95%] text-center text-[8px] text-[#111113] font-bold pt-1" title="Thu: 95%">T</div>
                        <div className="w-full bg-[#FF5A5F]/70 rounded-t h-[70%] text-center text-[8px] text-white pt-1" title="Fri: 70%">F</div>
                      </div>
                      <p className="text-[9px] font-mono text-[#F8F7F4]/50 mt-2 text-center font-medium">Class Focus Index (87% Peak Gaze Sync)</p>
                    </div>
                  )}

                  {activeReportView === 'weekly' && (
                    <div className="space-y-2 pt-1 text-xs font-mono">
                      <div className="flex justify-between items-center bg-[#111113] p-1.5 rounded border border-white/5">
                        <span className="text-[#F8F7F4]/60">Weekly Focused:</span>
                        <span className="font-bold text-[#F8F7F4]">18.4 Hrs / Student</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#111113] p-1.5 rounded border border-white/5">
                        <span className="text-[#F8F7F4]/60">Peak Gaze Day:</span>
                        <span className="font-bold text-[#FF5A5F]">Thursday (9:45 AM)</span>
                      </div>
                    </div>
                  )}

                  {activeReportView === 'subject' && (
                    <div className="space-y-2 pt-1 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[#F8F7F4]/60 text-[10px] w-12">Math:</span>
                        <div className="flex-1 mx-2 bg-[#111113] h-1.5 rounded-full overflow-hidden border border-white/5">
                          <div className="bg-[#FF5A5F] h-full" style={{ width: '90%' }} />
                        </div>
                        <span className="font-bold text-[#F8F7F4] text-[9px]">90%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#F8F7F4]/60 text-[10px] w-12">Physics:</span>
                        <div className="flex-1 mx-2 bg-[#111113] h-1.5 rounded-full overflow-hidden border border-white/5">
                          <div className="bg-[#FF5A5F] h-full" style={{ width: '78%' }} />
                        </div>
                        <span className="font-bold text-[#F8F7F4] text-[9px]">78%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#F8F7F4]/60 text-[10px] w-12">Chemistry:</span>
                        <div className="flex-1 mx-2 bg-[#111113] h-1.5 rounded-full overflow-hidden border border-white/5">
                          <div className="bg-[#FF5A5F] h-full" style={{ width: '85%' }} />
                        </div>
                        <span className="font-bold text-[#F8F7F4] text-[9px]">85%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[#F8F7F4]/40 text-[10px] font-mono uppercase tracking-wider">
                <span>Last report update: Real-time Live</span>
                <ChevronRight className="h-4 w-4 text-[#FF5A5F]" />
              </div>
            </div>

            {/* Card 4: Settings */}
            <div className="border-2 border-white/10 bg-black/20 hover:border-[#FF5A5F]/50 transition-all rounded-xl p-6 sm:p-8 flex flex-col justify-between group relative overflow-hidden" id="card-teacher-settings">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-12 w-12 rounded bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 flex items-center justify-center text-[#FF5A5F]">
                    <Settings className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-white/5 text-[#FF5A5F] border border-[#FF5A5F]/20 uppercase tracking-widest">
                    [SYSTEM]
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-[#F8F7F4] font-display">System Controls</h3>
                <p className="mt-2 text-xs text-[#F8F7F4]/60 leading-relaxed font-sans">
                  Adjust webcam tracking filters, diagnostic sensitivities, secure domain authentication parameters, and logging frequencies.
                </p>

                {/* Interactive Settings controls */}
                <div className="mt-6 space-y-3 bg-black/30 border border-white/10 p-4 rounded-xl text-xs">
                  <div className="flex justify-between items-center bg-[#111113] p-2.5 rounded border border-white/5">
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-[#F8F7F4]/90">Strict Focus Calibration</span>
                      <span className="text-[9px] text-[#F8F7F4]/40 font-mono">Prunes minor eye-shifts</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStrictCalibration(!strictCalibration)}
                      className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                        strictCalibration ? 'bg-[#FF5A5F] justify-end' : 'bg-white/10 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-[#111113] shadow-md" />
                    </button>
                  </div>

                  <div className="flex justify-between items-center bg-[#111113] p-2.5 rounded border border-white/5">
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-[#F8F7F4]/90">Daily Digest Digest</span>
                      <span className="text-[9px] text-[#F8F7F4]/40 font-mono">Email compiled classroom PDFs</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailDigest(!emailDigest)}
                      className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                        emailDigest ? 'bg-[#FF5A5F] justify-end' : 'bg-white/10 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-[#111113] shadow-md" />
                    </button>
                  </div>

                  <div className="bg-[#111113] p-2.5 rounded border border-white/5">
                    <div className="flex justify-between items-center mb-1.5 font-mono text-[9px] uppercase tracking-wider">
                      <span className="font-bold text-[#F8F7F4]/80">Calibration Sensitivity</span>
                      <span className="bg-white/5 px-1.5 py-0.5 rounded text-[#FF5A5F] font-bold">{cameraSensitivity} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={cameraSensitivity}
                      onChange={(e) => setCameraSensitivity(Number(e.target.value))}
                      className="w-full accent-[#FF5A5F] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[#F8F7F4]/40 text-[10px] font-mono uppercase tracking-wider">
                <span>System State: Calibrated & Configured</span>
                <ChevronRight className="h-4 w-4 text-[#FF5A5F]" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Classroom Room Mode 5-Cam Live Video Tracking Grid */
        <div className="space-y-8 animate-fade-in text-[#F8F7F4]" id="classroom-room-mode-view">
          {/* Room Mode Live HUD Control Card */}
          <div className="bg-black/30 border-2 border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            {/* Ambient grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,90,95,0.06),transparent_50%)] pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-white/5 text-[#FF5A5F] border border-[#FF5A5F]/25">
                    <Camera className="h-3 w-3" />
                    <span>Holographic Eye Mesh Active</span>
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-white/5 text-[#F8F7F4]/50 border border-white/10">
                    <span>CBSE Class Roster</span>
                  </span>
                </div>
                <h3 className="text-2xl font-black font-display tracking-tight text-[#F8F7F4] flex items-center gap-2">
                  <span>Classroom Live Focus Room</span>
                  <span className="text-[#FF5A5F] text-sm font-semibold font-mono">({activeClass.name})</span>
                </h3>
                <p className="text-[#F8F7F4]/60 text-xs max-w-xl leading-relaxed">
                  Real-time multi-gaze focus assessment console. Stream simulated high-fidelity telemetry, track eye-gaze vector drift, and send vibration cues to study pads instantly.
                </p>

                {/* Class selector specifically in room mode */}
                <div className="pt-2 flex items-center space-x-2 font-mono text-[10px] uppercase">
                  <span className="text-[#F8F7F4]/50 font-bold">Monitor Class:</span>
                  <div className="relative">
                    <select
                      value={activeClassId}
                      onChange={(e) => setActiveClassId(e.target.value)}
                      className="border border-white/10 rounded-lg px-2.5 py-1.5 bg-[#111113] text-[#F8F7F4] font-bold focus:outline-none cursor-pointer appearance-none pr-8 text-[10px]"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id} className="bg-[#111113] text-[#F8F7F4]">
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="h-3.5 w-3.5 absolute right-2 top-2 pointer-events-none text-[#F8F7F4]/50" />
                  </div>
                </div>
              </div>

              {/* Master Live Focus Average Circular HUD Indicator */}
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-black/40 p-4 rounded-xl border border-white/10 shrink-0 self-start lg:self-center">
                <div className="relative flex items-center justify-center">
                  {/* Circular progress background */}
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                    <circle 
                      cx="40" cy="40" r="34" 
                      stroke="#FF5A5F" 
                      strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 34} 
                      strokeDashoffset={2 * Math.PI * 34 * (1 - (isRoomTracking ? liveClassFocusAvg : 0) / 100)} 
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-black font-mono tracking-tighter">
                      {isRoomTracking ? `${liveClassFocusAvg}%` : '0%'}
                    </span>
                    <span className="text-[7px] text-[#F8F7F4]/40 font-bold uppercase tracking-wider font-mono">Average</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-center sm:text-left">
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button
                      onClick={() => setIsRoomTracking(!isRoomTracking)}
                      className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
                        isRoomTracking 
                          ? 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-600' 
                          : 'bg-[#FF5A5F] hover:bg-[#FF5A5F]/85 text-[#111113]'
                      }`}
                    >
                      {isRoomTracking ? (
                        <>
                          <Pause className="h-3.5 w-3.5" />
                          <span>Pause Session</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-[#111113]" />
                          <span>Start Live Tracking</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setGazeAlertSound(!gazeAlertSound)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                        gazeAlertSound 
                          ? 'bg-white/15 text-[#FF5A5F] border-[#FF5A5F]/30' 
                          : 'bg-black/30 text-[#F8F7F4]/40 border-white/10'
                      }`}
                      title="Buzz smartwatch on high student distraction"
                    >
                      {gazeAlertSound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                      <span>{gazeAlertSound ? 'Buzzer ON' : 'Buzzer OFF'}</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-center sm:justify-start space-x-2 text-[9px] font-mono uppercase text-[#F8F7F4]/40 font-bold">
                    <div className={`w-1.5 h-1.5 rounded-full ${isRoomTracking ? 'bg-emerald-500 animate-pulse' : 'bg-[#FF5A5F]'}`} />
                    <span>
                      {isRoomTracking ? 'Receiving active webcam telemetry' : 'Webcam telemetry suspended. Click Start.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5-Cam Live Video Stream Feed grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F7F4]/50 flex items-center space-x-1.5 font-mono">
                <Video className="h-4 w-4 text-[#FF5A5F]" />
                <span>Classroom Video Streams ({getTestingStudents(activeClassId).length} Active Channels)</span>
              </span>
              <span className="text-xs text-[#F8F7F4]/40">
                Active: <strong className="text-[#F8F7F4]/80 font-bold">{activeClass.name}</strong> • Location: {activeClass.room}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {getTestingStudents(activeClassId).map((student) => (
                <StudentCameraFeed
                  key={student.id}
                  student={student}
                  isTracking={isRoomTracking}
                  onStatusChange={handleCamStatusChange}
                />
              ))}
            </div>

            <div className="bg-black/20 border border-white/10 rounded-xl p-4 flex items-start space-x-2.5 text-xs text-[#F8F7F4]/70 mt-4 text-left">
              <Info className="h-4 w-4 text-[#FF5A5F] mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-[#F8F7F4] font-display">Room Mode Testing Guide</p>
                <p className="text-[#F8F7F4]/60 mt-0.5 font-sans leading-relaxed text-[11px]">
                  Click <strong>Start Live Tracking</strong> to stream focal telemetry simultaneously. Use <strong>Send Alert</strong> to test target tactile vibration cues, or <strong>Calibrate</strong> to reset student face mesh parameters. To check other student clusters, select another class from the monitor menu.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
