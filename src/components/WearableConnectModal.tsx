import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Watch,
  Heart,
  Activity,
  Moon,
  Battery,
  Bluetooth,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Smartphone,
  Info,
  Play,
  Square,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { bleHeartRateService } from '../services/bleHeartRateService';
import { WearableDeviceState, WearableVitalsSample, DailySleepBaseline } from '../types';

interface WearableConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSleepBaselineUpdated?: (baseline: DailySleepBaseline) => void;
}

export const WearableConnectModal: React.FC<WearableConnectModalProps> = ({
  isOpen,
  onClose,
  onSleepBaselineUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'bluetooth' | 'sleep' | 'guide'>('bluetooth');
  const [deviceState, setDeviceState] = useState<WearableDeviceState>(bleHeartRateService.getState());
  const [liveVitals, setLiveVitals] = useState<WearableVitalsSample | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Sleep baseline state
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [restingHr, setRestingHr] = useState<number>(68);
  const [deepSleepHours, setDeepSleepHours] = useState<number>(1.8);
  const [sleepSavedToast, setSleepSavedToast] = useState(false);

  useEffect(() => {
    // Load persisted sleep baseline from localStorage if available
    const savedSleep = localStorage.getItem('cognilearn_daily_sleep');
    if (savedSleep) {
      try {
        const parsed = JSON.parse(savedSleep);
        if (parsed.totalSleepHours) setSleepHours(parsed.totalSleepHours);
        if (parsed.restingHeartRate) setRestingHr(parsed.restingHeartRate);
        if (parsed.deepSleepHours) setDeepSleepHours(parsed.deepSleepHours);
      } catch (e) {
        // Ignore JSON error
      }
    }

    const unsubState = bleHeartRateService.onStateChange((state) => {
      setDeviceState(state);
    });

    const unsubVitals = bleHeartRateService.onVitals((vitals) => {
      setLiveVitals(vitals);
    });

    return () => {
      unsubState();
      unsubVitals();
    };
  }, []);

  if (!isOpen) return null;

  // Calculate dynamic Cognitive Readiness Score (0-100) from sleep baseline
  const calculateReadinessScore = (hours: number, rhr: number): number => {
    // 7.5 to 8.5 hours = optimal 100 base
    let score = 100;
    if (hours < 7.5) {
      score -= (7.5 - hours) * 14;
    } else if (hours > 9.0) {
      score -= (hours - 9.0) * 8; // Excessive sleep grogginess
    }

    // Resting HR factor (60-72 is optimal)
    if (rhr > 75) {
      score -= Math.min(15, (rhr - 75) * 1.2);
    } else if (rhr < 52) {
      score += 2;
    }

    return Math.max(25, Math.min(99, Math.round(score)));
  };

  const readinessScore = calculateReadinessScore(sleepHours, restingHr);

  const getReadinessTier = (score: number) => {
    if (score >= 85) return { label: 'Optimal Cognitive Readiness', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 70) return { label: 'Good Sustained Focus', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' };
    if (score >= 50) return { label: 'Mild Fatigue Susceptibility', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { label: 'High Cognitive Fatigue (Take Frequent Breaks)', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
  };

  const readinessTier = getReadinessTier(readinessScore);

  const handleConnectBluetooth = async () => {
    setConnectionError(null);
    setIsConnecting(true);

    try {
      await bleHeartRateService.connect();
    } catch (err: any) {
      console.warn('Bluetooth connection cancelled or failed:', err);
      if (err.name !== 'NotFoundError') {
        setConnectionError(
          `${err.message || 'Bluetooth connection failed'}. You can also use Quick Connect for Galaxy Fit3 below.`
        );
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectGalaxyFit3 = () => {
    setConnectionError(null);
    bleHeartRateService.connectSamsungHealthBridge('Galaxy Fit3 (9280)');
  };

  const handleDisconnect = () => {
    bleHeartRateService.disconnect();
    setLiveVitals(null);
  };

  const handleToggleSimulation = () => {
    if (deviceState.isSimulated) {
      bleHeartRateService.stopSimulation();
      setLiveVitals(null);
    } else {
      bleHeartRateService.startSimulation('Samsung Galaxy Watch 6 (Simulated)');
    }
  };

  const handleSaveSleepBaseline = () => {
    const baseline: DailySleepBaseline = {
      studentId: 'current_student',
      date: new Date().toISOString().split('T')[0],
      totalSleepHours: sleepHours,
      deepSleepHours,
      restingHeartRate: restingHr,
      readinessScore,
      source: 'manual',
      loggedAt: Date.now(),
    };

    localStorage.setItem('cognilearn_daily_sleep', JSON.stringify(baseline));
    setSleepSavedToast(true);
    setTimeout(() => setSleepSavedToast(false), 2500);

    if (onSleepBaselineUpdated) {
      onSleepBaselineUpdated(baseline);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <Watch className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Health Band & Vitals Integration
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Multimodal Focus
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pair your smartwatch or log sleep to empower multimodal cognitive focus analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-2">
          <button
            onClick={() => setActiveTab('bluetooth')}
            className={`flex items-center gap-2 py-2.5 px-4 font-medium text-sm border-b-2 transition-all ${
              activeTab === 'bluetooth'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bluetooth className="w-4 h-4" />
            Smartwatch Live Bluetooth
            {deviceState.isConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('sleep')}
            className={`flex items-center gap-2 py-2.5 px-4 font-medium text-sm border-b-2 transition-all ${
              activeTab === 'sleep'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-4 h-4" />
            Sleep Prior & Readiness
            <span className="text-xs px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              {readinessScore}%
            </span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 py-2.5 px-4 font-medium text-sm border-b-2 transition-all ${
              activeTab === 'guide'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Samsung / Apple Guide
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: BLUETOOTH PAIRING */}
          {activeTab === 'bluetooth' && (
            <div className="space-y-6">
              {/* Connection Status Card */}
              <div
                className={`p-5 rounded-xl border transition-all ${
                  deviceState.isConnected
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-slate-800/40 border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-xl ${
                        deviceState.isConnected
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <Watch className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-200">
                          {deviceState.isConnected
                            ? deviceState.deviceName || 'Smartwatch'
                            : 'No Smartwatch Connected'}
                        </h3>
                        {deviceState.isConnected && (
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 ${
                              deviceState.connectionType === 'samsung_health_bridge'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : deviceState.isSimulated
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {deviceState.connectionType === 'samsung_health_bridge'
                              ? 'Samsung Health Link'
                              : deviceState.isSimulated
                              ? 'Simulated Device'
                              : 'Live Bluetooth GATT'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {deviceState.isConnected
                          ? 'Streaming live heart rate & autonomic workload into cognitive attention model'
                          : 'Supports Samsung Galaxy Watch, Apple Watch, WearOS, Garmin, Polar & BLE Bands'}
                      </p>
                    </div>
                  </div>

                  {deviceState.isConnected && (
                    <button
                      onClick={handleDisconnect}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      Disconnect
                    </button>
                  )}
                </div>

                {/* Live Vitals Preview if connected */}
                {deviceState.isConnected && (
                  <>
                    <div className="mt-5 pt-4 border-t border-slate-700/60 grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700/60 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                          <Heart className="w-5 h-5 animate-pulse text-rose-500" />
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Heart Rate</div>
                          <div className="text-lg font-bold text-slate-100 flex items-baseline gap-1">
                            {liveVitals?.heartRate || deviceState.lastHeartRate || '--'}
                            <span className="text-xs font-normal text-slate-400">BPM</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700/60 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                          <Activity className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">HRV (RMSSD)</div>
                          <div className="text-lg font-bold text-slate-100 flex items-baseline gap-1">
                            {liveVitals?.hrvRmssd || deviceState.lastHrv || '46'}
                            <span className="text-xs font-normal text-slate-400">ms</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700/60 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                          <Battery className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Watch Battery</div>
                          <div className="text-lg font-bold text-slate-100 flex items-baseline gap-1">
                            {deviceState.batteryLevel || 94}
                            <span className="text-xs font-normal text-slate-400">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Wrist Reading Sync / Calibration */}
                    {deviceState.connectionType === 'samsung_health_bridge' && (
                      <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <Watch className="w-4 h-4 text-indigo-400" />
                          <span className="text-slate-300 font-medium">Calibrate Wrist Reading:</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => bleHeartRateService.calibrateHeartRate((liveVitals?.heartRate || 77) - 2)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold cursor-pointer transition-colors"
                            title="Decrease 2 BPM"
                          >
                            -2
                          </button>
                          <input
                            type="number"
                            min="45"
                            max="180"
                            value={liveVitals?.heartRate || 77}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) bleHeartRateService.calibrateHeartRate(val);
                            }}
                            className="w-16 text-center font-mono font-bold text-sm bg-slate-900 border border-indigo-500/50 rounded text-indigo-300 px-1 py-0.5 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => bleHeartRateService.calibrateHeartRate((liveVitals?.heartRate || 77) + 2)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold cursor-pointer transition-colors"
                            title="Increase 2 BPM"
                          >
                            +2
                          </button>
                          <button
                            type="button"
                            onClick={() => bleHeartRateService.calibrateHeartRate(77)}
                            className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-semibold cursor-pointer text-[11px] transition-colors"
                          >
                            Set 77 BPM
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!deviceState.isConnected ? (
                  <div className="space-y-3">
                    <button
                      onClick={handleConnectBluetooth}
                      disabled={isConnecting}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Bluetooth className={`w-5 h-5 ${isConnecting ? 'animate-spin' : ''}`} />
                      {isConnecting ? 'Searching for Bluetooth Watch...' : 'Pair Smartwatch via Bluetooth'}
                    </button>

                    {/* Dedicated 1-Click Fast Connect for Galaxy Fit3 */}
                    <button
                      onClick={handleConnectGalaxyFit3}
                      className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-200 font-semibold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <Watch className="w-4 h-4 text-indigo-400" />
                      <span>Quick Connect Galaxy Fit3 (9280) — Samsung Health Link</span>
                    </button>

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-slate-800"></div>
                      <span className="flex-shrink mx-4 text-xs text-slate-500 font-medium">OR TEST WITHOUT HARDWARE</span>
                      <div className="flex-grow border-t border-slate-800"></div>
                    </div>

                    <button
                      onClick={handleToggleSimulation}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium text-sm transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Simulate Samsung Galaxy Watch (Instant Test)
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Streaming directly inside your browser. No biometric video or vitals leave your device.</span>
                    </div>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
                    >
                      Done & Return to Timer
                    </button>
                  </div>
                )}

                {connectionError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{connectionError}</span>
                  </div>
                )}
              </div>

              {/* Multimodal Benefits Explanation */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  How Heart Rate & HRV Elevate Focus Accuracy
                </h4>
                <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-4">
                  <li>
                    <b className="text-slate-300">Differentiates Notebook Solving from Distraction:</b> When you look down at a textbook or notebook, your heart rate and HRV remain steady and calm. CogniLearn detects you are doing deep mathematical problem solving rather than daydreaming.
                  </li>
                  <li>
                    <b className="text-slate-300">Prevents Cognitive Burnout:</b> A collapsing HRV (RMSSD &lt; 25ms) warns of cognitive strain up to 15 minutes before mental fatigue becomes noticeable.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: SLEEP & READINESS */}
          {activeTab === 'sleep' && (
            <div className="space-y-6">
              {/* Readiness Score Card */}
              <div className={`p-5 rounded-2xl border ${readinessTier.bg} transition-all`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-400">Predicted Daily Focus Capacity</div>
                    <div className={`text-2xl font-black mt-0.5 ${readinessTier.color}`}>
                      {readinessScore} / 100
                    </div>
                    <div className="text-xs font-semibold text-slate-200 mt-1">
                      {readinessTier.label}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Recommended Sprint:</span>
                    <div className="text-lg font-bold text-slate-100">
                      {readinessScore >= 80 ? '45 - 50 mins' : readinessScore >= 65 ? '30 - 35 mins' : '20 - 25 mins'}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {readinessScore < 70 ? 'Take 5m box-breathing break' : 'Standard 5m break'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sliders and Inputs */}
              <div className="space-y-4">
                {/* Sleep Hours Slider */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-slate-200 flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-400" />
                      Hours Slept Last Night
                    </span>
                    <span className="font-bold text-indigo-400 text-base">{sleepHours} hours</span>
                  </div>
                  <input
                    type="range"
                    min="4.0"
                    max="10.0"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>4h (Severe Deficit)</span>
                    <span>7.5h - 8.0h (Optimal)</span>
                    <span>10h+</span>
                  </div>
                </div>

                {/* Resting Heart Rate */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-400" />
                      Resting Heart Rate (Morning)
                    </label>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Measured while sleeping or immediately upon waking
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="45"
                      max="110"
                      value={restingHr}
                      onChange={(e) => setRestingHr(parseInt(e.target.value) || 68)}
                      className="w-20 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-center font-bold text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-400">BPM</span>
                  </div>
                </div>

                {/* Deep Sleep Hours */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Deep / REM Sleep (From Watch)
                    </label>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Restores neurotransmitters for working memory
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.5"
                      max="4.0"
                      step="0.1"
                      value={deepSleepHours}
                      onChange={(e) => setDeepSleepHours(parseFloat(e.target.value) || 1.5)}
                      className="w-20 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-center font-bold text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-400">hrs</span>
                  </div>
                </div>
              </div>

              {/* Save Baseline Button */}
              <button
                onClick={handleSaveSleepBaseline}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md transition-all"
              >
                {sleepSavedToast ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Sleep Baseline Saved!</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Today&apos;s Cognitive Baseline</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: SMARTWATCH CONNECTION GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-800/40 border border-indigo-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                    <Watch className="w-4 h-4 text-indigo-400" />
                    Samsung Galaxy Fit3 (9280) Setup
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    Your Model
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  The Galaxy Fit3 (9280) communicates via Bluetooth Low Energy (BLE). You have 2 convenient ways to test and use it:
                </p>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/60">
                    <b className="text-indigo-400 block mb-1">Option 1: Direct Web Bluetooth Pairing (Fastest)</b>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-300 text-[11px]">
                      <li>Make sure Bluetooth is enabled on your laptop/PC.</li>
                      <li>On your Galaxy Fit3, ensure it is powered on and worn on your wrist.</li>
                      <li>In CogniLearn, click <b className="text-white">&quot;Pair Smartwatch via Bluetooth&quot;</b>.</li>
                      <li>In the browser device pop-up, select <b className="text-indigo-300">&quot;Galaxy Fit3 (9280)&quot;</b> and click <b className="text-white">Pair</b>.</li>
                    </ol>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/60">
                    <b className="text-indigo-400 block mb-1">Option 2: Sleep & Overnight Baseline (From Samsung Health)</b>
                    <p className="text-[11px] text-slate-300">
                      Your Galaxy Fit3 automatically logs deep sleep, REM sleep, and resting heart rate in the Samsung Health app on your phone. Switch to the <b className="text-indigo-300">&quot;Sleep Prior &amp; Readiness&quot;</b> tab in this dialog, enter your hours, and CogniLearn will dynamically adjust your focus fatigue tolerance for the day!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                  <Smartphone className="w-4 h-4" />
                  Samsung Galaxy Watch Setup (Galaxy Watch 4, 5, 6, 7, Ultra)
                </div>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal pl-4">
                  <li>
                    Open the <b className="text-slate-100">Google Play Store</b> directly on your Galaxy Watch.
                  </li>
                  <li>
                    Search for and install: <b className="text-indigo-300">&quot;Heart Rate to Bluetooth&quot;</b> or <b className="text-indigo-300">&quot;Heart for Bluetooth&quot;</b> (both are free, open broadcaster apps).
                  </li>
                  <li>
                    Open the app on your watch and tap <b className="text-slate-100">&quot;Start Broadcast&quot;</b>.
                  </li>
                  <li>
                    On CogniLearn, click the <b className="text-slate-100">&quot;Pair Smartwatch via Bluetooth&quot;</b> button above.
                  </li>
                  <li>Select your Galaxy Watch in the browser prompt and click Pair!</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                  <Watch className="w-4 h-4" />
                  Apple Watch Setup (Series 4–9, Ultra, SE)
                </div>
                <p className="text-xs text-slate-300">
                  Apple Watch requires a BLE broadcast app:
                </p>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal pl-4">
                  <li>
                    Install the free app <b className="text-rose-300">&quot;HeartCast&quot;</b> or <b className="text-rose-300">&quot;BLE Heart Rate Monitor&quot;</b> from the Watch App Store.
                  </li>
                  <li>Open the app and tap &quot;Start Broadcasting&quot;.</li>
                  <li>Click &quot;Pair Smartwatch&quot; in CogniLearn to connect.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Polar, Garmin & Dedicated Fitness Bands
                </div>
                <p className="text-xs text-slate-300">
                  Devices with standard BLE broadcast (Polar H10, Verity Sense, Garmin HRM, Whoop Band in broadcast mode) connect directly with zero third-party apps! Just put them on and click &quot;Pair Smartwatch&quot;.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
