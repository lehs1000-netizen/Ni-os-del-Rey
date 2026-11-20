import React, { useState } from 'react';
import { HelpCircle, Check, X, RotateCcw, Flame, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import { QuestionEvent, TeamId } from '../types';
import { sounds } from '../utils/soundEffects';

interface QuestionsModuleProps {
  questions: QuestionEvent[];
  onAddQuestion: (teamId: TeamId, isCorrect: boolean) => void;
  onRemoveQuestion: (questionId: string) => void;
  onClearQuestions: () => void;
}

export const QuestionsModule: React.FC<QuestionsModuleProps> = ({
  questions,
  onAddQuestion,
  onRemoveQuestion,
  onClearQuestions,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  const getStats = (team: TeamId) => {
    const list = questions.filter((q) => q.teamId === team);
    const correct = list.filter((q) => q.isCorrect).length;
    const incorrect = list.filter((q) => !q.isCorrect).length;
    const totalPoints = (correct * 20) - (incorrect * 10);
    return { list, correct, incorrect, totalPoints };
  };

  const antorchasStats = getStats('antorchas');
  const chispasStats = getStats('chispas');

  const handleAnswer = (team: TeamId, isCorrect: boolean) => {
    onAddQuestion(team, isCorrect);
    if (isCorrect) {
      sounds.playCorrect();
    } else {
      sounds.playIncorrect();
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span>Categoría 3: Ronda de Preguntas Bíblicas y Repaso</span>
          </div>
          <h2 className="text-xl font-bold font-display text-slate-900">
            Botones Rápidos de Preguntas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Presiona el botón instantáneo durante el desafío de preguntas.
            Respuesta correcta = <strong>+20 puntos</strong>; respuesta incorrecta o sin responder = <strong>-10 puntos</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-purple-50 text-purple-900 px-3 py-1.5 rounded-xl border border-purple-200 font-medium">
            Total preguntas hoy: <strong className="font-mono">{questions.length}</strong>
          </div>
          {questions.length > 0 && (
            confirmClear ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onClearQuestions();
                    setConfirmClear(false);
                  }}
                  className="px-2.5 py-1.5 text-[11px] font-bold bg-red-600 text-white rounded-lg hover:bg-red-500 cursor-pointer"
                >
                  Confirmar Reinicio
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1.5 text-[11px] font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                title="Borrar historial de preguntas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>

      {/* Two Teams Fast Action Controllers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TEAM 1: ANTORCHAS QUESTION DECK */}
        <div className="bg-white rounded-2xl border-2 border-red-300 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
                <Flame className="w-6 h-6 fill-white text-red-600" />
              </div>
              <div>
                <h3 className="font-bold font-display text-lg text-red-900">ANTORCHAS</h3>
                <span className="text-xs text-red-600">Equipo Rojo</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Puntos Preguntas</span>
              <span className={`text-3xl font-bold font-mono tabular-nums ${antorchasStats.totalPoints >= 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {antorchasStats.totalPoints > 0 ? `+${antorchasStats.totalPoints}` : antorchasStats.totalPoints}
              </span>
            </div>
          </div>

          {/* Quick Big Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleAnswer('antorchas', true)}
              className="py-4 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-700/60 flex items-center justify-center">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="text-sm">¡Correcta!</span>
              <span className="text-xs font-mono font-extrabold text-emerald-100">+20 PTS</span>
            </button>

            <button
              onClick={() => handleAnswer('antorchas', false)}
              className="py-4 px-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-rose-700/60 flex items-center justify-center">
                <X className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="text-sm">Incorrecta / Pasó</span>
              <span className="text-xs font-mono font-extrabold text-rose-100">-10 PTS</span>
            </button>
          </div>

          {/* Tally counters */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-red-50/60 p-3 rounded-xl border border-red-100">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Aciertos (+20):</span>
              <strong className="font-mono text-emerald-700 font-bold text-sm">{antorchasStats.correct}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Fallos (-10):</span>
              <strong className="font-mono text-rose-700 font-bold text-sm">{antorchasStats.incorrect}</strong>
            </div>
          </div>
        </div>

        {/* TEAM 2: CHISPAS QUESTION DECK */}
        <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-6 h-6 fill-white text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold font-display text-lg text-amber-950">CHISPAS</h3>
                <span className="text-xs text-amber-800">Equipo Amarillo</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Puntos Preguntas</span>
              <span className={`text-3xl font-bold font-mono tabular-nums ${chispasStats.totalPoints >= 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                {chispasStats.totalPoints > 0 ? `+${chispasStats.totalPoints}` : chispasStats.totalPoints}
              </span>
            </div>
          </div>

          {/* Quick Big Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleAnswer('chispas', true)}
              className="py-4 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-700/60 flex items-center justify-center">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="text-sm">¡Correcta!</span>
              <span className="text-xs font-mono font-extrabold text-emerald-100">+20 PTS</span>
            </button>

            <button
              onClick={() => handleAnswer('chispas', false)}
              className="py-4 px-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-rose-700/60 flex items-center justify-center">
                <X className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="text-sm">Incorrecta / Pasó</span>
              <span className="text-xs font-mono font-extrabold text-rose-100">-10 PTS</span>
            </button>
          </div>

          {/* Tally counters */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-amber-50/60 p-3 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Aciertos (+20):</span>
              <strong className="font-mono text-emerald-700 font-bold text-sm">{chispasStats.correct}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Fallos (-10):</span>
              <strong className="font-mono text-rose-700 font-bold text-sm">{chispasStats.incorrect}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* History Log with Undo functionality */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-800">
              Historial de Preguntas Respondidas
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Puedes hacer clic en Deshacer si hubo un error al registrar
          </span>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No se han registrado preguntas todavía en esta sesión.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {[...questions].reverse().map((q, idx) => {
              const teamName = q.teamId === 'antorchas' ? 'Antorchas' : 'Chispas';
              const teamColor = q.teamId === 'antorchas' ? 'text-red-700 bg-red-50' : 'text-amber-800 bg-amber-50';

              return (
                <div key={q.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 font-mono font-bold flex items-center justify-center text-slate-600 text-[11px]">
                      #{questions.length - idx}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${teamColor}`}>
                      {teamName}
                    </span>

                    <span className={q.isCorrect ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
                      {q.isCorrect ? 'Respuesta Correcta' : 'Incorrecta o Sin responder'}
                    </span>

                    <span className="text-slate-400 text-[10px] hidden sm:inline">
                      {q.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold text-sm ${q.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {q.points > 0 ? `+${q.points}` : q.points} pts
                    </span>

                    <button
                      onClick={() => onRemoveQuestion(q.id)}
                      className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Deshacer esta pregunta"
                    >
                      Deshacer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
