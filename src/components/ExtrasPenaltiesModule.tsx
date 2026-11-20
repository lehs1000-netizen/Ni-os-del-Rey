import React, { useState } from 'react';
import { Award, ShieldAlert, Plus, Minus, Trash2, Flame, Sparkles, AlertTriangle, ListFilter, HelpCircle, Info } from 'lucide-react';
import { ExtraScoreEvent, TeamId } from '../types';
import { sounds } from '../utils/soundEffects';

interface ExtrasPenaltiesModuleProps {
  extrasList: ExtraScoreEvent[];
  onAddEvent: (event: Omit<ExtraScoreEvent, 'id' | 'timestamp'>) => void;
  onRemoveEvent: (id: string) => void;
}

export const ExtrasPenaltiesModule: React.FC<ExtrasPenaltiesModuleProps> = ({
  extrasList,
  onAddEvent,
  onRemoveEvent,
}) => {
  const [teamId, setTeamId] = useState<TeamId>('antorchas');
  const [type, setType] = useState<'extra' | 'penalty'>('extra');
  const [points, setPoints] = useState<number>(20);
  const [reason, setReason] = useState<string>('');
  const [filterView, setFilterView] = useState<'all' | 'penalties' | 'extras'>('all');

  const quickExtraPresets = [
    { label: 'Barras y porras entusiastas', pts: 30 },
    { label: 'Trajo Biblia personal', pts: 20 },
    { label: 'Trajo niño invitado nuevo', pts: 30 },
    { label: 'Disciplina y orden en fila', pts: 25 },
    { label: 'Espíritu de compañerismo y respeto', pts: 20 },
    { label: 'Puntualidad del equipo completo', pts: 15 },
    { label: 'Limpieza y recogida de área', pts: 20 },
    { label: 'Mega bono especial de ánimo', pts: 50 },
  ];

  const quickPenaltyPresets = [
    { label: 'Desorden o gritos no autorizados en la fila', pts: 10 },
    { label: 'Interrupción durante la lección / prédica', pts: 15 },
    { label: 'Falta de respeto, empujones o discusiones', pts: 20 },
    { label: 'Tirar basura o no cuidar los materiales', pts: 10 },
    { label: 'Uso indebido de celulares o distracciones', pts: 15 },
    { label: 'Penalización mayor por desobediencia al líder', pts: 30 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !points) return;
    
    // Sin restricciones de valor: se permite cualquier cantidad
    onAddEvent({
      teamId,
      type,
      points: Math.abs(Number(points)),
      reason: reason.trim(),
    });
    setReason('');
    if (type === 'extra') {
      sounds.playScoreAdd();
    } else {
      sounds.playIncorrect();
    }
  };

  const handleApplyPreset = (team: TeamId, presetType: 'extra' | 'penalty', pts: number, text: string) => {
    onAddEvent({
      teamId: team,
      type: presetType,
      points: pts,
      reason: text,
    });
    if (presetType === 'extra') {
      sounds.playScoreAdd();
    } else {
      sounds.playIncorrect();
    }
  };

  const getTeamTotals = (team: TeamId) => {
    const list = extrasList.filter((e) => e.teamId === team);
    const extrasSum = list
      .filter((e) => e.type === 'extra')
      .reduce((sum, e) => sum + Math.abs(e.points), 0);
    const penaltiesItems = list.filter((e) => e.type === 'penalty');
    const penaltiesSum = penaltiesItems.reduce((sum, e) => sum + Math.abs(e.points), 0);
    return {
      extrasSum,
      penaltiesSum,
      penaltiesCount: penaltiesItems.length,
      net: extrasSum - penaltiesSum,
    };
  };

  const antorchasTotals = getTeamTotals('antorchas');
  const chispasTotals = getTeamTotals('chispas');

  // List filtered for penalties investigation
  const antorchasPenalties = extrasList.filter((e) => e.teamId === 'antorchas' && e.type === 'penalty');
  const chispasPenalties = extrasList.filter((e) => e.teamId === 'chispas' && e.type === 'penalty');

  const filteredHistory = extrasList.filter((e) => {
    if (filterView === 'penalties') return e.type === 'penalty';
    if (filterView === 'extras') return e.type === 'extra';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Categoría 4: Bonificaciones y Disciplina</span>
          </div>
          <h2 className="text-xl font-bold font-display text-slate-900">
            Extras y Descuentos (Sin Restricciones)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingresa puntos a favor o en contra de forma libre sin límites. Consulta el panel dedicado para auditar la <strong>acumulación detallada de penalizaciones</strong> por equipo.
          </p>
        </div>

        {/* Global Net Badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-1.5 text-center">
            <span className="text-[10px] uppercase font-bold text-red-900 block">Antorchas Balance</span>
            <span className="font-mono font-bold text-red-700 text-sm">
              +{antorchasTotals.extrasSum} / -{antorchasTotals.penaltiesSum} pts
            </span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-900 block">Chispas Balance</span>
            <span className="font-mono font-bold text-amber-800 text-sm">
              +{chispasTotals.extrasSum} / -{chispasTotals.penaltiesSum} pts
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN ESPECIAL: ACUMULACIÓN DETALLADA DE PUNTOS EN CONTRA */}
      {/* ============================================================== */}
      <div className="bg-linear-to-r from-rose-50 via-white to-amber-50 rounded-2xl border-2 border-rose-300 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-900">
                Auditoría y Acumulación de Puntos en Contra (Penalizaciones)
              </h3>
              <p className="text-xs text-slate-500">
                Registro detallado con motivo exacto, hora y monto del descuento para total transparencia.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg">
              Total Descontado: -{antorchasTotals.penaltiesSum + chispasTotals.penaltiesSum} pts
            </span>
          </div>
        </div>

        {/* 2 Columnas de Descuentos Detallados por Equipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* ANTORCHAS PENALIDADES DETALLADAS */}
          <div className="bg-white rounded-xl border border-red-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-red-100 mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-600" />
                <span className="font-bold text-xs uppercase text-red-950">
                  Descuentos Antorchas ({antorchasPenalties.length} faltas)
                </span>
              </div>
              <span className="font-mono font-extrabold text-sm text-red-600 bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-200">
                -{antorchasTotals.penaltiesSum} pts
              </span>
            </div>

            {antorchasPenalties.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                ¡Excelente! Antorchas no tiene penalizaciones registradas hoy.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {antorchasPenalties.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-red-50/60 border border-red-100 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-900 truncate">
                        {item.reason}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Hora: {item.timestamp}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-red-600">
                        -{item.points} pts
                      </span>
                      <button
                        onClick={() => onRemoveEvent(item.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-white"
                        title="Anular penalización"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CHISPAS PENALIDADES DETALLADAS */}
          <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-amber-100 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-xs uppercase text-amber-950">
                  Descuentos Chispas ({chispasPenalties.length} faltas)
                </span>
              </div>
              <span className="font-mono font-extrabold text-sm text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                -{chispasTotals.penaltiesSum} pts
              </span>
            </div>

            {chispasPenalties.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                ¡Excelente! Chispas no tiene penalizaciones registradas hoy.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {chispasPenalties.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-200 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-900 truncate">
                        {item.reason}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Hora: {item.timestamp}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-amber-700">
                        -{item.points} pts
                      </span>
                      <button
                        onClick={() => onRemoveEvent(item.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-white"
                        title="Anular penalización"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* FORMULARIO DE INGRESO MANUAL LIBRE (SIN RESTRICCIONES) */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <h3 className="text-sm font-bold font-display text-slate-900 mb-3 flex items-center gap-2">
          <span>Ingreso Manual de Puntos (A favor o En contra)</span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-normal">
            Sin restricciones numéricas
          </span>
        </h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Equipo */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">Equipo Destino</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value as TeamId)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:border-amber-500 outline-hidden"
            >
              <option value="antorchas">🔴 Antorchas (Rojo)</option>
              <option value="chispas">🟡 Chispas (Amarillo)</option>
            </select>
          </div>

          {/* Tipo: Extra o Penalización */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Ajuste</label>
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('extra')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  type === 'extra'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Extra (A favor)
              </button>
              <button
                type="button"
                onClick={() => setType('penalty')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  type === 'penalty'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                - Descuento (En contra)
              </button>
            </div>
          </div>

          {/* Puntos (Cualquier valor numérico) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Puntos</label>
            <input
              type="number"
              min="1"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              placeholder="Ej: 25"
              className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden"
            />
          </div>

          {/* Motivo Detallado */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">Motivo o Justificación *</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={type === 'extra' ? 'Ej: Trajeron bandera del club' : 'Ej: Desorden en la fila'}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden"
            />
          </div>

          {/* Botón Aplicar */}
          <div className="sm:col-span-1">
            <button
              type="submit"
              className={`w-full py-2 px-3 text-xs font-bold rounded-xl text-white shadow-xs transition-transform active:scale-95 ${
                type === 'extra' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              Aplicar
            </button>
          </div>
        </form>
      </div>

      {/* ============================================================== */}
      {/* BOTONES RÁPIDOS DE BONIFICACIÓN Y PENALIZACIÓN */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Atajos de Extras (+ Puntos) */}
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase text-emerald-950">
              Atajos Rápidos: Puntos a Favor (+)
            </h4>
          </div>
          <div className="space-y-1.5">
            {quickExtraPresets.map((preset, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/40 border border-emerald-100 text-xs"
              >
                <span className="text-slate-800 font-medium">{preset.label} (+{preset.pts} pts)</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleApplyPreset('antorchas', 'extra', preset.pts, preset.label)}
                    className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-900 rounded-md hover:bg-red-200"
                  >
                    + Antorchas
                  </button>
                  <button
                    onClick={() => handleApplyPreset('chispas', 'extra', preset.pts, preset.label)}
                    className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded-md hover:bg-amber-200"
                  >
                    + Chispas
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atajos de Penalizaciones (- Puntos) */}
        <div className="bg-white rounded-2xl border border-rose-200 shadow-xs p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h4 className="text-xs font-bold uppercase text-rose-950">
              Atajos Rápidos: Descuentos y Penalizaciones (-)
            </h4>
          </div>
          <div className="space-y-1.5">
            {quickPenaltyPresets.map((preset, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-rose-50/40 border border-rose-100 text-xs"
              >
                <span className="text-slate-800 font-medium">{preset.label} (-{preset.pts} pts)</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleApplyPreset('antorchas', 'penalty', preset.pts, preset.label)}
                    className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-md hover:bg-red-500"
                  >
                    - Antorchas
                  </button>
                  <button
                    onClick={() => handleApplyPreset('chispas', 'penalty', preset.pts, preset.label)}
                    className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-amber-950 rounded-md hover:bg-amber-400"
                  >
                    - Chispas
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* HISTORIAL COMPLETO DE MOVIMIENTOS */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Historial de Ajustes de la Sesión ({filteredHistory.length})
          </h4>

          <div className="flex gap-1">
            <button
              onClick={() => setFilterView('all')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                filterView === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterView('penalties')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                filterView === 'penalties' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Solo Descuentos ({antorchasTotals.penaltiesCount + chispasTotals.penaltiesCount})
            </button>
            <button
              onClick={() => setFilterView('extras')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                filterView === 'extras' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Solo Extras
            </button>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No hay registros que coincidan con el filtro actual.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {filteredHistory.map((item) => {
              const isExtra = item.type === 'extra';
              const isAntorchas = item.teamId === 'antorchas';

              return (
                <div key={item.id} className="pt-1.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isAntorchas ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {isAntorchas ? 'Antorchas' : 'Chispas'}
                    </span>
                    <span className="font-semibold text-slate-900 truncate">{item.reason}</span>
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      {item.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-mono font-bold ${
                        isExtra ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isExtra ? `+${item.points}` : `-${item.points}`} pts
                    </span>
                    <button
                      onClick={() => onRemoveEvent(item.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-slate-100"
                      title="Eliminar este registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
