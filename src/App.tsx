import { useState, useEffect } from 'react';
import { Route, User } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { TeacherAuth } from './components/TeacherAuth';
import { StudentAuth } from './components/StudentAuth';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { AnimatePresence, motion } from 'motion/react';
import { api } from './services/api';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Restore authenticated session from JWT token on initial app load
  useEffect(() => {
    let isMounted = true;
    api.auth.getMe()
      .then((existingUser) => {
        if (isMounted && existingUser) {
          setUser(existingUser);
          if (existingUser.role === 'teacher') {
            setCurrentRoute('teacher-dashboard');
          } else {
            setCurrentRoute('student-dashboard');
          }
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setCurrentRoute('landing');
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleAccountDeleted = () => {
    setUser(null);
    setCurrentRoute('landing');
  };

  // Render the current active view with full support for smooth transitions
  const renderContent = () => {
    switch (currentRoute) {
      case 'landing':
        return (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage setCurrentRoute={setCurrentRoute} />
          </motion.div>
        );
      case 'teacher-login':
        return (
          <motion.div
            key="teacher-login"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <TeacherAuth
              mode="login"
              setCurrentRoute={setCurrentRoute}
              onLoginSuccess={handleLoginSuccess}
            />
          </motion.div>
        );
      case 'teacher-signup':
        return (
          <motion.div
            key="teacher-signup"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <TeacherAuth
              mode="signup"
              setCurrentRoute={setCurrentRoute}
              onLoginSuccess={handleLoginSuccess}
            />
          </motion.div>
        );
      case 'student-login':
        return (
          <motion.div
            key="student-login"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <StudentAuth
              mode="login"
              setCurrentRoute={setCurrentRoute}
              onLoginSuccess={handleLoginSuccess}
            />
          </motion.div>
        );
      case 'student-signup':
        return (
          <motion.div
            key="student-signup"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <StudentAuth
              mode="signup"
              setCurrentRoute={setCurrentRoute}
              onLoginSuccess={handleLoginSuccess}
            />
          </motion.div>
        );
      case 'teacher-dashboard':
        return (
          <motion.div
            key="teacher-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TeacherDashboard
              user={user}
              setCurrentRoute={setCurrentRoute}
              onLogout={handleLogout}
            />
          </motion.div>
        );
      case 'student-dashboard':
        return (
          <motion.div
            key="student-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StudentDashboard
              user={user}
              setCurrentRoute={setCurrentRoute}
              onLogout={handleLogout}
            />
          </motion.div>
        );
      default:
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <p className="text-slate-500 font-semibold">View not found.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#111113] text-[#F8F7F4]">
      <Navbar
        currentRoute={currentRoute}
        setCurrentRoute={setCurrentRoute}
        user={user}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <main className="relative">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      {user && (
        <AccountSettingsModal
          user={user}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onUpdateUser={handleUpdateUser}
          onAccountDeleted={handleAccountDeleted}
        />
      )}
    </div>
  );
}
