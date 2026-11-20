import React from 'react';
import { Cloud, CloudOff, Lock, LogIn, LogOut, Share2, UploadCloud, ShieldCheck, KeyRound } from 'lucide-react';
import { User } from 'firebase/auth';

interface CloudSyncBarProps {
  user: User | null;
  isAdmin: boolean;
  isMember: boolean;
  cloudExists: boolean;
  isLoadingCloud: boolean;
  hasLocalDataToMigrate: boolean;
  isMigrating: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenAccessModal: () => void;
  onMigrateLocalToCloud: () => void;
}

export const CloudSyncBar: React.FC<CloudSyncBarProps> = ({
  user,
  isAdmin,
  isMember,
  cloudExists,
  isLoadingCloud,
  hasLocalDataToMigrate,
  isMigrating,
  onSignIn,
  onSignOut,
  onOpenAccessModal,
  onMigrateLocalToCloud,
}) => {
  const canEdit = isAdmin || isMember;

  return (
    <div className="bg-white/95 border border-amber-200/90 rounded-2xl px-4 py-2.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      {/* Left: Connection Status */}
      <div className="flex items-center gap-2.5 min-w-0">
        {isLoadingCloud ? (
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 animate-pulse">
            <Cloud className="w-4 h-4" />
          </div>
        ) : cloudExists ? (
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 relative">
            <Cloud className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <CloudOff className="w-4 h-4" />
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-900">
              {isLoadingCloud
                ? 'Conectando a la base de datos compartida...'
                : cloudExists
                ? 'Sincronizado en la Nube (Mismos datos en todos los celulares)'
                : 'Base de datos en la nube lista para inicializar'}
            </span>
            {canEdit ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                {isAdmin ? 'Admin' : 'Líder Autorizado'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                <Lock className="w-3 h-3" />
                Solo Lectura
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 truncate">
            {user
              ? canEdit
                ? `Conectado como ${user.displayName || user.email} · Todos los cambios se guardan en tiempo real`
                : `Sesión iniciada (${user.email}) · Ingresa el código del club para poder editar`
              : 'Cualquier persona con el link ve los datos en vivo · Inicia sesión con Google para editar'}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {isAdmin && hasLocalDataToMigrate && (
          <button
            onClick={onMigrateLocalToCloud}
            disabled={isMigrating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{isMigrating ? 'Subiendo...' : 'Subir datos de este celular'}</span>
          </button>
        )}

        {!user ? (
          <button
            onClick={onSignIn}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar con Google</span>
          </button>
        ) : (
          <>
            {!canEdit && (
              <button
                onClick={onOpenAccessModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Ingresar Código del Club</span>
              </button>
            )}

            {canEdit && (
              <button
                onClick={onOpenAccessModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{isAdmin ? 'Compartir y Permisos' : 'Compartir Link'}</span>
              </button>
            )}

            <button
              onClick={onSignOut}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
