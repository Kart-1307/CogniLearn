import React, { useState } from 'react';
import { Route, User } from '../types';
import { GraduationCap, LogOut, Menu, X, School, User as UserIcon, Settings } from 'lucide-react';

interface NavbarProps {
  currentRoute: Route;
  setCurrentRoute: (route: Route) => void;
  user: User | null;
  onLogout: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  setCurrentRoute,
  user,
  onLogout,
  onOpenSettings,
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
    <nav className="bg-[#111113] border-b border-white/10 sticky top-0 z-50 text-[#F8F7F4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <button
              onClick={handleLogoClick}
              className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition-opacity"
              id="navbar-logo-btn"
            >
              <div className="bg-[#FF5A5F] text-[#111113] p-2 rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-[#F8F7F4]">
                Cogni<span className="text-[#FF5A5F]">Learn</span>
              </span>
            </button>
          </div>

          {/* Desktop Right Nav */}
          <div className="hidden md:flex items-center space-x-6">
            {!user ? (
              <>
                <button
                  onClick={() => setCurrentRoute('landing')}
                  className={`text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer ${
                    currentRoute === 'landing' ? 'text-[#FF5A5F]' : 'text-[#F8F7F4]/60 hover:text-[#F8F7F4]'
                  }`}
                  id="nav-home"
                >
                  Home
                </button>
                <div className="h-4 w-px bg-white/10" />
                <button
                  onClick={() => setCurrentRoute('teacher-login')}
                  className={`text-xs font-mono uppercase tracking-widest transition-colors flex items-center space-x-1.5 cursor-pointer ${
                    currentRoute.includes('teacher') ? 'text-[#FF5A5F]' : 'text-[#F8F7F4]/60 hover:text-[#F8F7F4]'
                  }`}
                  id="nav-teacher-portal"
                >
                  <School className="h-4 w-4" />
                  <span>Teacher Portal</span>
                </button>
                <button
                  onClick={() => setCurrentRoute('student-login')}
                  className={`text-xs font-mono uppercase tracking-widest transition-colors flex items-center space-x-1.5 cursor-pointer ${
                    currentRoute.includes('student') ? 'text-[#FF5A5F]' : 'text-[#F8F7F4]/60 hover:text-[#F8F7F4]'
                  }`}
                  id="nav-student-portal"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Student Portal</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-5">
                <div className="flex items-center space-x-3 bg-white/5 border border-white/10 py-1.5 px-3.5 rounded-xl">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-8 h-8 rounded-full object-cover border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#FF5A5F]/20 text-[#FF5A5F] flex items-center justify-center font-bold text-sm font-mono">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-semibold text-[#F8F7F4] line-clamp-1">{user.fullName}</p>
                    <p className="text-[10px] text-[#F8F7F4]/50 font-medium font-mono tracking-wide uppercase">
                      {user.teacherType || 'Student'}
                    </p>
                  </div>
                </div>

                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[#F8F7F4]/80 hover:text-[#FF5A5F] rounded-xl transition-colors cursor-pointer"
                    title="Account Settings & Preferences"
                    id="nav-settings"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="inline-flex items-center space-x-1.5 bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-[#111113] text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-xl shadow-sm transition-colors cursor-pointer font-mono"
                  id="nav-logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger icon */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-[#F8F7F4]/70 hover:text-[#F8F7F4] hover:bg-white/5 focus:outline-none"
              id="mobile-menu-toggle"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#111113]">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {!user ? (
              <>
                <button
                  onClick={() => {
                    setCurrentRoute('landing');
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2.5 rounded-xl text-sm font-mono uppercase tracking-wider text-[#F8F7F4]/70 hover:bg-white/5 hover:text-[#F8F7F4]"
                  id="mobile-nav-home"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    setCurrentRoute('teacher-login');
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-mono uppercase tracking-wider text-[#F8F7F4]/70 hover:bg-white/5 hover:text-[#F8F7F4] flex items-center space-x-2"
                  id="mobile-nav-teacher"
                >
                  <School className="h-4 w-4 text-[#FF5A5F]" />
                  <span>Teacher Portal</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentRoute('student-login');
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-mono uppercase tracking-wider text-[#F8F7F4]/70 hover:bg-white/5 hover:text-[#F8F7F4] flex items-center space-x-2"
                  id="mobile-nav-student"
                >
                  <UserIcon className="h-4 w-4 text-[#FF5A5F]" />
                  <span>Student Portal</span>
                </button>
              </>
            ) : (
              <div className="pt-2 border-t border-white/10">
                <div className="px-3 py-3 flex items-center space-x-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/5 text-[#FF5A5F] flex items-center justify-center font-bold text-base">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#F8F7F4]">{user.fullName}</p>
                    <p className="text-xs text-[#F8F7F4]/50 font-mono tracking-wide uppercase">
                      {user.teacherType || 'Student'}
                    </p>
                    <p className="text-xs text-[#F8F7F4]/40 line-clamp-1 mt-0.5">{user.email}</p>
                  </div>
                </div>
                <div className="px-2 pb-1">
                  <button
                    onClick={() => {
                      onLogout();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#FF5A5F] hover:bg-white/5 flex items-center space-x-2 font-mono uppercase tracking-wider"
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
    </nav>
  );
};
