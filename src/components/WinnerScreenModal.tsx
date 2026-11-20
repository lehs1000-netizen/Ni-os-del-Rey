import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Flame, Sparkles, X, RotateCcw, Share2, CheckCheck, Award, BookOpen, HelpCircle } from 'lucide-react';
import { TEAMS } from '../data/initialData';
import { TeamScoreSummary, WeeklySession } from '../types';
import { sounds } from '../utils/soundEffects';

interface WinnerScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  antorchasSummary: TeamScoreSummary;
  chispasSummary: TeamScoreSummary;
  activeSession: WeeklySession | undefined;
  trophyImage: string;
  onCompleteSession?: () => void;
}

export const WinnerScreenModal: React.FC<WinnerScreenModalProps> = ({
  isOpen,
  onClose,
  antorchasSummary,
  chispasSummary,
  activeSession,
  trophyImage,
  onCompleteSession,
}) => {
  const confettiIntervalRef = useRef<number | null>(null);

  const diff = antorchasSummary.grandTotal - chispasSummary.grandTotal;
  const isTied = diff === 0;
  const winner = diff > 0 ? 'antorchas' : 'chispas';
  const winnerTeamConfig = isTied ? null : TEAMS[winner];

  const triggerConfettiBlast = () => {
    // Blast 1: Center burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#DC2626', '#EAB308', '#F59E0B', '#EF4444', '#FBBF24', '#3B82F6'],
    });

    // Blast 2: Left cannon
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#DC2626', '#EF4444', '#F59E0B'],
    });

    // Blast 3: Right cannon
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#EAB308', '#FBBF24', '#F59E0B'],
    });
  };

  useEffect(() => {
    if (isOpen) {
      sounds.playFanfare();
      triggerConfettiBlast();

      // Recurring light rain of golden sparks
      const interval = window.setInterval(() => {
        confetti({
          particleCount: 25,
          angle: 90,
          spread: 80,
          origin: { y: 0 },
          colors: ['#F59E0B', '#EF4444', '#EAB308'],
          ticks: 200,
          gravity: 0.6,
        });
      }, 2500);

      confettiIntervalRef.current = interval;

      return () => {
        if (confettiIntervalRef.current) {
          clearInterval(confettiIntervalRef.current);
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-amber-50 via-white to-amber-50/50 rounded-3xl border-4 border-yellow-400 shadow-2xl overflow-hidden my-4">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
          title="Cerrar celebración"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Celebration Royal Crown Header */}
        <div className="relative pt-8 pb-6 px-6 text-center bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-white overflow-hidden">
          <div className="absolute inset-0 bg-radial from-yellow-300/30 via-transparent to-black/30 pointer-events-none" />
          
          <div className="relative z-10 max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-xs px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-amber-200 border border-white/20">
              <Crown className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span>Club Niños del Rey · Ceremonia de Clausura</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white drop-shadow-md">
              ¡FIN DEL PROGRAMA!
            </h1>

            <p className="text-xs sm:text-sm text-amber-100 font-medium">
              {activeSession ? `${activeSession.title} (${activeSession.date})` : 'Resultados Oficiales'}
            </p>
          </div>
        </div>

        {/* Grand Winner Proclamation Banner */}
        <div className="p-6 sm:p-8 space-y-6">
          
          <div className="flex flex-col items-center text-center">
            {/* Trophy visual */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 mb-3">
              <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-pulse" />
              <img
                src={trophyImage}
                alt="Trofeo Campeón Niños del Rey"
                referrerPolicy="no-referrer"
                className="relative z-10 w-full h-full object-contain filter drop-shadow-xl"
              />
            </div>

            {isTied ? (
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                  ¡Resultado Histórico!
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-slate-900">
                  ¡GRAN EMPATE REAL!
                </h2>
                <p className="text-sm text-slate-600 max-w-md">
                  Ambos equipos demostraron esfuerzo, sabiduría y alegría dignos de campeones del Rey.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 mb-1">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Equipo Campeón de la Jornada</span>
                </div>
                <h2
                  className={`text-3xl sm:text-5xl font-black font-display tracking-tight ${
                    winner === 'antorchas' ? 'text-red-600' : 'text-amber-700'
                  }`}
                >
                  ¡VICTORIA PARA {winnerTeamConfig?.name}!
                </h2>
                <p className="text-sm sm:text-base font-medium text-slate-700 italic">
                  &ldquo;{winnerTeamConfig?.motto}&rdquo;
                </p>
                <div className="text-xs text-slate-500 font-mono mt-1">
                  Ventaja de triunfo: +{Math.abs(diff)} puntos
                </div>
              </div>
            )}
          </div>

          {/* Side-by-Side Final Scores Podium */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* ANTORCHAS PODIUM CARD */}
            <div
              className={`rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
                winner === 'antorchas' && !isTied
                  ? 'bg-gradient-to-b from-red-500/10 to-white border-red-500 shadow-lg ring-4 ring-red-400/20'
                  : 'bg-white border-slate-200 shadow-sm opacity-90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-300 flex items-center justify-center">
                      <Flame className="w-7 h-7 text-red-600 fill-red-500" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-red-700 uppercase">Equipo 1 (Rojo)</span>
                      <h3 className="text-xl font-bold font-display text-red-900">ANTORCHAS</h3>
                    </div>
                  </div>

                  {winner === 'antorchas' && !isTied && (
                    <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-red-600 text-white shadow-xs">
                      1º Lugar 🏆
                    </span>
                  )}
                </div>

                <div className="py-2 text-center border-y border-red-100 my-2">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block">Puntaje Final</span>
                  <div className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums text-red-600">
                    {antorchasSummary.grandTotal}
                  </div>
                  <span className="text-xs text-slate-400">puntos acumulados</span>
                </div>

                {/* Breakdown list */}
                <div className="space-y-1.5 pt-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Juegos (Rondas):</span>
                    <strong className="font-mono text-slate-900">+{antorchasSummary.gamesTotal} pts</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Lecciones ({antorchasSummary.lessonsLearnedCount} niños × 20):</span>
                    <strong className="font-mono text-slate-900">+{antorchasSummary.lessonsTotal} pts</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Preguntas (+20/-10):</span>
                    <strong className={`font-mono ${antorchasSummary.questionsTotal >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                      {antorchasSummary.questionsTotal > 0 ? `+${antorchasSummary.questionsTotal}` : antorchasSummary.questionsTotal} pts
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Extras & Penalizaciones:</span>
                    <strong className="font-mono text-slate-900">
                      +{antorchasSummary.extrasTotal - antorchasSummary.penaltiesTotal} pts
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* CHISPAS PODIUM CARD */}
            <div
              className={`rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
                winner === 'chispas' && !isTied
                  ? 'bg-gradient-to-b from-amber-400/10 to-white border-amber-400 shadow-lg ring-4 ring-amber-300/30'
                  : 'bg-white border-slate-200 shadow-sm opacity-90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-amber-500 fill-amber-400" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-amber-800 uppercase">Equipo 2 (Amarillo)</span>
                      <h3 className="text-xl font-bold font-display text-amber-950">CHISPAS</h3>
                    </div>
                  </div>

                  {winner === 'chispas' && !isTied && (
                    <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-amber-500 text-white shadow-xs">
                      1º Lugar 🏆
                    </span>
                  )}
                </div>

                <div className="py-2 text-center border-y border-amber-100 my-2">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block">Puntaje Final</span>
                  <div className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums text-amber-600">
                    {chispasSummary.grandTotal}
                  </div>
                  <span className="text-xs text-slate-400">puntos acumulados</span>
                </div>

                {/* Breakdown list */}
                <div className="space-y-1.5 pt-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Juegos (Rondas):</span>
                    <strong className="font-mono text-slate-900">+{chispasSummary.gamesTotal} pts</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Lecciones ({chispasSummary.lessonsLearnedCount} niños × 20):</span>
                    <strong className="font-mono text-slate-900">+{chispasSummary.lessonsTotal} pts</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Preguntas (+20/-10):</span>
                    <strong className={`font-mono ${chispasSummary.questionsTotal >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                      {chispasSummary.questionsTotal > 0 ? `+${chispasSummary.questionsTotal}` : chispasSummary.questionsTotal} pts
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Extras & Penalizaciones:</span>
                    <strong className="font-mono text-slate-900">
                      +{chispasSummary.extrasTotal - chispasSummary.penaltiesTotal} pts
                    </strong>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Inspirational Royal club motto banner */}
          <div className="bg-amber-100/70 border border-amber-200/90 rounded-2xl p-4 text-center">
            <p className="text-xs sm:text-sm font-semibold text-amber-950 font-display">
              👑 &ldquo;Vosotros sois linaje escogido, real sacerdocio, nación santa, pueblo adquirido por Dios&rdquo; — 1 Pedro 2:9
            </p>
            <p className="text-[11px] text-amber-800/80 mt-1">
              ¡Felicidades a todos los niños de Antorchas y Chispas por su fidelidad y alegría en el club Niños del Rey!
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={triggerConfettiBlast}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-amber-950 bg-yellow-300 hover:bg-yellow-200 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-amber-900 text-amber-900" />
              <span>¡Lanzar Más Confeti! 🎉</span>
            </button>

            {onCompleteSession && (
              <button
                onClick={() => {
                  onCompleteSession();
                  onClose();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Guardar y Cerrar Sesión</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Volver al Marcador
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
