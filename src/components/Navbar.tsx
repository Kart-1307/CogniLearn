import React, { useState } from 'react';
import { Route, User } from '../types';
import { LogOut, Menu, X, School, User as UserIcon, Settings, Database, Activity, Sun, Moon } from 'lucide-react';
import logoImg from '../assets/images/cognilearn_logo_1786370632851.jpg';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentRoute: Route;
  setCurrentRoute: (route: Route) => void;
  user: User | null;
  onLogout: () => void;
  onOpenSettings?: () => void;
  onOpenResetModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  setCurrentRoute,
  user,
  onLogout,
  onOpenSettings,
  onOpenResetModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleLogoClick = () => {
    if (user) {
      if (user.role === 'teacher') {
        setCurrentRoute('teacher-dashboard');
      } else {
        setCurrentRoute('student-dashboard');
      }
    } else {
      setCurrentRoute('landing');
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-bg-base/85 backdrop-blur-md text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo Brand Section */}
          <div className="flex items-center gap-6">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-3 text-left cursor-pointer group focus:outline-none"
              id="navbar-logo-btn"
            >
              <div className="relative">
                <img
                  src={logoImg}
                  alt="CogniLearn Logo"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover ring-1 ring-indigo-500/30 shadow-md group-hover:ring-indigo-500 transition-all duration-200"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-bg-base" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-brand text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    Cogni<span className="text-indigo-600 dark:text-indigo-400">Learn</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                    SaaS v2.4
                  </span>
                </div>
                <span className="text-[10px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
                  Focus Intelligence Platform
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Right Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-3 text-xs font-medium">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/60 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs mr-1"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
              id="nav-theme-toggle"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400 animate-fade-in" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600 animate-fade-in" />
              )}
            </button>

            {!user ? (
              <>
                <button
                  onClick={() => setCurrentRoute('landing')}
                  className={`px-3 py-2 rounded-md transition-colors cursor-pointer ${
                    currentRoute === 'landing'
                      ? 'bg-slate-200/80 dark:bg-slate-800/80 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
                  }`}
                  id="nav-home"
                >
                  Home
                </button>

                <button
                  onClick={() => setCurrentRoute('teacher-login')}
                  className={`px-3 py-2 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                    currentRoute.includes('teacher')
                      ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
                  }`}
                  id="nav-teacher-portal"
                >
                  <School className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Teacher Portal</span>
                </button>

                <button
                  onClick={() => setCurrentRoute('student-login')}
                  className={`px-3 py-2 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                    currentRoute.includes('student')
                      ? 'bg-sky-50 dark:bg-sky-600/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/40'
                  }`}
                  id="nav-student-portal"
                >
                  <UserIcon className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Student Portal</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-3 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shadow-xs">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-indigo-600 text-white shadow-xs">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {user.fullName}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 capitalize">
                      {user.teacherType || 'Student'}
                    </p>
                  </div>
                </div>

                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
                    title="Account Settings & Preferences"
                    id="nav-settings"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                )}

                {user.role === 'teacher' && onOpenResetModal && (
                  <button
                    onClick={onOpenResetModal}
                    className="p-2 rounded-lg border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 transition-colors cursor-pointer shadow-xs"
                    title="Reset Database (Double Confirmation)"
                    id="nav-reset-db-auth"
                  >
                    <Database className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="inline-flex items-center space-x-1.5 text-xs font-medium py-2 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white transition-all cursor-pointer shadow-xs"
                  id="nav-logout"
                >
                  <LogOut className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Actions: Theme Toggle & Hamburger */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-600" />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
              id="mobile-menu-toggle"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-5 w-5" /> : <Menu className="block h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-bg-base text-slate-900 dark:text-slate-100 shadow-lg">
          <div className="px-4 pt-3 pb-4 space-y-2 text-sm font-medium">
            {!user ? (
              <>
                <button
                  onClick={() => {
                    setCurrentRoute('landing');
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                  id="mobile-nav-home"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    setCurrentRoute('teacher-login');
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-300"
                  id="mobile-nav-teacher"
                >
                  <School className="h-4 w-4" />
                  <span>Teacher Portal</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentRoute('student-login');
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-300"
                  id="mobile-nav-student"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Student Portal</span>
                </button>
              </>
            ) : (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="px-3 py-2 flex items-center space-x-3 mb-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {user.teacherType || 'Student'}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  {onOpenSettings && (
                    <button
                      onClick={() => {
                        onOpenSettings();
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      id="mobile-nav-settings"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Account Settings</span>
                    </button>
                  )}
                  {user.role === 'teacher' && onOpenResetModal && (
                    <button
                      onClick={() => {
                        onOpenResetModal();
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      id="mobile-nav-reset-auth"
                    >
                      <Database className="h-4 w-4" />
                      <span>Reset Database</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onLogout();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center space-x-2 font-medium"
                    id="mobile-nav-logout"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
