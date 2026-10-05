import { lazy, Suspense, useState, useEffect } from 'react';
import { Route, User } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AnimatePresence, motion } from 'motion/react';
import { api } from './services/api';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Route-level code-splitting: Heavy modules loaded asynchronously on-demand
const TeacherDashboard = lazy(() =>
  import('./components/TeacherDashboard').then((m) => ({ default: m.TeacherDashboard }))
);
const StudentDashboard = lazy(() =>
  import('./components/StudentDashboard').then((m) => ({ default: m.StudentDashboard }))
);
const TeacherAuth = lazy(() =>
  import('./components/TeacherAuth').then((m) => ({ default: m.TeacherAuth }))
);
const StudentAuth = lazy(() =>
  import('./components/StudentAuth').then((m) => ({ default: m.StudentAuth }))
);
const AccountSettingsModal = lazy(() =>
  import('./components/AccountSettingsModal').then((m) => ({ default: m.AccountSettingsModal }))
);
const ResetDatabaseModal = lazy(() =>
  import('./components/ResetDatabaseModal').then((m) => ({ default: m.ResetDatabaseModal }))
);

const ViewLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
    <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Loading Module...</span>
  </div>
);

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Restore authenticated session from JWT token on initial app load
  useEffect(() => {
    let isMounted = true;
    api.auth
      .getMe()
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
    return () => {
      isMounted = false;
    };
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

  const handleResetComplete = () => {
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
            <Suspense fallback={<ViewLoader />}>
              <TeacherAuth
                mode="login"
                setCurrentRoute={setCurrentRoute}
                onLoginSuccess={handleLoginSuccess}
              />
            </Suspense>
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
            <Suspense fallback={<ViewLoader />}>
              <TeacherAuth
                mode="signup"
                setCurrentRoute={setCurrentRoute}
                onLoginSuccess={handleLoginSuccess}
              />
            </Suspense>
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
            <Suspense fallback={<ViewLoader />}>
              <StudentAuth
                mode="login"
                setCurrentRoute={setCurrentRoute}
                onLoginSuccess={handleLoginSuccess}
              />
            </Suspense>
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
            <Suspense fallback={<ViewLoader />}>
              <StudentAuth
                mode="signup"
                setCurrentRoute={setCurrentRoute}
                onLoginSuccess={handleLoginSuccess}
              />
            </Suspense>
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
            <Suspense fallback={<ViewLoader />}>
              <TeacherDashboard
                user={user}
                setCurrentRoute={setCurrentRoute}
                onLogout={handleLogout}
              />
            </Suspense>
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
            <Suspense fallback={<ViewLoader />}>
              <StudentDashboard
                user={user}
                setCurrentRoute={setCurrentRoute}
                onLogout={handleLogout}
              />
            </Suspense>
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
    <div className="min-h-screen bg-bg-base text-slate-100 font-sans selection:bg-indigo-600 selection:text-white antialiased">
      <Navbar
        currentRoute={currentRoute}
        setCurrentRoute={setCurrentRoute}
        user={user}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenResetModal={() => setIsResetModalOpen(true)}
      />
      <main className="relative">
        <ErrorBoundary>
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </ErrorBoundary>
      </main>

      {user && isSettingsOpen && (
        <Suspense fallback={null}>
          <AccountSettingsModal
            user={user}
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onUpdateUser={handleUpdateUser}
            onAccountDeleted={handleAccountDeleted}
            onOpenResetModal={() => setIsResetModalOpen(true)}
          />
        </Suspense>
      )}

      {isResetModalOpen && (
        <Suspense fallback={null}>
          <ResetDatabaseModal
            isOpen={isResetModalOpen}
            onClose={() => setIsResetModalOpen(false)}
            onResetComplete={handleResetComplete}
          />
        </Suspense>
      )}
    </div>
  );
}
