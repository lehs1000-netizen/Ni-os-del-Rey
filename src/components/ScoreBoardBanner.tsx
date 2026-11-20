import React from 'react';
import { Flame, Sparkles, Trophy, Users, BookOpen, HelpCircle, Award, ShieldAlert } from 'lucide-react';
import { TEAMS } from '../data/initialData';
import { TeamScoreSummary, WeeklySession } from '../types';

interface ScoreBoardBannerProps {
  antorchasSummary: TeamScoreSummary;
  chispasSummary: TeamScoreSummary;
  activeSession: WeeklySession | undefined;
  onOpenWinner: () => void;
  bannerImage: string;
}

export const ScoreBoardBanner: React.FC<ScoreBoardBannerProps> = ({
  antorchasSummary,
  chispasSummary,
  activeSession,
  onOpenWinner,
  bannerImage,
}) => {
  const diff = antorchasSummary.grandTotal - chispasSummary.grandTotal;
  const isTied = diff === 0;
  const leaderTeam = diff > 0 ? 'antorchas' : 'chispas';
  const margin = Math.abs(diff);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-amber-200/90 shadow-sm">
      {/* Decorative Hero Top Strip */}
      <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400">
        <img
          src={bannerImage}
          alt="Club Niños del Rey"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        <div className="absolute inset-0 px-4 sm:px-6 flex flex-col justify-end pb-3 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-200">
                <span>Club Niños del Rey</span>
                <span aria-hidden="true">·</span>
                <span>{activeSession?.title || 'Programa Semanal'}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-white drop-shadow-xs">
                Marcador General en Tiempo Real
              </h1>
            </div>

            <button
              onClick={onOpenWinner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-yellow-300 hover:bg-yellow-200 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Trophy className="w-3.5 h-3.5 fill-amber-900 text-amber-900" />
              <span>Proclamar Ganador</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leader status bar */}
      <div className="bg-amber-100/70 border-b border-amber-200/70 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-medium text-amber-950">
          <Award className="w-4 h-4 text-amber-700 shrink-0" />
          {isTied ? (
            <span>¡Empate emocionante a {antorchasSummary.grandTotal} puntos! Cualquier detalle definirá al ganador.</span>
          ) : (
            <span>
              <strong className={leaderTeam === 'antorchas' ? 'text-red-700' : 'text-amber-800'}>
                {leaderTeam === 'antorchas' ? 'ANTORCHAS' : 'CHISPAS'}
              </strong>{' '}
              lidera con una ventaja de <strong className="font-mono tabular-nums">+{margin} pts</strong>
            </span>
          )}
        </div>
        <span className="text-slate-500 hidden sm:inline">
          {activeSession ? `Sesión: ${activeSession.date}` : 'Sesión activa'}
        </span>
      </div>

      {/* Two Teams Side-by-Side Scoring Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        
        {/* TEAM 1: ANTORCHAS (Rojo) */}
        <div className="p-4 sm:p-6 bg-gradient-to-b from-red-50/50 to-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-red-500 shadow-sm shrink-0 bg-red-100 flex items-center justify-center">
                  <img
                    src={TEAMS.antorchas.badgeUrl}
                    alt="Antorchas"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <Flame className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-600 fill-red-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-red-700">Equipo 1</span>
                  </div>
                  <h2 className="text-2xl font-bold font-display text-red-800 tracking-tight">
                    {TEAMS.antorchas.name}
                  </h2>
                  <p className="text-xs text-red-600/80 italic">{TEAMS.antorchas.motto}</p>
                </div>
              </div>

              {/* Total points score card */}
              <div className="text-right">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Puntaje Total</span>
                <span className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums text-red-600 tracking-tight">
                  {antorchasSummary.grandTotal}
                </span>
                <span className="text-xs text-slate-500 font-medium block">puntos</span>
              </div>
            </div>

            {/* Category breakdown table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
              
              <div className="p-2.5 rounded-xl bg-white border border-red-100 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-600 mb-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-medium">Juegos</span>
                </div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                  {antorchasSummary.gamesTotal}
                </div>
                <span className="text-[10px] text-slate-500">Rondas 1-3</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-red-100 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-600 mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-medium">Lecciones</span>
                </div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                  {antorchasSummary.lessonsTotal}
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">
                  {antorchasSummary.lessonsLearnedCount} niños × 20
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-red-100 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-600 mb-1">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-medium">Preguntas</span>
                </div>
                <div className={`text-lg font-bold font-mono tabular-nums ${antorchasSummary.questionsTotal >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                  {antorchasSummary.questionsTotal > 0 ? `+${antorchasSummary.questionsTotal}` : antorchasSummary.questionsTotal}
                </div>
                <span className="text-[10px] text-slate-500">
                  {antorchasSummary.questionsCorrectCount} corr / {antorchasSummary.questionsIncorrectCount} err
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-red-100 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-600 mb-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium">Extras - Pen.</span>
                </div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                  +{antorchasSummary.extrasTotal - antorchasSummary.penaltiesTotal}
                </div>
                <span className="text-[10px] text-slate-500">
                  +{antorchasSummary.extrasTotal} / -{antorchasSummary.penaltiesTotal}
                </span>
              </div>

            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-red-100 flex items-center justify-between text-xs text-red-900/80">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-red-600" />
              <span>
                Asistencia hoy: <strong className="font-mono tabular-nums">{antorchasSummary.childrenPresentCount}</strong> de {antorchasSummary.childrenTotalCount} niños
              </span>
            </div>
            <span className="text-[11px] font-semibold text-red-700 bg-red-100/80 px-2 py-0.5 rounded-md">
              Color Rojo
            </span>
          </div>
        </div>

        {/* TEAM 2: CHISPAS (Amarillo) */}
        <div className="p-4 sm:p-6 bg-gradient-to-b from-amber-50/50 to-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-sm shrink-0 bg-amber-100 flex items-center justify-center">
                  <img
                    src={TEAMS.chispas.badgeUrl}
                    alt="Chispas"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <Sparkles className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Equipo 2</span>
                  </div>
                  <h2 className="text-2xl font-bold font-display text-amber-900 tracking-tight">
                    {TEAMS.chispas.name}
                  </h2>
                  <p className="text-xs text-amber-700/80 italic">{TEAMS.chispas.motto}</p>
                </div>
              </div>

              {/* Total points score card */}
              <div className="text-right">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Puntaje Total</span>
                <span className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums text-amber-600 tracking-tight">
                  {chispasSummary.grandTotal}
                </span>
                <span className="text-xs text-slate-500 font-medium block">puntos</span>
              </div>
            </div>

            {/* Category breakdown table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
              
              <div className="p-2.5 rounded-xl bg-white border border-amber-100 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-600 mb-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-medium">Juegos</span>
                </div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                  {chispasSummary.gamesTotal}
                </div>
                <span className="text-[10px] text-slate-500">Rondas 1-3</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-amber-100 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-600 mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-medium">Lecciones</span>
                </div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                  {chispasSummary.lessonsTotal}
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">
                  {chispasSummary.lessonsLearnedCount} niños × 20
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-amber-100 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-600 mb-1">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-medium">Preguntas</span>
                </div>
                <div className={`text-lg font-bold font-mono tabular-nums ${chispasSummary.questionsTotal >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                  {chispasSummary.questionsTotal > 0 ? `+${chispasSummary.questionsTotal}` : chispasSummary.questionsTotal}
                </div>
                <span className="text-[10px] text-slate-500">
                  {chispasSummary.questionsCorrectCount} corr / {chispasSummary.questionsIncorrectCount} err
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-amber-100 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-600 mb-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium">Extras - Pen.</span>
                </div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                  +{chispasSummary.extrasTotal - chispasSummary.penaltiesTotal}
                </div>
                <span className="text-[10px] text-slate-500">
                  +{chispasSummary.extrasTotal} / -{chispasSummary.penaltiesTotal}
                </span>
              </div>

            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-xs text-amber-900/80">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>
                Asistencia hoy: <strong className="font-mono tabular-nums">{chispasSummary.childrenPresentCount}</strong> de {chispasSummary.childrenTotalCount} niños
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
              Color Amarillo
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
