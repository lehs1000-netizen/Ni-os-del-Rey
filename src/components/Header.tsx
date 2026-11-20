import React from 'react';
import { Crown, Volume2, VolumeX, Trophy, Database, Calendar } from 'lucide-react';
import { WeeklySession } from '../types';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenWinnerScreen: () => void;
  onOpenArchDocs: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeSession: WeeklySession | undefined;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenWinnerScreen,
  onOpenArchDocs,
  soundEnabled,
  onToggleSound,
  activeSession,
}) => {
  const navItems = [
    { id: 'marcador', label: 'Marcador' },
    { id: 'asistencia', label: 'Asistencia y Registro' },
    { id: 'juegos', label: 'Juegos' },
    { id: 'lecciones', label: 'Lecciones' },
    { id: 'preguntas', label: 'Preguntas' },
    { id: 'extras', label: 'Extras y Descuentos' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-xs border border-amber-300">
              <Crown className="w-5 h-5 text-amber-950 fill-amber-100" />
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectTab('marcador');
              }}
              className="text-xl sm:text-2xl font-bold font-display tracking-tight text-amber-950 hover:text-amber-800 transition-colors"
            >
              Niños del Rey
            </a>
          </div>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`text-sm font-medium transition-colors whitespace-nowrap py-1 relative ${
                    isActive
                      ? 'text-amber-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {activeSession && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-900/80 bg-amber-100/60 px-2.5 py-1.5 rounded-lg border border-amber-200/80">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span className="font-semibold">{activeSession.date}</span>
              </div>
            )}

            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Silenciar sonidos' : 'Activar efectos sonoros'}
              className="p-2 rounded-lg text-slate-600 hover:text-amber-900 hover:bg-amber-100/60 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            <button
              onClick={onOpenArchDocs}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5 text-slate-600" />
              <span>Arquitectura & BD</span>
            </button>

            <button
              onClick={onOpenWinnerScreen}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Trophy className="w-4 h-4 text-yellow-100 fill-yellow-200" />
              <span>Fin del Programa</span>
            </button>
          </div>
        </div>

        {/* Mobile nav bar row for small screens */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-amber-100 scrollbar-none">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`text-xs px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-amber-100/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button
            onClick={onOpenArchDocs}
            className="text-xs px-2.5 py-1 rounded-md whitespace-nowrap text-slate-600 hover:bg-slate-200"
          >
            Arquitectura BD
          </button>
        </div>

      </div>
    </header>
  );
};
