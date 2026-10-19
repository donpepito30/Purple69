import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Lock,
  KeyRound,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Crown
} from 'lucide-react';
import {
  verifyMasterKey,
  authorizeMasterAccess,
  startTrialAccess,
  recordFailedAttempt,
  checkLockoutStatus,
  SecurityState,
  evaluateSecurityState,
  resetSecurityState
} from '@/lib/security';

interface SecurityGateProps {
  securityState: SecurityState;
  onStateChange: (newState: SecurityState) => void;
  isUnlockModalOpen: boolean;
  setIsUnlockModalOpen: (open: boolean) => void;
}

export const SecurityGate: React.FC<SecurityGateProps> = ({
  securityState,
  onStateChange,
  isUnlockModalOpen,
  setIsUnlockModalOpen,
}) => {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [showKeyInputInGate, setShowKeyInputInGate] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Check lockout status
  useEffect(() => {
    const { locked, remainingLockoutSeconds } = checkLockoutStatus();
    if (locked) {
      setLockoutSeconds(remainingLockoutSeconds);
    }
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Handle master passkey verification
  const handleVerifyKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passkeyInput.trim() || isVerifying || lockoutSeconds > 0) return;

    setIsVerifying(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const isValid = await verifyMasterKey(passkeyInput);

      if (isValid) {
        setSuccessMessage('¡Clave de acceso verificada correctamente! Acceso total concedido.');
        await authorizeMasterAccess();
        setTimeout(() => {
          setPasskeyInput('');
          setIsUnlockModalOpen(false);
          setShowKeyInputInGate(false);
          setSuccessMessage(null);
          onStateChange(evaluateSecurityState());
        }, 900);
      } else {
        const { locked, remainingLockoutSeconds } = recordFailedAttempt();
        if (locked) {
          setLockoutSeconds(remainingLockoutSeconds);
          setErrorMessage(`Demasiados intentos fallidos. Sistema bloqueado temporalmente por ${remainingLockoutSeconds}s.`);
        } else {
          setErrorMessage('Clave de seguridad incorrecta. Acceso denegado.');
        }
      }
    } catch (err) {
      setErrorMessage('Error al verificar la clave. Intenta nuevamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle starting 30 min trial
  const handleStartTrial = async () => {
    setIsVerifying(true);
    try {
      await startTrialAccess();
      onStateChange(evaluateSecurityState());
    } finally {
      setIsVerifying(false);
    }
  };

  // -------------------------------------------------------------
  // 1. LOCKOUT SCREEN (Prueba Finalizada — Bloqueo Estricto)
  // -------------------------------------------------------------
  if (securityState.status === 'expired') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-lg bg-zinc-950 border-2 border-red-900/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(239,68,68,0.25)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          
          {/* Ambient Security Glow */}
          <div className="absolute -top-24 -left-24 w-52 h-52 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Header Badge */}
          <div className="flex items-center justify-between mb-6 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <img 
                src="https://i.ibb.co/7tDpdC8J/1787700407311-2.jpg" 
                alt="Purple69" 
                className="w-9 h-9 rounded-xl object-cover border border-zinc-800 shadow" 
              />
              <span className="font-black text-lg tracking-wider text-white">
                Purple<span className="text-violet-500">69</span>
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-red-950/80 border border-red-700/60 text-red-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              Prueba Finalizada
            </span>
          </div>

          {/* Lockout Body */}
          <div className="text-center space-y-4 my-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-red-950/40 border-2 border-red-600/50 flex items-center justify-center text-red-400 shadow-xl shadow-red-950/50">
              <ShieldAlert className="w-10 h-10 animate-pulse" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Tu prueba de 30 minutos ha finalizado
            </h2>

            <p className="text-zinc-300 text-sm leading-relaxed max-w-md mx-auto">
              El período de prueba gratuita para este dispositivo ha concluido. <strong className="text-red-400 font-bold">No se permite más el acceso temporal</strong> a las transmisiones y funciones de Purple69.
            </p>

            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 text-left">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-300">
                  Para desbloquear el acceso ilimitado o si eres el administrador, introduce la <strong>clave de autorización de seguridad</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Master Unlock Form */}
          <form onSubmit={handleVerifyKey} className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                <span>Clave de Acceso</span>
                {lockoutSeconds > 0 && (
                  <span className="text-red-400 text-[11px] font-semibold">
                    Bloqueo activo: {lockoutSeconds}s
                  </span>
                )}
              </label>

              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  inputMode="numeric"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Introduce la clave de acceso..."
                  disabled={isVerifying || lockoutSeconds > 0}
                  className="w-full h-12 bg-zinc-900 border border-zinc-700/80 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 pr-12 text-white font-mono tracking-widest text-base outline-none transition disabled:opacity-50"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-700/60 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!passkeyInput.trim() || isVerifying || lockoutSeconds > 0}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-violet-950/60 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verificando cifrado...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Desbloquear Acceso Permanente</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Security Guarantee */}
          <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Cifrado Criptográfico SHA-256
            </span>
            <span>Seguridad Purple69</span>
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. INITIAL ACCESS GATE MODAL (Primer Ingreso / Usuario Externo)
  // -------------------------------------------------------------
  if (securityState.status === 'gate') {
    return (
      <div className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-lg bg-zinc-950 border border-violet-900/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_70px_rgba(139,92,246,0.2)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          
          {/* Subtle Ambient Background */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Brand Header */}
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 px-4 py-2 rounded-2xl shadow-inner">
              <img 
                src="https://i.ibb.co/7tDpdC8J/1787700407311-2.jpg" 
                alt="Purple69 Logo" 
                className="w-8 h-8 rounded-xl object-cover shadow" 
              />
              <span className="font-black text-xl tracking-wider text-white">
                Purple<span className="text-violet-500">69</span>
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Control de Acceso Seguro
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-sm mx-auto leading-relaxed">
              Plataforma privada de streaming y entretenimiento en vivo. Elige tu modalidad de ingreso para continuar:
            </p>
          </div>

          {/* Choice 1: Start 30-min Trial */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-b from-zinc-900/90 to-zinc-900/40 border-2 border-violet-600/40 hover:border-violet-500 transition-all shadow-lg shadow-violet-950/20 group">
              <div className="flex items-start gap-3.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 shrink-0 group-hover:scale-105 transition">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-white">
                      Prueba Gratuita para Usuario Externo
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-300 text-[10px] font-black uppercase">
                      30 Minutos
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Acceso completo a todas las cámaras HD, filtros y modelos en vivo durante 30 minutos continuos.
                  </p>
                </div>
              </div>

              <button
                onClick={handleStartTrial}
                disabled={isVerifying}
                className="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-violet-900/40 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-violet-200" />
                <span>Iniciar Prueba de 30 Minutos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Choice 2: Master Access Key */}
            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Acceso Maestro / Propietario
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Acceso ilimitado permanente sin límite de tiempo.
                    </p>
                  </div>
                </div>

                {!showKeyInputInGate && (
                  <button
                    onClick={() => setShowKeyInputInGate(true)}
                    className="text-xs font-bold text-violet-400 hover:text-violet-300 underline py-1"
                  >
                    Ingresar clave
                  </button>
                )}
              </div>

              {showKeyInputInGate && (
                <form onSubmit={handleVerifyKey} className="mt-3 space-y-3 pt-3 border-t border-zinc-800 animate-in fade-in">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      inputMode="numeric"
                      value={passkeyInput}
                      onChange={(e) => setPasskeyInput(e.target.value)}
                      placeholder="Introduce la clave maestra..."
                      disabled={isVerifying || lockoutSeconds > 0}
                      className="w-full h-11 bg-zinc-950 border border-zinc-700 focus:border-violet-500 rounded-xl px-3.5 pr-10 text-white font-mono tracking-widest text-sm outline-none transition"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="text-red-400 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="text-emerald-400 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!passkeyInput.trim() || isVerifying || lockoutSeconds > 0}
                      className="flex-1 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>Validar Clave</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowKeyInputInGate(false);
                        setErrorMessage(null);
                      }}
                      className="px-3 h-10 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Footer security stamp */}
          <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Cifrado SHA-256 Anti-Manipulación
            </span>
            <span>Purple69 Security</span>
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. TRIAL COUNTDOWN FLOATING BANNER (Durante la prueba activa)
  // -------------------------------------------------------------
  const isCriticalTime = securityState.remainingSeconds < 300; // < 5 mins

  return (
    <>
      {/* Floating Status Pill for Active Trial */}
      {securityState.status === 'trial' && (
        <div className="sticky top-16 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            
            {/* Countdown Badge */}
            <div className="flex items-center gap-2.5">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-bold tracking-wider ${
                isCriticalTime 
                  ? 'bg-red-950/80 border border-red-700/60 text-red-300 animate-pulse'
                  : 'bg-violet-950/80 border border-violet-700/60 text-violet-300'
              }`}>
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Tiempo de prueba restante:</span>
                <strong className="text-white text-sm font-black">{securityState.formattedRemaining}</strong>
              </span>

              {isCriticalTime && (
                <span className="hidden sm:inline-block text-[11px] text-red-400 font-semibold">
                  (¡Quedan menos de 5 minutos!)
                </span>
              )}
            </div>

            {/* Action: Enter Master Key to Unlock Forever */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsUnlockModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-violet-600/20 border border-zinc-700/80 hover:border-violet-500 text-zinc-300 hover:text-violet-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <KeyRound className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">¿Eres el administrador?</span>
                <span>Ingresar Clave</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Master VIP Badge if unlocked */}
      {securityState.status === 'master' && (
        <div className="sticky top-16 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-400">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold tracking-wide">Acceso Maestro / Propietario Autorizado</span>
              <span className="text-[10px] text-zinc-400 hidden sm:inline">• Sin límite de tiempo</span>
            </div>

            <button
              onClick={() => {
                if (confirm('¿Deseas cerrar la sesión maestra para probar la experiencia como usuario externo?')) {
                  resetSecurityState();
                  onStateChange(evaluateSecurityState());
                }
              }}
              className="text-[11px] text-zinc-400 hover:text-zinc-300 underline"
              title="Permite reiniciar y probar el modo usuario externo"
            >
              Probar como usuario externo
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          4. MASTER PASSKEY PROMPT MODAL (Modal manual para introducir clave)
          ------------------------------------------------------------- */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-[95] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">
                  Desbloqueo con Clave Maestra
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsUnlockModalOpen(false);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-zinc-500 hover:text-white text-sm font-bold p-1 rounded-lg hover:bg-zinc-900"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
              Introduce la clave de seguridad para obtener acceso ilimitado y permanente a Purple69 sin restricciones de prueba.
            </p>

            <form onSubmit={handleVerifyKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Clave de Acceso</span>
                  {lockoutSeconds > 0 && (
                    <span className="text-red-400 text-[11px]">
                      Espera {lockoutSeconds}s
                    </span>
                  )}
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    inputMode="numeric"
                    value={passkeyInput}
                    onChange={(e) => setPasskeyInput(e.target.value)}
                    placeholder="Escribe la clave de 6 dígitos..."
                    disabled={isVerifying || lockoutSeconds > 0}
                    className="w-full h-11 bg-zinc-900 border border-zinc-700 focus:border-violet-500 rounded-xl px-3.5 pr-10 text-white font-mono tracking-widest text-sm outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={!passkeyInput.trim() || isVerifying || lockoutSeconds > 0}
                  className="flex-1 h-11 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-950/50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Verificar y Desbloquear</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUnlockModalOpen(false);
                    setErrorMessage(null);
                  }}
                  className="px-4 h-11 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold"
                >
                  Cerrar
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Cifrado HMAC / SHA-256
              </span>
              <span>Solo personal autorizado</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
