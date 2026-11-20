export type TeamId = 'antorchas' | 'chispas';

export interface TeamConfig {
  id: TeamId;
  name: string;
  badgeName: string;
  colorName: string;
  primaryColorHex: string;
  badgeUrl: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  motto: string;
}

export interface Child {
  id: string;
  fullName: string;
  defaultTeamId?: TeamId; // Equipo sugerido o histórico
  age?: number;
  guardianName?: string;
  guardianPhone?: string;
  notes?: string;
  active: boolean;
  registeredDate: string;
}

export interface Leader {
  id: string;
  fullName: string;
  role?: string; // Guía, Maestro, Coordinador
  phone?: string;
  active: boolean;
}

export interface WeeklySession {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  verse?: string;
  notes?: string;
  status: 'active' | 'completed';
  createdAt: string;
}

export interface AttendanceRecord {
  childId: string;
  present: boolean;
  assignedTeamId: TeamId; // Equipo asignado en esta sesión específica (puede ser aleatorio o manual)
  markedAt: string;
}

export interface LeaderAssignmentRecord {
  leaderId: string;
  present: boolean;
  assignedTeamId: TeamId;
  markedAt: string;
}

export interface LessonRecord {
  childId: string;
  learned: boolean; // Si aprobó al menos 1 lección
  count: number; // Número de lecciones aprendidas hoy (1 a 10, o manual)
  markedAt: string;
}

export interface GameRound {
  roundNumber: number;
  name: string;
  antorchasScore: number;
  chispasScore: number;
}

export interface QuestionEvent {
  id: string;
  teamId: TeamId;
  isCorrect: boolean; // true = +20, false = -10
  points: number;
  questionNumber: number;
  timestamp: string;
}

export interface ExtraScoreEvent {
  id: string;
  teamId: TeamId;
  type: 'extra' | 'penalty';
  points: number; // Puntos positivos o negativos libres
  reason: string;
  timestamp: string;
}

export interface TeamScoreSummary {
  teamId: TeamId;
  gamesTotal: number;
  lessonsLearnedCount: number; // Suma de total de lecciones dadas por los niños del equipo
  lessonsTotal: number; // totalLecciones * 20
  questionsCorrectCount: number;
  questionsIncorrectCount: number;
  questionsTotal: number; // correct*20 - incorrect*10
  extrasTotal: number;
  penaltiesTotal: number;
  penaltiesCount: number;
  grandTotal: number;
  childrenTotalCount: number;
  childrenPresentCount: number;
  leadersCount: number;
}

export interface ClubState {
  children: Child[];
  leaders: Leader[];
  currentSessionId: string;
  sessions: WeeklySession[];
  // Keyed by sessionId
  attendance: Record<string, Record<string, AttendanceRecord>>; // sessionId -> childId -> AttendanceRecord
  leaderAssignments: Record<string, Record<string, LeaderAssignmentRecord>>; // sessionId -> leaderId -> LeaderAssignmentRecord
  lessons: Record<string, Record<string, LessonRecord>>; // sessionId -> childId -> LessonRecord
  gameRounds: Record<string, GameRound[]>; // sessionId -> GameRound[]
  questions: Record<string, QuestionEvent[]>; // sessionId -> QuestionEvent[]
  extras: Record<string, ExtraScoreEvent[]>; // sessionId -> ExtraScoreEvent[]
  soundEnabled: boolean;
}
