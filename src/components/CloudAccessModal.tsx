import React, { useState, useEffect } from 'react';
import { X, Copy, Check, KeyRound, UserPlus, Trash2, ShieldCheck, Share2, LogIn, AlertCircle } from 'lucide-react';
import { User } from 'firebase/auth';
import { ClubMemberData, ClubPrivateConfigData, DEFAULT_ACCESS_CODE } from '../services/clubSyncService';

interface CloudAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isAdmin: boolean;
  isMember: boolean;
  privateConfig: ClubPrivateConfigData | null;
  members: ClubMemberData[];
  onSignIn: () => void;
  onJoinWithCode: (code: string) => Promise<void>;
  onSavePrivateConfig: (accessCode: string, authorizedEmails: string[]) => Promise<void>;
  onRemoveMember: (uid: string) => Promise<void>;
}

export const CloudAccessModal: React.FC<CloudAccessModalProps> = ({
  isOpen,
  onClose,
  user,
  isAdmin,
  isMember,
  privateConfig,
  members,
  onSignIn,
  onJoinWithCode,
  onSavePrivateConfig,
  onRemoveMember,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const [adminCodeInput, setAdminCodeInput] = useState(DEFAULT_ACCESS_CODE);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [authorizedEmails, setAuthorizedEmails] = useState<string[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (privateConfig) {
      setAdminCodeInput(privateConfig.accessCode || DEFAULT_ACCESS_CODE);
      setAuthorizedEmails(privateConfig.authorizedEmails || []);
    }
  }, [privateConfig]);

  if (!isOpen) return null;

  const getPublicShareUrl = (): string => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    if (origin.includes('://ais-dev-')) {
      return origin.replace('://ais-dev-', '://ais-pre-');
    }
    return origin;
  };

  const shareUrl = getPublicShareUrl();
  const canEdit = isAdmin || isMember;

  const copyTextSafely = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
      }
    } catch {
      // Fallback below
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleCopyOnlyLink = async () => {
    await copyTextSafely(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyShareMessage = async () => {
    const code = privateConfig?.accessCode || adminCodeInput || DEFAULT_ACCESS_CODE;
    const text = `👑 Club Niños del Rey — Marcador y Asistencia en Vivo\n\nAbre este enlace público en Chrome o Safari desde tu celular:\n${shareUrl}\n\nPara editar o registrar asistencia, inicia sesión con Google e ingresa el código del club: ${code}`;
    await copyTextSafely(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setJoining(true);
    setJoinError(null);
    try {
      await onJoinWithCode(joinCodeInput.trim());
      setJoinCodeInput('');
      onClose();
    } catch {
      setJoinError('El código ingresado es incorrecto o no coincide con el código del club.');
    } finally {
      setJoining(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCodeInput.trim().length < 4) return;
    setSavingConfig(true);
    try {
      await onSavePrivateConfig(adminCodeInput.trim(), authorizedEmails);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAddAuthorizedEmail = async () => {
    const clean = newEmailInput.trim().toLowerCase();
    if (!clean || !clean.includes('@')) return;
    if (authorizedEmails.includes(clean)) {
      setNewEmailInput('');
      return;
    }
    const next = [...authorizedEmails, clean];
    setAuthorizedEmails(next);
    setNewEmailInput('');
    await onSavePrivateConfig(adminCodeInput.trim() || DEFAULT_ACCESS_CODE, next);
  };

  const handleRemoveAuthorizedEmail = async (email: string) => {
    const next = authorizedEmails.filter((e) => e !== email);
    setAuthorizedEmails(next);
    await onSavePrivateConfig(adminCodeInput.trim() || DEFAULT_ACCESS_CODE, next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              {canEdit ? <Share2 className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-900">
                {isAdmin
                  ? 'Compartir Club y Permisos de Líderes'
                  : isMember
                  ? 'Compartir Link del Club'
                  : 'Acceso para Editar en Vivo'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Sincronización en la nube entre todos los celulares
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Caso 1: Usuario no ha iniciado sesión */}
        {!user && (
          <div className="space-y-4 text-center py-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Actualmente estás viendo los datos del club en tiempo real. Para registrar niños, marcar asistencia o modificar puntajes desde este celular, inicia sesión con tu cuenta de Google.
            </p>
            <button
              onClick={onSignIn}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión con Google</span>
            </button>
          </div>
        )}

        {/* Caso 2: Usuario autenticado pero aún no es miembro ni admin */}
        {user && !canEdit && (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950">
              Conectado como <strong>{user.email}</strong>. Pide al coordinador del club el <strong>Código de Acceso</strong> para habilitar la edición desde tu celular.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Código del Club *
              </label>
              <input
                type="text"
                required
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="Ej: REY2026"
                className="w-full text-sm font-mono font-bold uppercase px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-hidden"
              />
            </div>

            {joinError && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Solo Ver
              </button>
              <button
                type="submit"
                disabled={joining}
                className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl shadow-xs"
              >
                {joining ? 'Verificando...' : 'Activar Edición'}
              </button>
            </div>
          </form>
        )}

        {/* Caso 3: Miembro autorizado (Solo compartir link) */}
        {!isAdmin && isMember && (
          <div className="space-y-4">
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
              <span className="text-xs font-bold text-emerald-950 block">
                Enlace Público del Club (para otros celulares)
              </span>
              <p className="text-[11px] text-emerald-900/80">
                Comparte este enlace para que otros líderes o padres vean los datos en vivo desde Chrome o Safari:
              </p>
              <div className="bg-white border border-emerald-200 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-700 break-all select-all">
                {shareUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyOnlyLink}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? '¡Enlace copiado!' : 'Copiar Enlace Público'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Caso 4: Admin Management View */}
        {isAdmin && (
          <div className="space-y-5">
            {/* Share Box for WhatsApp */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950">
                  1. Enlace Público para Compartir
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-white text-emerald-800 border border-emerald-200">
                  Código: {adminCodeInput}
                </span>
              </div>
              <p className="text-[11px] text-emerald-900/80">
                Comparte siempre este enlace público (<code className="font-mono font-bold">ais-pre-...</code>), nunca el de edición (<code className="font-mono">ais-dev-...</code>). Si otro celular ve página de error, activa el acceso público en el botón <strong>Share / Compartir</strong> arriba a la derecha de AI Studio.
              </p>
              <div className="bg-white border border-emerald-200 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-700 break-all select-all">
                {shareUrl}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyOnlyLink}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? '¡Link copiado!' : 'Copiar Solo Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyShareMessage}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {copiedShare ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedShare ? '¡Copiado!' : 'Link + Código WhatsApp'}</span>
                </button>
              </div>
            </div>

            {/* Código del Club */}
            <form onSubmit={handleSaveConfig} className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                2. Código de Acceso del Club (mínimo 4 caracteres)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  minLength={4}
                  maxLength={32}
                  value={adminCodeInput}
                  onChange={(e) => setAdminCodeInput(e.target.value)}
                  className="flex-1 text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden"
                />
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-xl shadow-xs"
                >
                  {savedSuccess ? '✓ Guardado' : 'Guardar Código'}
                </button>
              </div>
            </form>

            {/* Correos Pre-autorizados */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                3. Correos Google Pre-autorizados (entran directo sin código)
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddAuthorizedEmail}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </div>

              {authorizedEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {authorizedEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAuthorizedEmail(email)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Miembros Activos */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  4. Líderes conectados con permiso de edición ({members.length})
                </span>
              </div>

              {members.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">
                  Aún no se han conectado otros líderes colaboradores.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {members.map((m) => (
                    <div
                      key={m.uid}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{m.displayName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{m.email}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveMember(m.uid)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white"
                        title="Quitar permiso de edición"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
