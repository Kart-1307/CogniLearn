import React, { useState } from 'react';
import { Route, User } from '../types';
import { LogOut, Menu, X, School, User as UserIcon, Settings, Database, Activity } from 'lucide-react';
import logoImg from '../assets/images/cognilearn_logo_1786370632851.jpg';

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
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-bg-base/85 backdrop-blur-md text-slate-100">
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
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-bg-base" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-brand text-xl sm:text-2xl font-extrabold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                    Cogni<span className="text-indigo-400">Learn</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    SaaS v2.4
                  </span>
                </div>
                <span className="text-[10px] font-medium tracking-wide text-slate-400">
                  Focus Intelligence Platform
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Right Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-3 text-xs font-medium">
            {!user ? (
              <>
                <button
                  onClick={() => setCurrentRoute('landing')}
                  className={`px-3 py-2 rounded-md transition-colors cursor-pointer ${
                    currentRoute === 'landing'
                      ? 'bg-slate-800/80 text-white font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                  id="nav-home"
                >
                  Home
                </button>

                <button
                  onClick={() => setCurrentRoute('teacher-login')}
                  className={`px-3 py-2 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                    currentRoute.includes('teacher')
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                  id="nav-teacher-portal"
                >
                  <School className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Teacher Portal</span>
                </button>

                <button
                  onClick={() => setCurrentRoute('student-login')}
                  className={`px-3 py-2 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                    currentRoute.includes('student')
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                  id="nav-student-portal"
                >
                  <UserIcon className="h-3.5 w-3.5 text-sky-400" />
                  <span>Student Portal</span>
                </button>

                {onOpenResetModal && (
                  <button
                    onClick={onOpenResetModal}
                    className="ml-2 inline-flex items-center space-x-1.5 py-1.5 px-3 rounded-md border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer text-xs font-medium"
                    title="Reset Database with Double Confirmation"
                    id="nav-reset-db-unauth"
                  >
                    <Database className="h-3.5 w-3.5" />
                    <span>Reset DB</span>
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-3 py-1.5 px-3 rounded-lg border border-slate-800 bg-slate-900/60">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-indigo-600 text-white">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-100 line-clamp-1">
                      {user.fullName}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 capitalize">
                      {user.teacherType || 'Student'}
                    </p>
                  </div>
                </div>

                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Account Settings & Preferences"
                    id="nav-settings"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                )}

                {onOpenResetModal && (
                  <button
                    onClick={onOpenResetModal}
                    className="p-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
                    title="Reset Database (Double Confirmation)"
                    id="nav-reset-db-auth"
                  >
                    <Database className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="inline-flex items-center space-x-1.5 text-xs font-medium py-2 px-3.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer shadow-sm"
                  id="nav-logout"
                >
                  <LogOut className="h-3.5 w-3.5 text-slate-400" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
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
        <div className="md:hidden border-b border-slate-800 bg-bg-base text-slate-100">
          <div className="px-4 pt-3 pb-4 space-y-2 text-sm font-medium">
            {!user ? (
              <>
                <button
                  onClick={() => {
                    setCurrentRoute('landing');
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md hover:bg-slate-800 text-slate-200"
                  id="mobile-nav-home"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    setCurrentRoute('teacher-login');
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 hover:bg-slate-800 text-indigo-300"
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
                  className="w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 hover:bg-slate-800 text-sky-300"
                  id="mobile-nav-student"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Student Portal</span>
                </button>
                {onOpenResetModal && (
                  <button
                    onClick={() => {
                      onOpenResetModal();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 text-rose-400 hover:bg-rose-500/10"
                    id="mobile-nav-reset-unauth"
                  >
                    <Database className="h-4 w-4" />
                    <span>Reset Database</span>
                  </button>
                )}
              </>
            ) : (
              <div className="pt-2 border-t border-slate-800">
                <div className="px-3 py-2 flex items-center space-x-3 mb-2">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{user.fullName}</p>
                    <p className="text-xs text-slate-400 capitalize">
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
                      className="w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 text-slate-300 hover:bg-slate-800"
                      id="mobile-nav-settings"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Account Settings</span>
                    </button>
                  )}
                  {onOpenResetModal && (
                    <button
                      onClick={() => {
                        onOpenResetModal();
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 text-rose-400 hover:bg-rose-500/10"
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
                    className="w-full text-left px-3 py-2 rounded-md text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2 font-medium"
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


