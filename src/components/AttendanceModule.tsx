import React, { useState } from 'react';
import {
  UserPlus,
  CheckCircle2,
  XCircle,
  Search,
  Flame,
  Sparkles,
  Calendar,
  Trash2,
  Edit2,
  Shuffle,
  Users,
  UserCheck,
  Crown,
  ChevronRight,
  ArrowRightLeft,
  Sparkle,
  Plus
} from 'lucide-react';
import { Child, Leader, LeaderAssignmentRecord, TeamId, WeeklySession } from '../types';
import { sounds } from '../utils/soundEffects';

interface AttendanceModuleProps {
  childrenList: Child[];
  leadersList: Leader[];
  activeSessionId: string;
  sessions: WeeklySession[];
  attendanceRecord: Record<string, { childId: string; present: boolean; assignedTeamId: TeamId; markedAt: string }>;
  leaderAssignments: Record<string, LeaderAssignmentRecord>;
  onToggleAttendance: (childId: string, present: boolean) => void;
  onAssignChildTeam: (childId: string, teamId: TeamId) => void;
  onRandomizeAllChildrenTeams: () => void;
  onSetAllAttendance: (teamId: TeamId | 'all', present: boolean) => void;
  onAddChild: (child: Omit<Child, 'id' | 'registeredDate'>) => void;
  onUpdateChild: (child: Child) => void;
  onDeleteChild: (childId: string) => void;
  // Líderes
  onToggleLeaderAttendance: (leaderId: string, present: boolean) => void;
  onAssignLeaderTeam: (leaderId: string, teamId: TeamId) => void;
  onRandomizeLeaders: () => void;
  onAddLeader: (leader: Omit<Leader, 'id'>) => void;
  onDeleteLeader: (leaderId: string) => void;
  // Sesiones
  onSelectSession: (sessionId: string) => void;
  onCreateSession: (session: Omit<WeeklySession, 'id' | 'createdAt'>) => void;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  childrenList,
  leadersList,
  activeSessionId,
  sessions,
  attendanceRecord,
  leaderAssignments,
  onToggleAttendance,
  onAssignChildTeam,
  onRandomizeAllChildrenTeams,
  onSetAllAttendance,
  onAddChild,
  onUpdateChild,
  onDeleteChild,
  onToggleLeaderAttendance,
  onAssignLeaderTeam,
  onRandomizeLeaders,
  onAddLeader,
  onDeleteLeader,
  onSelectSession,
  onCreateSession,
}) => {
  const [activeTab, setActiveTab] = useState<'ninos' | 'lideres'>('ninos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showAddLeaderModal, setShowAddLeaderModal] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{
    type: 'child' | 'leader';
    id: string;
    name: string;
  } | null>(null);

  // New Child form state
  const [childFormData, setChildFormData] = useState({
    fullName: '',
    age: 8,
    guardianName: '',
    guardianPhone: '',
    notes: '',
  });

  // New Leader form state
  const [leaderFormData, setLeaderFormData] = useState({
    fullName: '',
    role: 'Guía y Dinamizador',
    phone: '',
  });

  // New Session form state
  const [newSessionData, setNewSessionData] = useState({
    date: new Date().toISOString().slice(0, 10),
    title: 'Sábado de Bendición',
    verse: 'Jehová es mi fortaleza y mi cántico - Éxodo 15:2',
    notes: '',
  });

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Get assigned team for a child in this session (default fallback to antorchas if unassigned)
  const getChildTeam = (childId: string): TeamId => {
    return attendanceRecord[childId]?.assignedTeamId || 'antorchas';
  };

  const isChildPresent = (childId: string): boolean => {
    return attendanceRecord[childId]?.present === true;
  };

  // Filter children by assigned team in this session
  const filterChildrenByTeam = (team: TeamId) => {
    return childrenList
      .filter((c) => c.active && getChildTeam(c.id) === team)
      .filter((c) => c.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const antorchasKids = filterChildrenByTeam('antorchas');
  const chispasKids = filterChildrenByTeam('chispas');

  const getTeamAttendanceStats = (team: TeamId) => {
    const list = childrenList.filter((c) => c.active && getChildTeam(c.id) === team);
    const present = list.filter((c) => isChildPresent(c.id)).length;
    return {
      total: list.length,
      present,
      pct: list.length ? Math.round((present / list.length) * 100) : 0,
    };
  };

  const antorchasStats = getTeamAttendanceStats('antorchas');
  const chispasStats = getTeamAttendanceStats('chispas');

  // Leaders
  const getLeaderTeam = (leaderId: string): TeamId => {
    return leaderAssignments[leaderId]?.assignedTeamId || 'antorchas';
  };

  const isLeaderPresent = (leaderId: string): boolean => {
    return leaderAssignments[leaderId]?.present === true;
  };

  const antorchasLeaders = leadersList.filter((l) => l.active && getLeaderTeam(l.id) === 'antorchas');
  const chispasLeaders = leadersList.filter((l) => l.active && getLeaderTeam(l.id) === 'chispas');

  // Handlers
  const handleCreateChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childFormData.fullName.trim()) return;
    onAddChild({
      fullName: childFormData.fullName.trim(),
      age: Number(childFormData.age) || undefined,
      guardianName: childFormData.guardianName.trim() || undefined,
      guardianPhone: childFormData.guardianPhone.trim() || undefined,
      notes: childFormData.notes.trim() || undefined,
      active: true,
    });
    setChildFormData({
      fullName: '',
      age: 8,
      guardianName: '',
      guardianPhone: '',
      notes: '',
    });
    setShowAddChildModal(false);
    sounds.playScoreAdd();
  };

  const handleCreateLeader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderFormData.fullName.trim()) return;
    onAddLeader({
      fullName: leaderFormData.fullName.trim(),
      role: leaderFormData.role.trim() || 'Líder',
      phone: leaderFormData.phone.trim() || undefined,
      active: true,
    });
    setLeaderFormData({
      fullName: '',
      role: 'Guía y Dinamizador',
      phone: '',
    });
    setShowAddLeaderModal(false);
    sounds.playScoreAdd();
  };

  const handleUpdateChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild || !editingChild.fullName.trim()) return;
    onUpdateChild(editingChild);
    setEditingChild(null);
    sounds.playScoreAdd();
  };

  const handleCreateSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionData.date || !newSessionData.title.trim()) return;
    onCreateSession({
      date: newSessionData.date,
      title: newSessionData.title.trim(),
      verse: newSessionData.verse.trim() || undefined,
      notes: newSessionData.notes.trim() || undefined,
      status: 'active',
    });
    setShowNewSessionModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Sábado y Selección de Sesión */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Módulo 1: Registro, Asistencia y Dinámica Semanal</span>
          </div>
          <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <span>Asistencia y Asignación de Equipos</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
              1 Día a la Semana
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Los niños y líderes registrados pueden ser sorteados aleatoriamente o enviados al equipo que les toque este sábado.
          </p>
        </div>

        {/* Selector de Sesión y Acciones */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeSessionId}
            onChange={(e) => onSelectSession(e.target.value)}
            className="text-xs font-medium bg-amber-50/70 border border-amber-300 text-amber-950 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-hidden"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                📅 {s.date} - {s.title} {s.status === 'completed' ? '✓ (Cerrado)' : '● (Activo)'}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowNewSessionModal(true)}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Nuevo Sábado</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector: Niños vs Líderes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('ninos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ninos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>Niños Registrados ({childrenList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('lideres')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'lideres'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Crown className="w-4 h-4 text-purple-600" />
            <span>Líderes de Equipo ({leadersList.length})</span>
          </button>
        </div>

        {/* Dynamic Toolbar Actions */}
        <div className="flex items-center gap-2 px-1">
          {activeTab === 'ninos' ? (
            <>
              <button
                onClick={() => {
                  onRandomizeAllChildrenTeams();
                  sounds.playCelebration();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95"
                title="Repartir aleatoriamente a los niños en partes iguales entre Antorchas y Chispas"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Sortear Equipos Hoy (Aleatorio)</span>
              </button>

              <button
                onClick={() => setShowAddChildModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Registrar Niño</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  onRandomizeLeaders();
                  sounds.playCelebration();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95"
                title="Sortear aleatoriamente los líderes entre ambos equipos para esta sesión"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Sortear Líderes (Aleatorio)</span>
              </button>

              <button
                onClick={() => setShowAddLeaderModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Registrar Líder</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* VISTA 1: NIÑOS (CON ASISTENCIA Y ASIGNACIÓN DINÁMICA A EQUIPO) */}
      {/* ============================================================== */}
      {activeTab === 'ninos' && (
        <div className="space-y-4">
          {/* Search bar & quick presence actions */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar niño por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto justify-end">
              <span className="text-slate-500 text-[11px] font-medium mr-1">Marcar todos:</span>
              <button
                onClick={() => onSetAllAttendance('all', true)}
                className="px-2.5 py-1.5 rounded-lg font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                ✓ Todos Presentes
              </button>
              <button
                onClick={() => onSetAllAttendance('all', false)}
                className="px-2.5 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                ✕ Desmarcar Todos
              </button>
            </div>
          </div>

          {/* Dos Columnas Enfrentadas de Equipos para este Sábado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* EQUIPO 1: ANTORCHAS */}
            <div className="bg-white rounded-2xl border-2 border-red-200 shadow-xs overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Flame className="w-5 h-5 fill-white text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display leading-tight">ANTORCHAS (Rojo)</h3>
                    <p className="text-[11px] text-red-100">
                      {antorchasStats.present} presentes de {antorchasStats.total} asignados hoy ({antorchasStats.pct}%)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onSetAllAttendance('antorchas', true)}
                  className="px-2 py-1 text-[11px] font-semibold bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                >
                  ✓ Asistencia Equipo
                </button>
              </div>

              <div className="p-3 bg-red-50/40 border-b border-red-100 flex items-center justify-between text-xs text-red-900 font-medium">
                <span>Niños asignados este sábado:</span>
                <span className="font-bold">{antorchasKids.length} niños</span>
              </div>

              {/* Children List Antorchas */}
              <div className="p-3 divide-y divide-slate-100 space-y-2 max-h-[500px] overflow-y-auto">
                {antorchasKids.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No hay niños asignados a Antorchas hoy. Puedes usar el botón <strong>"Sortear Equipos"</strong> o cambiar un niño desde el otro equipo.
                  </div>
                ) : (
                  antorchasKids.map((child) => {
                    const present = isChildPresent(child.id);
                    return (
                      <div
                        key={child.id}
                        className={`pt-2 flex items-center justify-between gap-2 p-2 rounded-xl transition-all ${
                          present ? 'bg-red-50/70 border border-red-200' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Botón de Asistencia */}
                          <button
                            onClick={() => {
                              onToggleAttendance(child.id, !present);
                              if (!present) sounds.playScoreAdd();
                            }}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform active:scale-90 shrink-0 ${
                              present
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                            title={present ? 'Presente (clic para ausente)' : 'Ausente (clic para presente)'}
                          >
                            {present ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate">{child.fullName}</span>
                              {child.age && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-medium">
                                  {child.age}a
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {present ? (
                                <span className="text-emerald-600 font-semibold">● Presente hoy</span>
                              ) : (
                                <span className="text-slate-400">○ Ausente</span>
                              )}
                              {child.guardianPhone && ` · Tel: ${child.guardianPhone}`}
                            </div>
                          </div>
                        </div>

                        {/* Reasignar de Equipo o Editar */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              onAssignChildTeam(child.id, 'chispas');
                              sounds.playScoreAdd();
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition-colors"
                            title="Cambiar este niño a Chispas para hoy"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span className="hidden sm:inline">A Chispas</span>
                          </button>

                          <button
                            onClick={() => setEditingChild(child)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar datos del niño"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDeleteTarget({ type: 'child', id: child.id, name: child.fullName })
                            }
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar niño"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* EQUIPO 2: CHISPAS */}
            <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-xs overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/40 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 fill-amber-700 text-amber-800" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display leading-tight">CHISPAS (Amarillo)</h3>
                    <p className="text-[11px] text-amber-900">
                      {chispasStats.present} presentes de {chispasStats.total} asignados hoy ({chispasStats.pct}%)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onSetAllAttendance('chispas', true)}
                  className="px-2 py-1 text-[11px] font-semibold bg-white/40 hover:bg-white/60 rounded-lg text-amber-950 transition-colors"
                >
                  ✓ Asistencia Equipo
                </button>
              </div>

              <div className="p-3 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between text-xs text-amber-950 font-medium">
                <span>Niños asignados este sábado:</span>
                <span className="font-bold">{chispasKids.length} niños</span>
              </div>

              {/* Children List Chispas */}
              <div className="p-3 divide-y divide-slate-100 space-y-2 max-h-[500px] overflow-y-auto">
                {chispasKids.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No hay niños asignados a Chispas hoy. Puedes usar el botón <strong>"Sortear Equipos"</strong> o cambiar un niño desde el otro equipo.
                  </div>
                ) : (
                  chispasKids.map((child) => {
                    const present = isChildPresent(child.id);
                    return (
                      <div
                        key={child.id}
                        className={`pt-2 flex items-center justify-between gap-2 p-2 rounded-xl transition-all ${
                          present ? 'bg-amber-50/70 border border-amber-200' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Botón de Asistencia */}
                          <button
                            onClick={() => {
                              onToggleAttendance(child.id, !present);
                              if (!present) sounds.playScoreAdd();
                            }}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform active:scale-90 shrink-0 ${
                              present
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                            title={present ? 'Presente (clic para ausente)' : 'Ausente (clic para presente)'}
                          >
                            {present ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate">{child.fullName}</span>
                              {child.age && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-medium">
                                  {child.age}a
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {present ? (
                                <span className="text-emerald-600 font-semibold">● Presente hoy</span>
                              ) : (
                                <span className="text-slate-400">○ Ausente</span>
                              )}
                              {child.guardianPhone && ` · Tel: ${child.guardianPhone}`}
                            </div>
                          </div>
                        </div>

                        {/* Reasignar de Equipo o Editar */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              onAssignChildTeam(child.id, 'antorchas');
                              sounds.playScoreAdd();
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-red-100 hover:bg-red-200 text-red-900 rounded-lg transition-colors"
                            title="Cambiar este niño a Antorchas para hoy"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span className="hidden sm:inline">A Antorchas</span>
                          </button>

                          <button
                            onClick={() => setEditingChild(child)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar datos del niño"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDeleteTarget({ type: 'child', id: child.id, name: child.fullName })
                            }
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar niño"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VISTA 2: LÍDERES (REGISTRO, ASISTENCIA Y ASIGNACIÓN ALEATORIA) */}
      {/* ============================================================== */}
      {activeTab === 'lideres' && (
        <div className="space-y-4">
          <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-600" />
                <span>Líderes y Guías del Programa</span>
              </h3>
              <p className="text-xs text-purple-800/80 mt-0.5">
                Cada sábado los líderes pueden ser sorteados aleatoriamente o asignados al equipo que apoyarán en dinámicas, alabanzas y porras.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onRandomizeLeaders();
                  sounds.playCelebration();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-xs transition-transform active:scale-95"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Sortear Líderes Aleatorio</span>
              </button>

              <button
                onClick={() => setShowAddLeaderModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-white text-purple-900 border border-purple-300 hover:bg-purple-100 rounded-xl shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Nuevo Líder</span>
              </button>
            </div>
          </div>

          {/* Dos Columnas de Líderes por Equipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* LÍDERES ANTORCHAS */}
            <div className="bg-white rounded-2xl border-2 border-red-200 shadow-xs p-4">
              <div className="flex items-center justify-between pb-3 border-b border-red-100">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-600" />
                  <span className="font-bold text-sm text-red-950">Líderes en ANTORCHAS ({antorchasLeaders.length})</span>
                </div>
              </div>

              <div className="mt-3 divide-y divide-slate-100 space-y-2">
                {antorchasLeaders.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">Sin líderes asignados a Antorchas hoy.</p>
                ) : (
                  antorchasLeaders.map((leader) => {
                    const present = isLeaderPresent(leader.id);
                    return (
                      <div key={leader.id} className="pt-2 flex items-center justify-between gap-2 p-2 rounded-xl bg-red-50/50">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => onToggleLeaderAttendance(leader.id, !present)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                              present ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                            }`}
                            title={present ? 'Líder Presente' : 'Líder Ausente'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{leader.fullName}</div>
                            <div className="text-[10px] text-slate-500">{leader.role || 'Líder'} {leader.phone && `· ${leader.phone}`}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onAssignLeaderTeam(leader.id, 'chispas')}
                            className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-900 rounded-lg hover:bg-amber-200 transition-colors"
                          >
                            Mover a Chispas
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDeleteTarget({ type: 'leader', id: leader.id, name: leader.fullName })
                            }
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                            title="Eliminar líder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* LÍDERES CHISPAS */}
            <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-xs p-4">
              <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-sm text-amber-950">Líderes en CHISPAS ({chispasLeaders.length})</span>
                </div>
              </div>

              <div className="mt-3 divide-y divide-slate-100 space-y-2">
                {chispasLeaders.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">Sin líderes asignados a Chispas hoy.</p>
                ) : (
                  chispasLeaders.map((leader) => {
                    const present = isLeaderPresent(leader.id);
                    return (
                      <div key={leader.id} className="pt-2 flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-50/50">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => onToggleLeaderAttendance(leader.id, !present)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                              present ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                            }`}
                            title={present ? 'Líder Presente' : 'Líder Ausente'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{leader.fullName}</div>
                            <div className="text-[10px] text-slate-500">{leader.role || 'Líder'} {leader.phone && `· ${leader.phone}`}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onAssignLeaderTeam(leader.id, 'antorchas')}
                            className="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-900 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Mover a Antorchas
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDeleteTarget({ type: 'leader', id: leader.id, name: leader.fullName })
                            }
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                            title="Eliminar líder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: REGISTRAR NUEVO NIÑO */}
      {/* ============================================================== */}
      {showAddChildModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200">
            <h3 className="text-lg font-bold font-display text-slate-900 mb-1">
              Registrar Nuevo Niño en el Club
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              El niño quedará guardado permanentemente en el club y podrá ser asignado al equipo que corresponda cada sábado.
            </p>

            <form onSubmit={handleCreateChild} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Daniel Antonio Ruiz"
                  value={childFormData.fullName}
                  onChange={(e) => setChildFormData({ ...childFormData, fullName: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Edad (Años)</label>
                <input
                  type="number"
                  min="3"
                  max="18"
                  value={childFormData.age}
                  onChange={(e) => setChildFormData({ ...childFormData, age: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Tutor</label>
                  <input
                    type="text"
                    placeholder="Ej: María Ruiz"
                    value={childFormData.guardianName}
                    onChange={(e) => setChildFormData({ ...childFormData, guardianName: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Contacto</label>
                  <input
                    type="tel"
                    placeholder="Ej: 555-1234"
                    value={childFormData.guardianPhone}
                    onChange={(e) => setChildFormData({ ...childFormData, guardianPhone: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notas o Alergias</label>
                <textarea
                  rows={2}
                  placeholder="Observaciones médicas, alergias o notas..."
                  value={childFormData.notes}
                  onChange={(e) => setChildFormData({ ...childFormData, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddChildModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-xl shadow-xs"
                >
                  Guardar Niño
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: REGISTRAR LÍDER */}
      {/* ============================================================== */}
      {showAddLeaderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-200">
            <h3 className="text-lg font-bold font-display text-slate-900 mb-1">
              Registrar Líder / Maestro del Club
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Podrá ser asignado o sorteado a Antorchas o Chispas cada sábado.
            </p>

            <form onSubmit={handleCreateLeader} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Maestra Claudia Morales"
                  value={leaderFormData.fullName}
                  onChange={(e) => setLeaderFormData({ ...leaderFormData, fullName: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rol / Función</label>
                <input
                  type="text"
                  placeholder="Ej: Guía de Juegos, Maestro de Versículo..."
                  value={leaderFormData.role}
                  onChange={(e) => setLeaderFormData({ ...leaderFormData, role: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  placeholder="Ej: 555-8899"
                  value={leaderFormData.phone}
                  onChange={(e) => setLeaderFormData({ ...leaderFormData, phone: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLeaderModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-xs"
                >
                  Guardar Líder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: EDITAR NIÑO */}
      {/* ============================================================== */}
      {editingChild && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200">
            <h3 className="text-lg font-bold font-display text-slate-900 mb-3">
              Editar Datos de {editingChild.fullName}
            </h3>

            <form onSubmit={handleUpdateChildSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editingChild.fullName}
                  onChange={(e) => setEditingChild({ ...editingChild, fullName: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Edad</label>
                  <input
                    type="number"
                    min="3"
                    max="18"
                    value={editingChild.age || ''}
                    onChange={(e) => setEditingChild({ ...editingChild, age: Number(e.target.value) || undefined })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={editingChild.guardianPhone || ''}
                    onChange={(e) => setEditingChild({ ...editingChild, guardianPhone: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tutor</label>
                <input
                  type="text"
                  value={editingChild.guardianName || ''}
                  onChange={(e) => setEditingChild({ ...editingChild, guardianName: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingChild(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-xl"
                >
                  Actualizar Datos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: CREAR NUEVA SESIÓN / SÁBADO */}
      {/* ============================================================== */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200">
            <h3 className="text-lg font-bold font-display text-slate-900 mb-1">
              Crear Nuevo Sábado del Club
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Inicia una nueva jornada semanal para registrar asistencia y calcular puntuaciones desde cero.
            </p>

            <form onSubmit={handleCreateSessionSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha del Programa *</label>
                <input
                  type="date"
                  required
                  value={newSessionData.date}
                  onChange={(e) => setNewSessionData({ ...newSessionData, date: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título de la Jornada *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sábado de Misioneros Valientes"
                  value={newSessionData.title}
                  onChange={(e) => setNewSessionData({ ...newSessionData, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Versículo Lema de la Semana</label>
                <input
                  type="text"
                  placeholder="Ej: Filipenses 4:13"
                  value={newSessionData.verse}
                  onChange={(e) => setNewSessionData({ ...newSessionData, verse: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs"
                >
                  Abrir Jornada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/* MODAL 5: CONFIRMAR ELIMINACIÓN DE NIÑO O LÍDER */}
      {/* ============================================================== */}
      {confirmDeleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-red-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-display text-slate-900 text-center">
              {confirmDeleteTarget.type === 'child' ? '¿Eliminar Niño del Registro?' : '¿Eliminar Líder del Registro?'}
            </h3>
            <p className="text-xs text-slate-600 text-center mt-1.5">
              Estás a punto de eliminar a <strong>{confirmDeleteTarget.name}</strong>. Esta acción lo quitará de la lista compartida en todos los celulares.
            </p>

            <div className="flex items-center justify-center gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setConfirmDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = confirmDeleteTarget;
                  setConfirmDeleteTarget(null);
                  if (target.type === 'child') {
                    onDeleteChild(target.id);
                  } else {
                    onDeleteLeader(target.id);
                  }
                }}
                className="flex-1 px-4 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
