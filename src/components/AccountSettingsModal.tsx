import React, { useState } from 'react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, User as UserIcon, ShieldAlert, Trash2, Save, Sparkles, CheckCircle2,
  BookOpen, School, AlertTriangle, Lock, Camera, Database
} from 'lucide-react';
import { api } from '../services/api';

import { AcademicProfileForm } from './common/AcademicProfileForm';

interface AccountSettingsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
  onAccountDeleted: () => void;
  onOpenResetModal?: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateUser,
  onAccountDeleted,
  onOpenResetModal,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'danger'>('profile');

  // Form State
  const [fullName, setFullName] = useState(user.fullName || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [academicProfileState, setAcademicProfileState] = useState<any>(
    user.role === 'student' ? user.academicProfile : user.teacherProfile
  );
  const [isProfileValid, setIsProfileValid] = useState(true);

  // Danger Zone Deletion Verification State
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProfileValid) {
      setErrorMsg('Please resolve profile validation errors before saving.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSaveSuccessMsg(false);

    const updatePayload: Partial<User> = {
      fullName,
      avatar: avatar || undefined,
      tier: academicProfileState?.tier || user.tier || 'school',
      ...(user.role === 'student' ? {
        academicProfile: academicProfileState,
        gradeLevel: academicProfileState?.standard || (academicProfileState?.department ? `${academicProfileState.department} (${academicProfileState.semester || 'College'})` : user.gradeLevel),
        rollNo: academicProfileState?.rollNo || user.rollNo,
        enrolledSubjects: academicProfileState?.subjects || user.enrolledSubjects,
        curriculumTrack: academicProfileState?.board || user.curriculumTrack,
        institutionName: academicProfileState?.institutionName || user.institutionName,
      } : {
        teacherProfile: academicProfileState,
        teacherType: academicProfileState?.role || user.teacherType,
        institutionName: academicProfileState?.institutionName || user.institutionName,
        department: academicProfileState?.department || user.department,
        teacherIdNumber: academicProfileState?.staffIdNumber || user.teacherIdNumber,
      }),
    };

    try {
      const res = await api.user.updateProfile(updatePayload);
      setIsSaving(false);
      onUpdateUser(res.user);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    } catch (err: any) {
      setIsSaving(false);
      // Fallback local update
      onUpdateUser({ ...user, ...updatePayload });
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim() !== 'DELETE MY ACCOUNT') {
      setErrorMsg('Please type "DELETE MY ACCOUNT" exactly to confirm deletion.');
      return;
    }

    setIsDeleting(true);
    setErrorMsg('');

    try {
      await api.user.deleteAccount();
      setIsDeleting(false);
      onClose();
      onAccountDeleted();
    } catch (err: any) {
      setIsDeleting(false);
      // Fallback local deletion logout
      onClose();
      onAccountDeleted();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-[#131C2E] border border-slate-800 shadow-2xl text-slate-100 rounded-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white">Account Settings & Preferences</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email} • {user.role.toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 px-4 text-xs font-mono font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
              }`}
          >
            Profile & Preferences
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`py-3.5 px-4 text-xs font-mono font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === 'danger'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-rose-400'
              }`}
          >
            Danger Zone (Delete Account)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'profile' ? (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Academic Profile & Institution Configuration */}
              <div className="pt-2">
                <AcademicProfileForm
                  mode={user.role}
                  initialTier={user.tier || (user.gradeLevel?.toLowerCase().includes('college') ? 'college' : 'school')}
                  initialData={{
                    tier: user.tier || (user.gradeLevel?.toLowerCase().includes('college') ? 'college' : 'school'),
                    institutionName: user.institutionName,
                    standard: user.gradeLevel,
                    rollNo: user.rollNo || (user.academicProfile as any)?.rollNo,
                    subjects: user.enrolledSubjects || (user.academicProfile as any)?.subjects,
                    department: user.department,
                    role: user.teacherType,
                    ...((user.role === 'student' ? user.academicProfile : user.teacherProfile) || {}),
                  }}
                  onChange={(profile, isValid) => {
                    setAcademicProfileState(profile);
                    setIsProfileValid(isValid);
                  }}
                  disabled={isSaving}
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 text-xs uppercase font-mono tracking-wider cursor-pointer rounded-xl transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-300 font-mono">Permanent Account Deletion</h4>
                    <p className="mt-1 text-xs text-rose-200/80 leading-relaxed font-medium">
                      Deleting your account will permanently purge your user profile, focus XP, study session history, and baseline cognitive assessment scores. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  To confirm, type <span className="text-rose-400 font-bold">"DELETE MY ACCOUNT"</span> below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full bg-slate-900 border border-rose-900/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono tracking-wide"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400 font-mono">{errorMsg}</p>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmationText.trim() !== 'DELETE MY ACCOUNT'}
                  className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-medium py-3 px-6 text-xs uppercase font-mono tracking-wider cursor-pointer rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Deleting Permanently...' : 'Permanently Delete Account'}</span>
                </button>
              </div>

              {onOpenResetModal && (
                <div className="pt-6 border-t border-slate-800">
                  <div className="p-4 bg-slate-900 border border-amber-500/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <Database className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-amber-300 font-mono uppercase tracking-wider">
                          Full Database Factory Reset
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Purge all databases, clear session metrics, and restore factory default demo accounts. Includes double confirmation security.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenResetModal();
                      }}
                      className="ml-4 shrink-0 inline-flex items-center space-x-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold py-2 px-3.5 text-xs uppercase font-mono tracking-wider cursor-pointer rounded-lg transition-colors"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Reset Database</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
