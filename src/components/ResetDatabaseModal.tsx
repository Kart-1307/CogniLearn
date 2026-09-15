import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ShieldAlert, AlertTriangle, RefreshCw, CheckCircle2, ArrowRight, ArrowLeft, Database, Trash2
} from 'lucide-react';
import { api } from '../services/api';

interface ResetDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetComplete: () => void;
}

export const ResetDatabaseModal: React.FC<ResetDatabaseModalProps> = ({
  isOpen,
  onClose,
  onResetComplete,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    if (isResetting) return;
    setStep(1);
    setConfirmationInput('');
    setErrorMessage('');
    setSuccessMessage('');
    onClose();
  };

  const handleProceedToStep2 = () => {
    setErrorMessage('');
    setStep(2);
  };

  const handleBackToStep1 = () => {
    setErrorMessage('');
    setStep(1);
  };

  const handleExecuteReset = async () => {
    if (confirmationInput.trim() !== 'RESET') {
      setErrorMessage('Please type "RESET" in capital letters to confirm.');
      return;
    }

    setIsResetting(true);
    setErrorMessage('');

    try {
      await api.user.resetDatabase();
      setIsResetting(false);
      setSuccessMessage('Database successfully reset to factory default state!');
      
      setTimeout(() => {
        handleClose();
        onResetComplete();
      }, 1500);
    } catch (err: any) {
      console.error('Reset database failed:', err);
      // Fallback local cleanup
      localStorage.removeItem('cognilearn_token');
      localStorage.removeItem('cognilearn_recent_activities');
      setIsResetting(false);
      setSuccessMessage('Local database cache cleared successfully.');
      
      setTimeout(() => {
        handleClose();
        onResetComplete();
      }, 1500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-[#131C2E] border border-slate-800 shadow-2xl rounded-2xl overflow-hidden text-slate-100 font-sans"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white leading-none">
                  Reset Database
                </h3>
                <p className="text-[10px] text-amber-400 font-mono uppercase tracking-widest font-semibold mt-1">
                  Double Confirmation Safety Required ({step}/2)
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isResetting}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-30"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-5">
            {successMessage ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-mono flex items-center space-x-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-sm uppercase tracking-wider">Reset Successful!</p>
                  <p className="text-emerald-400/80 mt-0.5">{successMessage}</p>
                </div>
              </div>
            ) : step === 1 ? (
              /* Step 1: Initial Warning & Summary */
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-3 text-amber-300 text-xs">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold uppercase tracking-wider text-amber-200">
                      Step 1 of 2: Factory Data Purge Notice
                    </p>
                    <p className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                      You are about to trigger a full database reset. Please review the items affected below before proceeding to final confirmation.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2.5 text-xs font-medium">
                  <p className="text-[10px] font-mono uppercase tracking-widest font-semibold text-slate-400 mb-2">
                    Action Impact Summary:
                  </p>
                  <div className="flex items-start space-x-2.5 text-rose-300">
                    <Trash2 className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>Purges custom registered student and teacher user accounts.</span>
                  </div>
                  <div className="flex items-start space-x-2.5 text-rose-300">
                    <Trash2 className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>Clears all recorded focus sessions, baseline scores, and telemetry.</span>
                  </div>
                  <div className="flex items-start space-x-2.5 text-emerald-300">
                    <RefreshCw className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>Restores default demo accounts (<code className="bg-slate-950 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">student@cognilearn.com</code> & <code className="bg-slate-950 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">teacher@cognilearn.com</code>).</span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono uppercase tracking-wider font-medium transition-colors cursor-pointer rounded-xl border border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono uppercase tracking-wider font-medium transition-all cursor-pointer rounded-xl border-none shadow-sm"
                  >
                    <span>Proceed to Step 2</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Double Confirmation with "RESET" typing */
              <div className="space-y-4">
                <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl flex items-start space-x-3 text-rose-200 text-xs">
                  <ShieldAlert className="h-6 w-6 text-rose-400 shrink-0" />
                  <div>
                    <p className="font-semibold uppercase tracking-wider text-rose-300 text-sm">
                      Step 2 of 2: Final Confirmation
                    </p>
                    <p className="text-rose-200/80 mt-1 text-[11px] leading-relaxed">
                      This action cannot be undone. To prevent accidental resets, type <span className="font-bold text-white underline">RESET</span> in capital letters below.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                    Security Key:
                  </label>
                  <input
                    type="text"
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    placeholder='Type "RESET" here'
                    disabled={isResetting}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-rose-900/60 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500 font-mono tracking-widest uppercase placeholder:text-slate-600"
                  />
                  {errorMessage && (
                    <p className="text-[11px] text-rose-400 font-mono font-medium mt-1.5 flex items-center space-x-1">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errorMessage}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    disabled={isResetting}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono uppercase tracking-wider font-medium transition-colors cursor-pointer rounded-xl border border-slate-700 disabled:opacity-50"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteReset}
                    disabled={confirmationInput.trim() !== 'RESET' || isResetting}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono uppercase tracking-wider font-medium transition-all cursor-pointer rounded-xl border-none disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isResetting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Erasing Database...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span>Confirm & Wipe Everything</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
