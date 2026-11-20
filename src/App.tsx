import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { ASSET_IMAGES, INITIAL_STATE } from './data/initialData';
import {
  AttendanceRecord,
  Child,
  ClubState,
  ExtraScoreEvent,
  GameRound,
  Leader,
  LeaderAssignmentRecord,
  LessonRecord,
  QuestionEvent,
  TeamId,
  WeeklySession,
} from './types';
import { computeTeamSummary, loadClubState, saveClubState } from './utils/storage';
import { sounds } from './utils/soundEffects';
import {
  addExtraInCloud,
  addQuestionInCloud,
  ADMIN_EMAIL,
  batchSetLessonsInCloud,
  batchUpdateAttendanceInCloud,
  batchUpdateLeaderAssignmentsInCloud,
  checkIsClubMember,
  clearQuestionsInCloud,
  ClubMemberData,
  ClubPrivateConfigData,
  completeSessionInCloud,
  ContactsMap,
  createChildInCloud,
  createLeaderInCloud,
  createSessionInCloud,
  deleteChildInCloud,
  deleteLeaderInCloud,
  joinClubWithCode,
  removeExtraInCloud,
  removeGameRoundInCloud,
  removeMemberInCloud,
  removeQuestionInCloud,
  saveGameRoundInCloud,
  savePrivateConfigInCloud,
  seedClubStateToCloud,
  setChildAttendanceInCloud,
  setLeaderAssignmentInCloud,
  setLessonCountInCloud,
  subscribeToChildren,
  subscribeToClubRoot,
  subscribeToLeaders,
  subscribeToMembers,
  subscribeToPrivateConfig,
  subscribeToPrivateContacts,
  subscribeToSessionDetails,
  subscribeToSessions,
  tryAutoJoinClub,
  updateChildInCloud,
  updateClubSettings,
} from './services/clubSyncService';

import { Header } from './components/Header';
import { CloudSyncBar } from './components/CloudSyncBar';
import { CloudAccessModal } from './components/CloudAccessModal';
import { ScoreBoardBanner } from './components/ScoreBoardBanner';
import { AttendanceModule } from './components/AttendanceModule';
import { GamesModule } from './components/GamesModule';
import { LessonsModule } from './components/LessonsModule';
import { QuestionsModule } from './components/QuestionsModule';
import { ExtrasPenaltiesModule } from './components/ExtrasPenaltiesModule';
import { WinnerScreenModal } from './components/WinnerScreenModal';
import { ArchitectureDocsModal } from './components/ArchitectureDocsModal';

const MIGRATION_FLAG_KEY = 'ninos_del_rey_cloud_migrated_v1';

export default function App() {
  // Auth & Cloud State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [cloudExists, setCloudExists] = useState<boolean>(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(true);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cloud Slices
  const [cloudCurrentSessionId, setCloudCurrentSessionId] = useState<string>(INITIAL_STATE.currentSessionId);
  const [viewSessionId, setViewSessionId] = useState<string>(INITIAL_STATE.currentSessionId);
  const [cloudSoundEnabled, setCloudSoundEnabled] = useState<boolean>(true);
  const [cloudChildren, setCloudChildren] = useState<Child[]>([]);
  const [cloudLeaders, setCloudLeaders] = useState<Leader[]>([]);
  const [cloudSessions, setCloudSessions] = useState<WeeklySession[]>([]);
  const [cloudAttendance, setCloudAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [cloudLeaderAssignments, setCloudLeaderAssignments] = useState<Record<string, LeaderAssignmentRecord>>({});
  const [cloudLessons, setCloudLessons] = useState<Record<string, LessonRecord>>({});
  const [cloudGameRounds, setCloudGameRounds] = useState<GameRound[]>([]);
  const [cloudQuestions, setCloudQuestions] = useState<QuestionEvent[]>([]);
  const [cloudExtras, setCloudExtras] = useState<ExtraScoreEvent[]>([]);

  // Private Admin / Member data
  const [privateContacts, setPrivateContacts] = useState<ContactsMap>({ childContacts: {}, leaderContacts: {} });
  const [privateConfig, setPrivateConfig] = useState<ClubPrivateConfigData | null>(null);
  const [members, setMembers] = useState<ClubMemberData[]>([]);

  // Fallback local state (used before cloud is initialized for the first time)
  const [localFallbackState, setLocalFallbackState] = useState<ClubState>(() => loadClubState());
  const [hasLocalDataToMigrate, setHasLocalDataToMigrate] = useState<boolean>(() => {
    try {
      const migrated = localStorage.getItem(MIGRATION_FLAG_KEY);
      const rawV2 = localStorage.getItem('ninos_del_rey_club_data_v2');
      const rawV1 = localStorage.getItem('ninos_del_rey_club_data_v1');
      return !migrated && Boolean(rawV2 || rawV1);
    } catch {
      return false;
    }
  });

  // UI state
  const [currentTab, setCurrentTab] = useState<string>('marcador');
  const [showWinnerModal, setShowWinnerModal] = useState<boolean>(false);
  const [showArchDocs, setShowArchDocs] = useState<boolean>(false);
  const [showAccessModal, setShowAccessModal] = useState<boolean>(false);

  const isAdmin = Boolean(
    user && user.emailVerified && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
  const canEdit = isAdmin || isMember;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (firebaseUser && firebaseUser.emailVerified) {
        const email = firebaseUser.email || '';
        if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          setIsMember(true);
        } else {
          try {
            const alreadyMember = await checkIsClubMember(firebaseUser.uid);
            if (alreadyMember) {
              setIsMember(true);
            } else {
              const autoJoined = await tryAutoJoinClub(
                firebaseUser.uid,
                email,
                firebaseUser.displayName || email
              );
              setIsMember(autoJoined);
            }
          } catch {
            setIsMember(false);
          }
        }
      } else {
        setIsMember(false);
      }
    });
    return () => unsub();
  }, []);

  // 2. Real-time Club Root, Children, Leaders, Sessions Listeners
  useEffect(() => {
    const unsubRoot = subscribeToClubRoot((root) => {
      setCloudExists(root.exists);
      setIsLoadingCloud(false);
      if (root.exists) {
        if (root.currentSessionId) {
          setCloudCurrentSessionId(root.currentSessionId);
          setViewSessionId(root.currentSessionId);
        }
        if (typeof root.soundEnabled === 'boolean') {
          setCloudSoundEnabled(root.soundEnabled);
        }
      }
    });

    const unsubKids = subscribeToChildren((list) => setCloudChildren(list));
    const unsubLeaders = subscribeToLeaders((list) => setCloudLeaders(list));
    const unsubSessions = subscribeToSessions((list) => setCloudSessions(list));

    return () => {
      unsubRoot();
      unsubKids();
      unsubLeaders();
      unsubSessions();
    };
  }, []);

  // 3. Auto-seed Cloud on first Admin login if Cloud DB is still empty
  useEffect(() => {
    if (authReady && isAdmin && !isLoadingCloud && !cloudExists && !isMigrating) {
      const seedInitial = async () => {
        setIsMigrating(true);
        try {
          const localToUpload = loadClubState();
          await seedClubStateToCloud(localToUpload, user?.email || ADMIN_EMAIL);
          localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
          setHasLocalDataToMigrate(false);
          showToast('¡Nube inicializada! Todos los celulares ahora comparten estos datos.');
        } catch (err) {
          console.error('Error seeding cloud:', err);
        } finally {
          setIsMigrating(false);
        }
      };
      seedInitial();
    }
  }, [authReady, isAdmin, isLoadingCloud, cloudExists, isMigrating, user]);

  // 4. Real-time Active Session Details Listener
  const activeSessionId = cloudExists
    ? viewSessionId || cloudSessions[0]?.id || cloudCurrentSessionId
    : localFallbackState.currentSessionId;

  useEffect(() => {
    if (!cloudExists || !activeSessionId) return;
    const unsub = subscribeToSessionDetails(activeSessionId, {
      onAttendance: setCloudAttendance,
      onLeaderAssignments: setCloudLeaderAssignments,
      onLessons: setCloudLessons,
      onGameRounds: setCloudGameRounds,
      onQuestions: setCloudQuestions,
      onExtras: setCloudExtras,
    });
    return () => unsub();
  }, [cloudExists, activeSessionId]);

  // 5. Private Contacts & Admin Config Listeners
  useEffect(() => {
    if (!cloudExists || !canEdit) {
      setPrivateContacts({ childContacts: {}, leaderContacts: {} });
      return;
    }
    const unsub = subscribeToPrivateContacts(setPrivateContacts);
    return () => unsub();
  }, [cloudExists, canEdit]);

  useEffect(() => {
    if (!cloudExists || !isAdmin) {
      setPrivateConfig(null);
      setMembers([]);
      return;
    }
    const unsubCfg = subscribeToPrivateConfig(setPrivateConfig);
    const unsubMem = subscribeToMembers(setMembers);
    return () => {
      unsubCfg();
      unsubMem();
    };
  }, [cloudExists, isAdmin]);

  // Merge PII contacts (if authorized) with public roster
  const mergedCloudChildren = useMemo(() => {
    return cloudChildren.map((c) => {
      const contact = privateContacts.childContacts[c.id];
      return contact
        ? { ...c, guardianName: contact.guardianName, guardianPhone: contact.guardianPhone }
        : c;
    });
  }, [cloudChildren, privateContacts]);

  const mergedCloudLeaders = useMemo(() => {
    return cloudLeaders.map((l) => {
      const contact = privateContacts.leaderContacts[l.id];
      return contact ? { ...l, phone: contact.phone } : l;
    });
  }, [cloudLeaders, privateContacts]);

  // Unified ClubState view for computeTeamSummary and Backup Export
  const effectiveState: ClubState = useMemo(() => {
    if (!cloudExists) return localFallbackState;
    return {
      children: mergedCloudChildren,
      leaders: mergedCloudLeaders,
      currentSessionId: activeSessionId,
      sessions: cloudSessions,
      attendance: { [activeSessionId]: cloudAttendance },
      leaderAssignments: { [activeSessionId]: cloudLeaderAssignments },
      lessons: { [activeSessionId]: cloudLessons },
      gameRounds: {
        [activeSessionId]:
          cloudGameRounds.length > 0
            ? cloudGameRounds
            : [
                { roundNumber: 1, name: 'Ronda 1: Carrera de Relevos', antorchasScore: 0, chispasScore: 0 },
                { roundNumber: 2, name: 'Ronda 2: Cuerda Real', antorchasScore: 0, chispasScore: 0 },
              ],
      },
      questions: { [activeSessionId]: cloudQuestions },
      extras: { [activeSessionId]: cloudExtras },
      soundEnabled: cloudSoundEnabled,
    };
  }, [
    cloudExists,
    localFallbackState,
    mergedCloudChildren,
    mergedCloudLeaders,
    activeSessionId,
    cloudSessions,
    cloudAttendance,
    cloudLeaderAssignments,
    cloudLessons,
    cloudGameRounds,
    cloudQuestions,
    cloudExtras,
    cloudSoundEnabled,
  ]);

  // Sync sound settings with audio synth
  useEffect(() => {
    sounds.enabled = effectiveState.soundEnabled;
  }, [effectiveState.soundEnabled]);

  // Persist local fallback only if cloud doesn't exist yet
  useEffect(() => {
    if (!cloudExists) {
      saveClubState(localFallbackState);
    }
  }, [cloudExists, localFallbackState]);

  const activeSession = useMemo(() => {
    return (
      effectiveState.sessions.find((s) => s.id === activeSessionId) || effectiveState.sessions[0]
    );
  }, [effectiveState.sessions, activeSessionId]);

  // Live Score Summaries
  const antorchasSummary = useMemo(() => {
    return computeTeamSummary(effectiveState, activeSessionId, 'antorchas');
  }, [effectiveState, activeSessionId]);

  const chispasSummary = useMemo(() => {
    return computeTeamSummary(effectiveState, activeSessionId, 'chispas');
  }, [effectiveState, activeSessionId]);

  const currentAttendance = effectiveState.attendance[activeSessionId] || {};
  const currentLeaderAssignments = effectiveState.leaderAssignments?.[activeSessionId] || {};
  const currentLessons = effectiveState.lessons[activeSessionId] || {};
  const currentRounds = effectiveState.gameRounds[activeSessionId] || [
    { roundNumber: 1, name: 'Ronda 1: Carrera de Relevos', antorchasScore: 0, chispasScore: 0 },
    { roundNumber: 2, name: 'Ronda 2: Cuerda Real', antorchasScore: 0, chispasScore: 0 },
  ];
  const currentQuestions = effectiveState.questions[activeSessionId] || [];
  const currentExtras = effectiveState.extras[activeSessionId] || [];

  // Guard helper for Cloud writes
  const ensureCanEdit = (): boolean => {
    if (!cloudExists && !isAdmin) {
      setShowAccessModal(true);
      showToast('Inicia sesión con Google para activar y guardar cambios en la nube.');
      return false;
    }
    if (cloudExists && !canEdit) {
      setShowAccessModal(true);
      showToast('Estás en modo Solo Lectura. Entra con Google e ingresa el código del club para editar.');
      return false;
    }
    return true;
  };

  // Auth Actions
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      sounds.playScoreAdd();
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-blocked') {
        showToast('Tu navegador bloqueó la ventana de Google. Abre el link en Chrome o Safari.');
      } else if (code === 'auth/popup-closed-by-user') {
        showToast('Inicio de sesión cancelado.');
      } else if (code === 'auth/unauthorized-domain') {
        showToast('Dominio no autorizado en Firebase Auth para iniciar sesión.');
      } else {
        showToast('No se pudo iniciar sesión. Si abriste desde WhatsApp, ábrelo en Chrome o Safari.');
      }
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setIsMember(false);
    showToast('Sesión cerrada. Estás en modo lectura en vivo.');
  };

  const handleJoinWithCode = async (code: string) => {
    if (!user) return;
    await joinClubWithCode(user.uid, user.email || '', user.displayName || 'Líder', code);
    setIsMember(true);
    sounds.playScoreAdd();
    showToast('¡Acceso concedido! Ya puedes editar desde este celular.');
  };

  const handleMigrateLocalToCloud = async () => {
    if (!isAdmin) return;
    setIsMigrating(true);
    try {
      const localData = loadClubState();
      await seedClubStateToCloud(localData, user?.email || ADMIN_EMAIL);
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      setHasLocalDataToMigrate(false);
      sounds.playScoreAdd();
      showToast('¡Datos locales subidos a la nube correctamente!');
    } catch (err) {
      console.error('Migration error:', err);
      showToast('Error al subir los datos locales a la nube.');
    } finally {
      setIsMigrating(false);
    }
  };

  // ==========================================
  // HANDLERS: ASISTENCIA Y ASIGNACIÓN DE EQUIPOS
  // ==========================================
  const handleToggleAttendance = async (childId: string, present: boolean) => {
    if (!ensureCanEdit()) return;
    const assignedTeamId = currentAttendance[childId]?.assignedTeamId || 'antorchas';
    if (cloudExists) {
      await setChildAttendanceInCloud(activeSessionId, childId, present, assignedTeamId);
    } else {
      setLocalFallbackState((prev) => {
        const sessionAtt = { ...(prev.attendance[activeSessionId] || {}) };
        sessionAtt[childId] = { childId, present, assignedTeamId, markedAt: new Date().toISOString() };
        const sessionLess = { ...(prev.lessons[activeSessionId] || {}) };
        if (!present && sessionLess[childId]) {
          sessionLess[childId] = { childId, learned: false, count: 0, markedAt: new Date().toISOString() };
        }
        return {
          ...prev,
          attendance: { ...prev.attendance, [activeSessionId]: sessionAtt },
          lessons: { ...prev.lessons, [activeSessionId]: sessionLess },
        };
      });
    }
  };

  const handleAssignChildTeam = async (childId: string, teamId: TeamId) => {
    if (!ensureCanEdit()) return;
    const existing = currentAttendance[childId];
    const present = existing ? existing.present : true;
    if (cloudExists) {
      await setChildAttendanceInCloud(activeSessionId, childId, present, teamId);
    } else {
      setLocalFallbackState((prev) => {
        const sessionAtt = { ...(prev.attendance[activeSessionId] || {}) };
        sessionAtt[childId] = {
          childId,
          present,
          assignedTeamId: teamId,
          markedAt: new Date().toISOString(),
        };
        return { ...prev, attendance: { ...prev.attendance, [activeSessionId]: sessionAtt } };
      });
    }
  };

  const handleRandomizeAllChildrenTeams = async () => {
    if (!ensureCanEdit()) return;
    const activeKids = [...effectiveState.children.filter((c) => c.active)];
    for (let i = activeKids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [activeKids[i], activeKids[j]] = [activeKids[j], activeKids[i]];
    }

    if (cloudExists) {
      const updates = activeKids.map((child, idx) => ({
        childId: child.id,
        present: currentAttendance[child.id] ? currentAttendance[child.id].present : true,
        assignedTeamId: (idx % 2 === 0 ? 'antorchas' : 'chispas') as TeamId,
      }));
      await batchUpdateAttendanceInCloud(activeSessionId, updates);
    } else {
      setLocalFallbackState((prev) => {
        const sessionAtt = { ...(prev.attendance[activeSessionId] || {}) };
        activeKids.forEach((child, index) => {
          const assignedTeamId: TeamId = index % 2 === 0 ? 'antorchas' : 'chispas';
          const existing = sessionAtt[child.id];
          sessionAtt[child.id] = {
            childId: child.id,
            present: existing ? existing.present : true,
            assignedTeamId,
            markedAt: new Date().toISOString(),
          };
        });
        return { ...prev, attendance: { ...prev.attendance, [activeSessionId]: sessionAtt } };
      });
    }
  };

  const handleSetAllAttendance = async (teamId: TeamId | 'all', present: boolean) => {
    if (!ensureCanEdit()) return;
    if (cloudExists) {
      const updates: Array<{ childId: string; present: boolean; assignedTeamId: TeamId; resetLessons?: boolean }> = [];
      effectiveState.children.forEach((c) => {
        if (!c.active) return;
        const currentAssigned = currentAttendance[c.id]?.assignedTeamId || 'antorchas';
        if (teamId === 'all' || currentAssigned === teamId) {
          updates.push({
            childId: c.id,
            present,
            assignedTeamId: currentAssigned,
            resetLessons: !present,
          });
        }
      });
      await batchUpdateAttendanceInCloud(activeSessionId, updates);
    } else {
      setLocalFallbackState((prev) => {
        const sessionAtt = { ...(prev.attendance[activeSessionId] || {}) };
        const sessionLess = { ...(prev.lessons[activeSessionId] || {}) };
        prev.children.forEach((c) => {
          if (!c.active) return;
          const currentAssigned = sessionAtt[c.id]?.assignedTeamId || 'antorchas';
          if (teamId === 'all' || currentAssigned === teamId) {
            sessionAtt[c.id] = { childId: c.id, present, assignedTeamId: currentAssigned, markedAt: new Date().toISOString() };
            if (!present && sessionLess[c.id]) {
              sessionLess[c.id] = { childId: c.id, learned: false, count: 0, markedAt: new Date().toISOString() };
            }
          }
        });
        return {
          ...prev,
          attendance: { ...prev.attendance, [activeSessionId]: sessionAtt },
          lessons: { ...prev.lessons, [activeSessionId]: sessionLess },
        };
      });
    }
    sounds.playScoreAdd();
  };

  // ==========================================
  // HANDLERS: LÍDERES
  // ==========================================
  const handleToggleLeaderAttendance = async (leaderId: string, present: boolean) => {
    if (!ensureCanEdit()) return;
    const assignedTeamId = currentLeaderAssignments[leaderId]?.assignedTeamId || 'antorchas';
    if (cloudExists) {
      await setLeaderAssignmentInCloud(activeSessionId, leaderId, present, assignedTeamId);
    } else {
      setLocalFallbackState((prev) => {
        const sessionLead = { ...(prev.leaderAssignments[activeSessionId] || {}) };
        sessionLead[leaderId] = { leaderId, present, assignedTeamId, markedAt: new Date().toISOString() };
        return { ...prev, leaderAssignments: { ...prev.leaderAssignments, [activeSessionId]: sessionLead } };
      });
    }
  };

  const handleAssignLeaderTeam = async (leaderId: string, teamId: TeamId) => {
    if (!ensureCanEdit()) return;
    const present = currentLeaderAssignments[leaderId] ? currentLeaderAssignments[leaderId].present : true;
    if (cloudExists) {
      await setLeaderAssignmentInCloud(activeSessionId, leaderId, present, teamId);
    } else {
      setLocalFallbackState((prev) => {
        const sessionLead = { ...(prev.leaderAssignments[activeSessionId] || {}) };
        sessionLead[leaderId] = { leaderId, present, assignedTeamId: teamId, markedAt: new Date().toISOString() };
        return { ...prev, leaderAssignments: { ...prev.leaderAssignments, [activeSessionId]: sessionLead } };
      });
    }
  };

  const handleRandomizeLeaders = async () => {
    if (!ensureCanEdit()) return;
    const activeLeaders = [...effectiveState.leaders.filter((l) => l.active)];
    for (let i = activeLeaders.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [activeLeaders[i], activeLeaders[j]] = [activeLeaders[j], activeLeaders[i]];
    }
    if (cloudExists) {
      const updates = activeLeaders.map((l, idx) => ({
        leaderId: l.id,
        present: currentLeaderAssignments[l.id] ? currentLeaderAssignments[l.id].present : true,
        assignedTeamId: (idx % 2 === 0 ? 'antorchas' : 'chispas') as TeamId,
      }));
      await batchUpdateLeaderAssignmentsInCloud(activeSessionId, updates);
    } else {
      setLocalFallbackState((prev) => {
        const sessionLead = { ...(prev.leaderAssignments[activeSessionId] || {}) };
        activeLeaders.forEach((leader, index) => {
          const assignedTeamId: TeamId = index % 2 === 0 ? 'antorchas' : 'chispas';
          const existing = sessionLead[leader.id];
          sessionLead[leader.id] = {
            leaderId: leader.id,
            present: existing ? existing.present : true,
            assignedTeamId,
            markedAt: new Date().toISOString(),
          };
        });
        return { ...prev, leaderAssignments: { ...prev.leaderAssignments, [activeSessionId]: sessionLead } };
      });
    }
  };

  const handleAddLeader = async (leaderData: Omit<Leader, 'id'>) => {
    if (!ensureCanEdit()) return;
    if (cloudExists) {
      await createLeaderInCloud(leaderData);
    } else {
      const newLeader: Leader = { ...leaderData, id: `lead-${Date.now()}` };
      setLocalFallbackState((prev) => ({ ...prev, leaders: [...prev.leaders, newLeader] }));
    }
  };

  const handleDeleteLeader = async (leaderId: string) => {
    if (!ensureCanEdit()) return;
    if (cloudExists) {
      await deleteLeaderInCloud(leaderId, activeSessionId);
    } else {
      setLocalFallbackState((prev) => ({
        ...prev,
        leaders: prev.leaders.filter((l) => l.id !== leaderId),
      }));
    }
    showToast('Líder eliminado del registro.');
  };

  // ==========================================
  // HANDLERS: CHILDREN CRUD
  // ==========================================
  const handleAddChild = async (childData: Omit<Child, 'id' | 'registeredDate'>) => {
    if (!ensureCanEdit()) return;
    const antorchasCount = Object.values(currentAttendance).filter((a) => a.assignedTeamId === 'antorchas').length;
    const chispasCount = Object.values(currentAttendance).filter((a) => a.assignedTeamId === 'chispas').length;
    const targetTeam: TeamId = antorchasCount <= chispasCount ? 'antorchas' : 'chispas';

    if (cloudExists) {
      await createChildInCloud(childData, activeSessionId, targetTeam);
    } else {
      const newChild: Child = {
        ...childData,
        id: `c-${Date.now()}`,
        registeredDate: new Date().toISOString().slice(0, 10),
      };
      setLocalFallbackState((prev) => {
        const sessionAtt = { ...(prev.attendance[activeSessionId] || {}) };
        sessionAtt[newChild.id] = {
          childId: newChild.id,
          present: true,
          assignedTeamId: targetTeam,
          markedAt: new Date().toISOString(),
        };
        return {
          ...prev,
          children: [...prev.children, newChild],
          attendance: { ...prev.attendance, [activeSessionId]: sessionAtt },
        };
      });
    }
  };

  const handleUpdateChild = async (updated: Child) => {
    if (!ensureCanEdit()) return;
    if (cloudExists) {
      await updateChildInCloud(updated);
    } else {
      setLocalFallbackState((prev) => ({
        ...prev,
        children: prev.children.map((c) => (c.id === updated.id ? updated : c)),
      }));
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (!ensureCanEdit()) return;
    if (cloudExists) {
      await deleteChildInCloud(childId, activeSessionId);
    } else {
      setLocalFallbackState((prev) => ({
        ...prev,
        children: prev.children.filter((c) => c.id !== childId),
      }));
    }
    showToast('Niño eliminado del registro.');
  };

  // ==========================================
  // HANDLERS: SESSIONS
  // ==========================================
  const handleSelectSession = async (sessionId: string) => {
    setViewSessionId(sessionId);
    if (cloudExists && canEdit) {
      await updateClubSettings({ currentSessionId: sessionId });
    } else if (!cloudExists) {
      setLocalFallbackState((prev) => ({ ...prev, currentSessionId: sessionId }));
    }
  };

  const handleCreateSession = async (sessionData: Omit<WeeklySession, 'id' | 'createdAt'>) => {
    if (!ensureCanEdit()) return;
    if (cloudExists) {
      const newSid = await createSessionInCloud(sessionData);
      if (newSid) setViewSessionId(newSid);
    } else {
      const newSession: WeeklySession = {
        ...sessionData,
        id: `session-${sessionData.date}-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toISOString(),
      };
      setLocalFallbackState((prev) => ({
        ...prev,
        sessions: [newSession, ...prev.sessions],
        currentSessionId: newSession.id,
        gameRounds: {
          ...prev.gameRounds,
          [newSession.id]: [
            { roundNumber: 1, name: 'Ronda 1: Carrera de Relevos', antorchasScore: 0, chispasScore: 0 },
            { roundNumber: 2, name: 'Ronda 2: Cuerda Real', antorchasScore: 0, chispasScore: 0 },
            { roundNumber: 3, name: 'Ronda 3: Búsqueda del Versículo', antorchasScore: 0, chispasScore: 0 },
          ],
        },
      }));
    }
    sounds.playScoreAdd();
  };

  const handleCompleteSession = async () => {
    if (!ensureCanEdit()) return;
    if (cloudExists) {
      await completeSessionInCloud(activeSessionId);
    } else {
      setLocalFallbackState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === activeSessionId ? { ...s, status: 'completed' } : s
        ),
      }));
    }
  };

  // ==========================================
  // HANDLERS: JUEGOS
  // ==========================================
  const handleUpdateRound = async (
    roundNumber: number,
    field: 'name' | 'antorchasScore' | 'chispasScore',
    value: string | number
  ) => {
    if (!ensureCanEdit()) return;
    const rounds = [...currentRounds];
    const idx = rounds.findIndex((r) => r.roundNumber === roundNumber);
    if (idx === -1) return;
    const updatedRound = { ...rounds[idx], [field]: value };

    if (cloudExists) {
      await saveGameRoundInCloud(activeSessionId, updatedRound);
    } else {
      rounds[idx] = updatedRound;
      setLocalFallbackState((prev) => ({
        ...prev,
        gameRounds: { ...prev.gameRounds, [activeSessionId]: rounds },
      }));
    }
  };

  const handleAddRound = async () => {
    if (!ensureCanEdit()) return;
    if (currentRounds.length >= 3) return;
    const newRound: GameRound = {
      roundNumber: currentRounds.length + 1,
      name: `Ronda ${currentRounds.length + 1}: Desafío Especial`,
      antorchasScore: 0,
      chispasScore: 0,
    };
    if (cloudExists) {
      await saveGameRoundInCloud(activeSessionId, newRound);
    } else {
      setLocalFallbackState((prev) => ({
        ...prev,
        gameRounds: {
          ...prev.gameRounds,
          [activeSessionId]: [...currentRounds, newRound],
        },
      }));
    }
  };

  const handleRemoveRound = async (roundNumber: number) => {
    if (!ensureCanEdit()) return;
    const remaining = currentRounds
      .filter((r) => r.roundNumber !== roundNumber)
      .map((r, i) => ({ ...r, roundNumber: i + 1 }));
    if (cloudExists) {
      await removeGameRoundInCloud(activeSessionId, remaining);
    } else {
      setLocalFallbackState((prev) => ({
        ...prev,
        gameRounds: { ...prev.gameRounds, [activeSessionId]: remaining },
      }));
    }
  };

  // ==========================================
  // HANDLERS: LECCIONES (MULTI-LECCIÓN × 20)
  // ==========================================
  const handleUpdateLessonCount = async (childId: string, count: number) => {
    if (!ensureCanEdit()) return;
    const safeCount = Math.max(0, count);
    if (cloudExists) {
      await setLessonCountInCloud(activeSessionId, childId, safeCount);
    } else {
      setLocalFallbackState((prev) => {
        const sessionLess = { ...(prev.lessons[activeSessionId] || {}) };
        sessionLess[childId] = {
          childId,
          learned: safeCount > 0,
          count: safeCount,
          markedAt: new Date().toISOString(),
        };
        return { ...prev, lessons: { ...prev.lessons, [activeSessionId]: sessionLess } };
      });
    }
  };

  const handleSetAllLessonsCount = async (teamId: TeamId, count: number) => {
    if (!ensureCanEdit()) return;
    const safeCount = Math.max(0, count);
    if (cloudExists) {
      const targetIds = effectiveState.children
        .filter((c) => c.active && currentAttendance[c.id]?.assignedTeamId === teamId && currentAttendance[c.id]?.present)
        .map((c) => c.id);
      await batchSetLessonsInCloud(activeSessionId, targetIds, safeCount);
    } else {
      setLocalFallbackState((prev) => {
        const sessionAtt = prev.attendance[activeSessionId] || {};
        const sessionLess = { ...(prev.lessons[activeSessionId] || {}) };
        prev.children.forEach((c) => {
          const att = sessionAtt[c.id];
          if (att && att.assignedTeamId === teamId && att.present && c.active) {
            sessionLess[c.id] = {
              childId: c.id,
              learned: safeCount > 0,
              count: safeCount,
              markedAt: new Date().toISOString(),
            };
          }
        });
        return { ...prev, lessons: { ...prev.lessons, [activeSessionId]: sessionLess } };
      });
    }
    sounds.playScoreAdd();
  };

  // ==========================================
  // HANDLERS: PREGUNTAS RÁPIDAS (+20 / -10)
  // ==========================================
  const handleAddQuestion = async (teamId: TeamId, isCorrect: boolean) => {
    if (!ensureCanEdit()) return;
    const nextNumber = currentQuestions.length + 1;
    if (cloudExists) {
      await addQuestionInCloud(activeSessionId, teamId, isCorrect, nextNumber);
    } else {
      const newQuestion: QuestionEvent = {
        id: `q-${Date.now()}`,
        teamId,
        isCorrect,
        points: isCorrect ? 20 : -10,
        questionNumber: nextNumber,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setLocalFallbackState((prev) => ({
        ...prev,
        questions: {
          ...prev.questions,
          [activeSessionId]: [newQuestion, ...(prev.questions[activeSessionId] || [])],
        },
      }));
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    if (!ensureCanEdit()) return;
    if (cloudExists) {
      await removeQuestionInCloud(activeSessionId, questionId);
    } else {
      setLocalFallbackState((prev) => ({
        ...prev,
        questions: {
          ...prev.questions,
          [activeSessionId]: (prev.questions[activeSessionId] || []).filter((q) => q.id !== questionId),
        },
      }));
    }
  };

  const handleClearQuestions = async () => {
    if (!ensureCanEdit()) return;
    if (cloudExists) {
      await clearQuestionsInCloud(activeSessionId);
    } else {
      setLocalFallbackState((prev) => ({
        ...prev,
        questions: { ...prev.questions, [activeSessionId]: [] },
      }));
    }
    showToast('Historial de preguntas reiniciado.');
  };

  // ==========================================
  // HANDLERS: EXTRAS Y DESCUENTOS
  // ==========================================
  const handleAddExtra = async (event: Omit<ExtraScoreEvent, 'id' | 'timestamp'>) => {
    if (!ensureCanEdit()) return;
    if (cloudExists) {
      await addExtraInCloud(activeSessionId, event);
    } else {
      const newEvent: ExtraScoreEvent = {
        ...event,
        id: `extra-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setLocalFallbackState((prev) => ({
        ...prev,
        extras: {
          ...prev.extras,
          [activeSessionId]: [newEvent, ...(prev.extras[activeSessionId] || [])],
        },
      }));
    }
  };

  const handleRemoveExtra = async (id: string) => {
    if (!ensureCanEdit()) return;
    if (cloudExists) {
      await removeExtraInCloud(activeSessionId, id);
    } else {
      setLocalFallbackState((prev) => ({
        ...prev,
        extras: {
          ...prev.extras,
          [activeSessionId]: (prev.extras[activeSessionId] || []).filter((e) => e.id !== id),
        },
      }));
    }
  };

  const handleToggleSound = async () => {
    const nextSound = !effectiveState.soundEnabled;
    if (cloudExists && canEdit) {
      await updateClubSettings({ soundEnabled: nextSound });
    } else {
      setCloudSoundEnabled(nextSound);
      setLocalFallbackState((prev) => ({ ...prev, soundEnabled: nextSound }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-amber-300 selection:text-amber-950">
      {/* Top Application Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenWinnerScreen={() => {
          setShowWinnerModal(true);
          sounds.playFanfare();
        }}
        onOpenArchDocs={() => setShowArchDocs(true)}
        soundEnabled={effectiveState.soundEnabled}
        onToggleSound={handleToggleSound}
        activeSession={activeSession}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-2xl shadow-xl border border-amber-400/50 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* Cloud Sync & Auth Status Bar */}
        <CloudSyncBar
          user={user}
          isAdmin={isAdmin}
          isMember={isMember}
          cloudExists={cloudExists}
          isLoadingCloud={isLoadingCloud}
          hasLocalDataToMigrate={hasLocalDataToMigrate}
          isMigrating={isMigrating}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onOpenAccessModal={() => setShowAccessModal(true)}
          onMigrateLocalToCloud={handleMigrateLocalToCloud}
        />

        {/* Real-time Hero Scoreboard */}
        <ScoreBoardBanner
          antorchasSummary={antorchasSummary}
          chispasSummary={chispasSummary}
          activeSession={activeSession}
          onOpenWinner={() => {
            setShowWinnerModal(true);
            sounds.playFanfare();
          }}
          bannerImage={ASSET_IMAGES.banner}
        />

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-1.5 border border-amber-200/90 shadow-xs flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'marcador', label: '📊 Marcador General' },
            { id: 'asistencia', label: '👥 Asistencia & Equipos' },
            { id: 'juegos', label: '🎯 Juegos (2-3 Rondas)' },
            { id: 'lecciones', label: '📖 Lecciones (Multiplicador ×20)' },
            { id: 'preguntas', label: '⚡ Preguntas (+20 / -10)' },
            { id: 'extras', label: '⭐ Extras & Descuentos' },
          ].map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex-1 min-w-[140px] sm:min-w-0 py-2.5 px-3 rounded-xl text-center transition-all ${
                  isActive
                    ? 'bg-amber-500 text-amber-950 font-bold shadow-xs scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                }`}
              >
                <div className="text-xs whitespace-nowrap">{tab.label}</div>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Marcador General */}
        {currentTab === 'marcador' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tarjeta Detallada Antorchas */}
              <div className="bg-white rounded-2xl border-2 border-red-300 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-red-100 mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 block">Equipo 1</span>
                    <h3 className="text-xl font-bold font-display text-slate-900">ANTORCHAS (Rojo)</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Puntaje Total</span>
                    <span className="text-3xl font-extrabold font-mono text-red-600 tabular-nums">
                      {antorchasSummary.grandTotal} pts
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-600">Niños presentes hoy:</span>
                    <span className="font-bold font-mono">{antorchasSummary.childrenPresentCount} de {antorchasSummary.childrenTotalCount}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-600">Líderes acompañando:</span>
                    <span className="font-bold font-mono">{antorchasSummary.leadersCount} líderes</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-600">🎯 Puntos en Juegos (Rondas):</span>
                    <span className="font-bold font-mono text-slate-900">+{antorchasSummary.gamesTotal} pts</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-red-50/70 border border-red-100">
                    <span className="text-red-900 font-semibold">📖 Lecciones dadas ({antorchasSummary.lessonsLearnedCount} × 20):</span>
                    <span className="font-bold font-mono text-red-700">+{antorchasSummary.lessonsTotal} pts</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-600">⚡ Preguntas (+{antorchasSummary.questionsCorrectCount * 20} / -{antorchasSummary.questionsIncorrectCount * 10}):</span>
                    <span className="font-bold font-mono text-slate-900">
                      {antorchasSummary.questionsTotal >= 0 ? `+${antorchasSummary.questionsTotal}` : antorchasSummary.questionsTotal} pts
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900">
                    <span className="font-semibold">⭐ Extras a favor:</span>
                    <span className="font-bold font-mono text-emerald-700">+{antorchasSummary.extrasTotal} pts</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-rose-50 text-rose-900">
                    <span className="font-semibold">⚠️ Descuentos y Penalizaciones:</span>
                    <span className="font-bold font-mono text-rose-700">-{antorchasSummary.penaltiesTotal} pts ({antorchasSummary.penaltiesCount} faltas)</span>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentTab('lecciones')}
                  className="mt-4 w-full py-2 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 rounded-xl transition-colors text-center"
                >
                  Evaluar Lecciones de Antorchas →
                </button>
              </div>

              {/* Tarjeta Detallada Chispas */}
              <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-amber-100 mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">Equipo 2</span>
                    <h3 className="text-xl font-bold font-display text-slate-900">CHISPAS (Amarillo)</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Puntaje Total</span>
                    <span className="text-3xl font-extrabold font-mono text-amber-600 tabular-nums">
                      {chispasSummary.grandTotal} pts
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-600">Niños presentes hoy:</span>
                    <span className="font-bold font-mono">{chispasSummary.childrenPresentCount} de {chispasSummary.childrenTotalCount}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-600">Líderes acompañando:</span>
                    <span className="font-bold font-mono">{chispasSummary.leadersCount} líderes</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-600">🎯 Puntos en Juegos (Rondas):</span>
                    <span className="font-bold font-mono text-slate-900">+{chispasSummary.gamesTotal} pts</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-200">
                    <span className="text-amber-950 font-semibold">📖 Lecciones dadas ({chispasSummary.lessonsLearnedCount} × 20):</span>
                    <span className="font-bold font-mono text-amber-800">+{chispasSummary.lessonsTotal} pts</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-600">⚡ Preguntas (+{chispasSummary.questionsCorrectCount * 20} / -{chispasSummary.questionsIncorrectCount * 10}):</span>
                    <span className="font-bold font-mono text-slate-900">
                      {chispasSummary.questionsTotal >= 0 ? `+${chispasSummary.questionsTotal}` : chispasSummary.questionsTotal} pts
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900">
                    <span className="font-semibold">⭐ Extras a favor:</span>
                    <span className="font-bold font-mono text-emerald-700">+{chispasSummary.extrasTotal} pts</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-rose-50 text-rose-900">
                    <span className="font-semibold">⚠️ Descuentos y Penalizaciones:</span>
                    <span className="font-bold font-mono text-rose-700">-{chispasSummary.penaltiesTotal} pts ({chispasSummary.penaltiesCount} faltas)</span>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentTab('lecciones')}
                  className="mt-4 w-full py-2 text-xs font-bold bg-amber-50 text-amber-900 hover:bg-amber-100 rounded-xl transition-colors text-center"
                >
                  Evaluar Lecciones de Chispas →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Asistencia & Asignación de Equipos */}
        {currentTab === 'asistencia' && (
          <AttendanceModule
            childrenList={effectiveState.children}
            leadersList={effectiveState.leaders}
            activeSessionId={activeSessionId}
            sessions={effectiveState.sessions}
            attendanceRecord={currentAttendance}
            leaderAssignments={currentLeaderAssignments}
            onToggleAttendance={handleToggleAttendance}
            onAssignChildTeam={handleAssignChildTeam}
            onRandomizeAllChildrenTeams={handleRandomizeAllChildrenTeams}
            onSetAllAttendance={handleSetAllAttendance}
            onAddChild={handleAddChild}
            onUpdateChild={handleUpdateChild}
            onDeleteChild={handleDeleteChild}
            onToggleLeaderAttendance={handleToggleLeaderAttendance}
            onAssignLeaderTeam={handleAssignLeaderTeam}
            onRandomizeLeaders={handleRandomizeLeaders}
            onAddLeader={handleAddLeader}
            onDeleteLeader={handleDeleteLeader}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateSession}
          />
        )}

        {/* Tab 3: Juegos */}
        {currentTab === 'juegos' && (
          <GamesModule
            rounds={currentRounds}
            onUpdateRound={handleUpdateRound}
            onAddRound={handleAddRound}
            onRemoveRound={handleRemoveRound}
          />
        )}

        {/* Tab 4: Lecciones */}
        {currentTab === 'lecciones' && (
          <LessonsModule
            childrenList={effectiveState.children}
            activeSession={activeSession}
            attendanceRecord={currentAttendance}
            lessonsRecord={currentLessons}
            onUpdateLessonCount={handleUpdateLessonCount}
            onSetAllLessonsCount={handleSetAllLessonsCount}
          />
        )}

        {/* Tab 5: Preguntas */}
        {currentTab === 'preguntas' && (
          <QuestionsModule
            questions={currentQuestions}
            onAddQuestion={handleAddQuestion}
            onRemoveQuestion={handleRemoveQuestion}
            onClearQuestions={handleClearQuestions}
          />
        )}

        {/* Tab 6: Extras & Penalizaciones */}
        {currentTab === 'extras' && (
          <ExtrasPenaltiesModule
            extrasList={currentExtras}
            onAddEvent={handleAddExtra}
            onRemoveEvent={handleRemoveExtra}
          />
        )}
      </main>

      {/* Modal Fin del Programa / Proclamar Ganador */}
      <WinnerScreenModal
        isOpen={showWinnerModal}
        onClose={() => setShowWinnerModal(false)}
        antorchasSummary={antorchasSummary}
        chispasSummary={chispasSummary}
        activeSession={activeSession}
        trophyImage={ASSET_IMAGES.trophy}
        onCompleteSession={handleCompleteSession}
      />

      {/* Modal Compartir y Permisos en la Nube */}
      <CloudAccessModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        user={user}
        isAdmin={isAdmin}
        isMember={isMember}
        privateConfig={privateConfig}
        members={members}
        onSignIn={handleSignIn}
        onJoinWithCode={handleJoinWithCode}
        onSavePrivateConfig={savePrivateConfigInCloud}
        onRemoveMember={removeMemberInCloud}
      />

      {/* Modal Arquitectura del Sistema y Base de Datos */}
      <ArchitectureDocsModal
        isOpen={showArchDocs}
        onClose={() => setShowArchDocs(false)}
        state={effectiveState}
        onRestoreState={async (newState) => {
          if (cloudExists && isAdmin) {
            await seedClubStateToCloud(newState, user?.email || ADMIN_EMAIL);
            showToast('Respaldo restaurado en la Nube para todos los celulares.');
          } else if (!cloudExists) {
            setLocalFallbackState(newState);
          } else {
            showToast('Solo el administrador puede restaurar respaldos completos.');
          }
        }}
        onResetToDefault={async () => {
          localStorage.removeItem('ninos_del_rey_club_data_v2');
          if (cloudExists && isAdmin) {
            await seedClubStateToCloud(INITIAL_STATE, user?.email || ADMIN_EMAIL);
            showToast('Base de datos reiniciada en la Nube.');
          } else if (!cloudExists) {
            setLocalFallbackState(INITIAL_STATE);
          }
          setShowArchDocs(false);
        }}
      />
    </div>
  );
}
