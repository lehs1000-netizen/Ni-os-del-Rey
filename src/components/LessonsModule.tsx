import React from 'react';
import { BookOpen, Flame, Sparkles, Award, CheckCircle, Plus, Minus, Hash } from 'lucide-react';
import { Child, LessonRecord, TeamId, WeeklySession } from '../types';
import { sounds } from '../utils/soundEffects';

interface LessonsModuleProps {
  childrenList: Child[];
  activeSession: WeeklySession | undefined;
  attendanceRecord: Record<string, { childId: string; present: boolean; assignedTeamId: TeamId; markedAt: string }>;
  lessonsRecord: Record<string, LessonRecord>;
  onUpdateLessonCount: (childId: string, count: number) => void;
  onSetAllLessonsCount: (teamId: TeamId, count: number) => void;
}

export const LessonsModule: React.FC<LessonsModuleProps> = ({
  childrenList,
  activeSession,
  attendanceRecord,
  lessonsRecord,
  onUpdateLessonCount,
  onSetAllLessonsCount,
}) => {
  // Get children assigned to each team in this session
  const getChildTeam = (childId: string): TeamId => {
    return attendanceRecord[childId]?.assignedTeamId || 'antorchas';
  };

  const isChildPresent = (childId: string): boolean => {
    return attendanceRecord[childId]?.present === true;
  };

  const getTeamKids = (team: TeamId) => {
    return childrenList.filter((c) => c.active && getChildTeam(c.id) === team);
  };

  const antorchasAll = getTeamKids('antorchas');
  const chispasAll = getTeamKids('chispas');

  const antorchasPresent = antorchasAll.filter((c) => isChildPresent(c.id));
  const chispasPresent = chispasAll.filter((c) => isChildPresent(c.id));

  // Compute total lessons for each team
  const getChildLessonCount = (childId: string): number => {
    const rec = lessonsRecord[childId];
    if (!rec) return 0;
    if (typeof rec.count === 'number') return rec.count;
    return rec.learned ? 1 : 0;
  };

  const antorchasTotalLessons = antorchasPresent.reduce((sum, c) => sum + getChildLessonCount(c.id), 0);
  const chispasTotalLessons = chispasPresent.reduce((sum, c) => sum + getChildLessonCount(c.id), 0);

  const antorchasPoints = antorchasTotalLessons * 20;
  const chispasPoints = chispasTotalLessons * 20;

  const handleQuickCountChange = (childId: string, current: number, delta: number) => {
    const next = Math.max(0, current + delta);
    onUpdateLessonCount(childId, next);
    if (delta > 0) {
      sounds.playCorrect();
    } else {
      sounds.playScoreAdd();
    }
  };

  const handleDirectSelect = (childId: string, count: number) => {
    onUpdateLessonCount(childId, count);
    if (count > 0) sounds.playCorrect();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner explaining the 20x Multiplier per lesson given */}
      <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Categoría 2: Enseñanza y Memorización Bíblica</span>
          </div>
          <h2 className="text-xl font-bold font-display text-slate-900">
            Lecciones Aprendidas (Multiplicador × 20 por lección)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cada niño presente puede dar 1 o más lecciones (en promedio de 1 a 10 lecciones). Cada lección aprendida otorga <strong>20 puntos</strong> a su equipo asignado hoy.
          </p>
        </div>

        {/* Math formula callout card */}
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
            ×20
          </div>
          <div>
            <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider block">Fórmula de Puntos</span>
            <span className="text-xs font-mono font-bold text-blue-800">
              Puntos = Total de Lecciones Dadas × 20
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Multiplier Tally Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Antorchas formula card */}
        <div className="bg-gradient-to-r from-red-50 to-white rounded-2xl p-4 border border-red-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
              <Flame className="w-6 h-6 fill-white text-red-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-red-900 uppercase">Antorchas (Rojo)</span>
              <div className="text-xs text-slate-600">
                <strong className="font-mono text-red-700 text-sm">{antorchasTotalLessons}</strong> lecciones dadas por {antorchasPresent.length} presentes
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono text-slate-500">{antorchasTotalLessons} lecciones × 20 pts =</div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-red-600">
              +{antorchasPoints} pts
            </div>
          </div>
        </div>

        {/* Chispas formula card */}
        <div className="bg-gradient-to-r from-amber-50 to-white rounded-2xl p-4 border border-amber-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6 fill-amber-700 text-amber-800" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-950 uppercase">Chispas (Amarillo)</span>
              <div className="text-xs text-slate-600">
                <strong className="font-mono text-amber-800 text-sm">{chispasTotalLessons}</strong> lecciones dadas por {chispasPresent.length} presentes
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono text-slate-500">{chispasTotalLessons} lecciones × 20 pts =</div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-amber-600">
              +{chispasPoints} pts
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Niños Evaluados con Selector de Lecciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ============================================================== */}
        {/* COLUMNA 1: ANTORCHAS EVALUACIÓN MULTI-LECCIÓN */}
        {/* ============================================================== */}
        <div className="bg-white rounded-2xl border-2 border-red-200 shadow-xs overflow-hidden">
          <div className="bg-red-600 text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 fill-white text-red-600" />
              <h3 className="text-sm font-bold font-display uppercase tracking-wide">
                Antorchas — Lecciones por Niño
              </h3>
            </div>
            <div className="text-xs font-mono bg-red-700 px-2.5 py-1 rounded-lg">
              {antorchasTotalLessons} lecc. = +{antorchasPoints} pts
            </div>
          </div>

          <div className="p-3 bg-red-50/50 border-b border-red-100 flex items-center justify-between text-xs text-slate-600">
            <span>Solo niños marcados presentes ({antorchasPresent.length}):</span>
            <div className="flex gap-1">
              <button
                onClick={() => onSetAllLessonsCount('antorchas', 1)}
                className="text-[11px] font-semibold text-red-700 hover:underline"
              >
                +1 a todos
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => onSetAllLessonsCount('antorchas', 0)}
                className="text-[11px] font-semibold text-slate-500 hover:underline"
              >
                Reiniciar
              </button>
            </div>
          </div>

          {/* Lista de niños en Antorchas */}
          <div className="p-4 space-y-3 max-h-[550px] overflow-y-auto">
            {antorchasPresent.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No hay niños presentes asignados a Antorchas en este momento. Marca su asistencia en la pestaña "Asistencia".
              </div>
            ) : (
              antorchasPresent.map((child) => {
                const count = getChildLessonCount(child.id);
                const points = count * 20;

                return (
                  <div
                    key={child.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      count > 0 ? 'bg-red-50/70 border-red-300 shadow-xs' : 'bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{child.fullName}</div>
                        <div className="text-[11px] text-slate-500">
                          {count === 0 ? (
                            <span className="text-slate-400">Sin lecciones hoy</span>
                          ) : (
                            <span className="text-red-700 font-bold">
                              {count} {count === 1 ? 'lección aprendida' : 'lecciones aprendidas'} (+{points} pts)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botones +/- Rápidos */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickCountChange(child.id, count, -1)}
                          disabled={count === 0}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-100 flex items-center justify-center transition-colors active:scale-90"
                          title="Restar 1 lección"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-8 text-center font-mono font-bold text-sm text-slate-900">
                          {count}
                        </div>

                        <button
                          onClick={() => handleQuickCountChange(child.id, count, 1)}
                          className="w-7 h-7 rounded-lg bg-red-600 text-white hover:bg-red-500 flex items-center justify-center transition-colors active:scale-90 shadow-xs"
                          title="Sumar 1 lección (+20 pts)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Selector de Opciones Rápidas (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 lecciones) */}
                    <div className="pt-2 border-t border-red-100/60 flex items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Marcar:
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 10].map((num) => (
                          <button
                            key={num}
                            onClick={() => handleDirectSelect(child.id, num)}
                            className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-lg transition-all ${
                              count === num
                                ? 'bg-red-600 text-white shadow-xs scale-105'
                                : 'bg-white hover:bg-red-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLUMNA 2: CHISPAS EVALUACIÓN MULTI-LECCIÓN */}
        {/* ============================================================== */}
        <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 fill-amber-700 text-amber-800" />
              <h3 className="text-sm font-bold font-display uppercase tracking-wide">
                Chispas — Lecciones por Niño
              </h3>
            </div>
            <div className="text-xs font-mono bg-amber-600/30 text-amber-950 font-bold px-2.5 py-1 rounded-lg">
              {chispasTotalLessons} lecc. = +{chispasPoints} pts
            </div>
          </div>

          <div className="p-3 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between text-xs text-slate-600">
            <span>Solo niños marcados presentes ({chispasPresent.length}):</span>
            <div className="flex gap-1">
              <button
                onClick={() => onSetAllLessonsCount('chispas', 1)}
                className="text-[11px] font-semibold text-amber-800 hover:underline"
              >
                +1 a todos
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => onSetAllLessonsCount('chispas', 0)}
                className="text-[11px] font-semibold text-slate-500 hover:underline"
              >
                Reiniciar
              </button>
            </div>
          </div>

          {/* Lista de niños en Chispas */}
          <div className="p-4 space-y-3 max-h-[550px] overflow-y-auto">
            {chispasPresent.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No hay niños presentes asignados a Chispas en este momento. Marca su asistencia en la pestaña "Asistencia".
              </div>
            ) : (
              chispasPresent.map((child) => {
                const count = getChildLessonCount(child.id);
                const points = count * 20;

                return (
                  <div
                    key={child.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      count > 0 ? 'bg-amber-50/70 border-amber-300 shadow-xs' : 'bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{child.fullName}</div>
                        <div className="text-[11px] text-slate-500">
                          {count === 0 ? (
                            <span className="text-slate-400">Sin lecciones hoy</span>
                          ) : (
                            <span className="text-amber-800 font-bold">
                              {count} {count === 1 ? 'lección aprendida' : 'lecciones aprendidas'} (+{points} pts)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botones +/- Rápidos */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickCountChange(child.id, count, -1)}
                          disabled={count === 0}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-100 flex items-center justify-center transition-colors active:scale-90"
                          title="Restar 1 lección"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-8 text-center font-mono font-bold text-sm text-slate-900">
                          {count}
                        </div>

                        <button
                          onClick={() => handleQuickCountChange(child.id, count, 1)}
                          className="w-7 h-7 rounded-lg bg-amber-500 text-amber-950 font-bold hover:bg-amber-400 flex items-center justify-center transition-colors active:scale-90 shadow-xs"
                          title="Sumar 1 lección (+20 pts)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Selector de Opciones Rápidas (0, 1, 2, 3, 4, 5, 6, 7, 8, 10 lecciones) */}
                    <div className="pt-2 border-t border-amber-100 flex items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Marcar:
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 10].map((num) => (
                          <button
                            key={num}
                            onClick={() => handleDirectSelect(child.id, num)}
                            className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-lg transition-all ${
                              count === num
                                ? 'bg-amber-500 text-amber-950 shadow-xs scale-105'
                                : 'bg-white hover:bg-amber-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
