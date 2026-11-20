import React from 'react';
import { Trophy, Plus, Minus, PlusCircle, Trash2, Flame, Sparkles, Award } from 'lucide-react';
import { GameRound } from '../types';
import { sounds } from '../utils/soundEffects';

interface GamesModuleProps {
  rounds: GameRound[];
  onUpdateRound: (roundNumber: number, field: 'name' | 'antorchasScore' | 'chispasScore', value: string | number) => void;
  onAddRound: () => void;
  onRemoveRound: (roundNumber: number) => void;
}

export const GamesModule: React.FC<GamesModuleProps> = ({
  rounds,
  onUpdateRound,
  onAddRound,
  onRemoveRound,
}) => {
  const antorchasTotal = rounds.reduce((sum, r) => sum + Number(r.antorchasScore || 0), 0);
  const chispasTotal = rounds.reduce((sum, r) => sum + Number(r.chispasScore || 0), 0);

  const handleQuickAdd = (roundNumber: number, team: 'antorchas' | 'chispas', delta: number) => {
    const round = rounds.find((r) => r.roundNumber === roundNumber);
    if (!round) return;
    const current = team === 'antorchas' ? round.antorchasScore : round.chispasScore;
    const updated = Math.max(0, Number(current || 0) + delta);
    onUpdateRound(roundNumber, team === 'antorchas' ? 'antorchasScore' : 'chispasScore', updated);
    sounds.playScoreAdd();
  };

  return (
    <div className="space-y-6">
      {/* Module Title Card */}
      <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>Categoría 1: Dinámicas Físicas</span>
          </div>
          <h2 className="text-xl font-bold font-display text-slate-900">
            Juegos del Programa (2 a 3 Rondas)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingresa manualmente los puntajes obtenidos por cada equipo en los desafíos recreativos de cada ronda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {rounds.length < 3 && (
            <button
              onClick={() => {
                onAddRound();
                sounds.playScoreAdd();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-700" />
              <span>Agregar Ronda 3</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs bg-slate-100 px-3 py-1.5 rounded-xl">
            <span className="font-semibold text-slate-700">Rondas activas:</span>
            <span className="font-mono font-bold text-slate-900">{rounds.length} de 3</span>
          </div>
        </div>
      </div>

      {/* Rounds list */}
      <div className="space-y-4">
        {rounds.map((round) => {
          const roundDiff = round.antorchasScore - round.chispasScore;
          const antorchasWins = roundDiff > 0;
          const chispasWins = roundDiff < 0;

          return (
            <div
              key={round.roundNumber}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-bold font-display flex items-center justify-center text-sm shadow-2xs">
                    R{round.roundNumber}
                  </div>
                  <input
                    type="text"
                    value={round.name}
                    onChange={(e) => onUpdateRound(round.roundNumber, 'name', e.target.value)}
                    className="text-base font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-none px-1 py-0.5"
                    placeholder={`Nombre de la Ronda ${round.roundNumber}`}
                  />
                </div>

                <div className="flex items-center gap-3">
                  {roundDiff !== 0 && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                        antorchasWins
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Ganó {antorchasWins ? 'Antorchas (+ ' + roundDiff + ')' : 'Chispas (+ ' + Math.abs(roundDiff) + ')'}
                    </span>
                  )}
                  {rounds.length > 2 && (
                    <button
                      onClick={() => onRemoveRound(round.roundNumber)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Eliminar esta ronda"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Side by side round scoring inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Antorchas (Rojo) */}
                <div className="p-4 rounded-xl bg-red-50/60 border border-red-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-red-600 fill-red-500" />
                      <span className="font-bold text-sm text-red-900">ANTORCHAS</span>
                    </div>
                    <span className="text-xs text-red-700 font-medium">Equipo Rojo</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={round.antorchasScore}
                      onChange={(e) => onUpdateRound(round.roundNumber, 'antorchasScore', Math.max(0, Number(e.target.value)))}
                      className="w-28 px-3 py-2 text-2xl font-bold font-mono tabular-nums text-center bg-white border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {[+5, +10, +25, +50].map((pts) => (
                        <button
                          key={pts}
                          onClick={() => handleQuickAdd(round.roundNumber, 'antorchas', pts)}
                          className="px-2.5 py-1 text-xs font-semibold bg-white border border-red-200 text-red-700 hover:bg-red-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          +{pts}
                        </button>
                      ))}
                      <button
                        onClick={() => handleQuickAdd(round.roundNumber, 'antorchas', -10)}
                        className="px-2 py-1 text-xs font-semibold bg-white border border-red-200 text-red-500 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                        title="Restar 10"
                      >
                        -10
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chispas (Amarillo) */}
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-300/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <span className="font-bold text-sm text-amber-950">CHISPAS</span>
                    </div>
                    <span className="text-xs text-amber-800 font-medium">Equipo Amarillo</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={round.chispasScore}
                      onChange={(e) => onUpdateRound(round.roundNumber, 'chispasScore', Math.max(0, Number(e.target.value)))}
                      className="w-28 px-3 py-2 text-2xl font-bold font-mono tabular-nums text-center bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {[+5, +10, +25, +50].map((pts) => (
                        <button
                          key={pts}
                          onClick={() => handleQuickAdd(round.roundNumber, 'chispas', pts)}
                          className="px-2.5 py-1 text-xs font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          +{pts}
                        </button>
                      ))}
                      <button
                        onClick={() => handleQuickAdd(round.roundNumber, 'chispas', -10)}
                        className="px-2 py-1 text-xs font-semibold bg-white border border-amber-300 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                        title="Restar 10"
                      >
                        -10
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Subtotal summary card */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
          <Award className="w-4 h-4 text-amber-700" />
          <span>Subtotal Acumulado en Juegos:</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[11px] font-medium text-red-700 block">Antorchas Juegos</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-red-600">
              {antorchasTotal} pts
            </span>
          </div>
          <div className="h-8 w-px bg-amber-300" />
          <div className="text-left">
            <span className="text-[11px] font-medium text-amber-800 block">Chispas Juegos</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-600">
              {chispasTotal} pts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
