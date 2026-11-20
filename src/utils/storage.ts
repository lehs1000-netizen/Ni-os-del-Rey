import { ClubState, TeamId, TeamScoreSummary } from '../types';
import { INITIAL_STATE } from '../data/initialData';

const STORAGE_KEY = 'ninos_del_rey_club_data_v2';

export function loadClubState(): ClubState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_STATE,
      ...parsed,
      children: parsed.children?.length ? parsed.children : INITIAL_STATE.children,
      leaders: parsed.leaders?.length ? parsed.leaders : INITIAL_STATE.leaders,
      sessions: parsed.sessions?.length ? parsed.sessions : INITIAL_STATE.sessions,
    };
  } catch (e) {
    console.error('Error loading state from localStorage:', e);
    return INITIAL_STATE;
  }
}

export function saveClubState(state: ClubState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving state to localStorage:', e);
  }
}

export function computeTeamSummary(state: ClubState, sessionId: string, teamId: TeamId): TeamScoreSummary {
  const sessionAttendance = state.attendance[sessionId] || {};
  const sessionLessons = state.lessons[sessionId] || {};
  const sessionLeaders = state.leaderAssignments[sessionId] || {};

  // 1. Niños asignados a este equipo en ESTA sesión
  let teamChildrenCount = 0;
  let presentCount = 0;
  let totalLessonsLearnedCount = 0;

  state.children.forEach((child) => {
    if (!child.active) return;
    const att = sessionAttendance[child.id];
    // Si tiene registro en la sesión y fue asignado a este equipo
    if (att && att.assignedTeamId === teamId) {
      teamChildrenCount++;
      if (att.present) {
        presentCount++;
        const less = sessionLessons[child.id];
        if (less && less.learned) {
          const count = Number(less.count ?? (less.learned ? 1 : 0));
          totalLessonsLearnedCount += count;
        }
      }
    }
  });

  // Líderes asignados a este equipo en ESTA sesión
  const leadersCount = state.leaders.filter((l) => {
    if (!l.active) return false;
    const assign = sessionLeaders[l.id];
    return assign && assign.present && assign.assignedTeamId === teamId;
  }).length;

  // 2. Juegos
  const rounds = state.gameRounds[sessionId] || [];
  const gamesTotal = rounds.reduce((sum, r) => {
    const pts = teamId === 'antorchas' ? (r.antorchasScore || 0) : (r.chispasScore || 0);
    return sum + Number(pts);
  }, 0);

  // 3. Lecciones: Multiplicador de 20 puntos por CADA lección aprendida
  const lessonsTotal = totalLessonsLearnedCount * 20;

  // 4. Preguntas: Correct = +20, Incorrect = -10
  const sessionQuestions = state.questions[sessionId] || [];
  const teamQuestions = sessionQuestions.filter((q) => q.teamId === teamId);
  const questionsCorrectCount = teamQuestions.filter((q) => q.isCorrect).length;
  const questionsIncorrectCount = teamQuestions.filter((q) => !q.isCorrect).length;
  const questionsTotal = (questionsCorrectCount * 20) - (questionsIncorrectCount * 10);

  // 5. Extras & Penalizaciones (sin restricciones de límites)
  const sessionExtras = state.extras[sessionId] || [];
  const teamExtras = sessionExtras.filter((e) => e.teamId === teamId);
  const extrasTotal = teamExtras
    .filter((e) => e.type === 'extra')
    .reduce((sum, e) => sum + Number(e.points || 0), 0);
  
  const penaltiesItems = teamExtras.filter((e) => e.type === 'penalty');
  const penaltiesTotal = penaltiesItems.reduce((sum, e) => sum + Math.abs(Number(e.points || 0)), 0);
  const penaltiesCount = penaltiesItems.length;

  // Gran Total: Juegos + Lecciones + Preguntas + Extras - Penalizaciones
  const grandTotal = gamesTotal + lessonsTotal + questionsTotal + extrasTotal - penaltiesTotal;

  return {
    teamId,
    gamesTotal,
    lessonsLearnedCount: totalLessonsLearnedCount,
    lessonsTotal,
    questionsCorrectCount,
    questionsIncorrectCount,
    questionsTotal,
    extrasTotal,
    penaltiesTotal,
    penaltiesCount,
    grandTotal,
    childrenTotalCount: teamChildrenCount,
    childrenPresentCount: presentCount,
    leadersCount,
  };
}

export function exportBackup(state: ClubState): void {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ninos-del-rey-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
