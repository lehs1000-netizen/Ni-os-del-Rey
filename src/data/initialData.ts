import { Child, ClubState, Leader, TeamConfig, WeeklySession } from '../types';

import bannerImg from '../assets/images/club_mascot_banner_1790401652995.jpg';
import antorchasBadgeImg from '../assets/images/badge_antorchas_1790401664315.jpg';
import chispasBadgeImg from '../assets/images/badge_chispas_1790401675127.jpg';
import trophyImg from '../assets/images/trophy_winner_1790401683948.jpg';

export const ASSET_IMAGES = {
  banner: bannerImg,
  antorchasBadge: antorchasBadgeImg,
  chispasBadge: chispasBadgeImg,
  trophy: trophyImg,
};

export const TEAMS: Record<'antorchas' | 'chispas', TeamConfig> = {
  antorchas: {
    id: 'antorchas',
    name: 'ANTORCHAS',
    badgeName: 'Antorchas',
    colorName: 'Rojo Fuego',
    primaryColorHex: '#DC2626',
    badgeUrl: antorchasBadgeImg,
    accentBg: 'bg-red-500',
    accentBorder: 'border-red-500',
    accentText: 'text-red-700',
    motto: '¡Luz que arde y guía en la Verdad!',
  },
  chispas: {
    id: 'chispas',
    name: 'CHISPAS',
    badgeName: 'Chispas',
    colorName: 'Amarillo Brillante',
    primaryColorHex: '#EAB308',
    badgeUrl: chispasBadgeImg,
    accentBg: 'bg-amber-400',
    accentBorder: 'border-amber-400',
    accentText: 'text-amber-800',
    motto: '¡Chispas radiantes con el amor del Rey!',
  },
};

export const INITIAL_CHILDREN: Child[] = [
  { id: 'c-1', fullName: 'Mateo Morales', age: 9, guardianName: 'Rosa Morales', guardianPhone: '555-0101', active: true, registeredDate: '2026-01-10' },
  { id: 'c-2', fullName: 'Sofía Castillo', age: 8, guardianName: 'Carlos Castillo', guardianPhone: '555-0102', active: true, registeredDate: '2026-01-10' },
  { id: 'c-3', fullName: 'Santiago Reyes', age: 10, guardianName: 'Elena Reyes', guardianPhone: '555-0103', active: true, registeredDate: '2026-01-12' },
  { id: 'c-4', fullName: 'Valentina Navarro', age: 7, guardianName: 'Marcos Navarro', guardianPhone: '555-0104', active: true, registeredDate: '2026-01-15' },
  { id: 'c-5', fullName: 'Lucas Benítez', age: 9, guardianName: 'Patricia Benítez', guardianPhone: '555-0105', active: true, registeredDate: '2026-01-18' },
  { id: 'c-6', fullName: 'Emma Cordero', age: 8, guardianName: 'David Cordero', guardianPhone: '555-0106', active: true, registeredDate: '2026-01-20' },
  { id: 'c-7', fullName: 'Daniela Salazar', age: 9, guardianName: 'Lucía Salazar', guardianPhone: '555-0201', active: true, registeredDate: '2026-01-10' },
  { id: 'c-8', fullName: 'Joaquín Mendoza', age: 8, guardianName: 'Gabriel Mendoza', guardianPhone: '555-0202', active: true, registeredDate: '2026-01-10' },
  { id: 'c-9', fullName: 'Camila Villalobos', age: 10, guardianName: 'Teresa Villalobos', guardianPhone: '555-0203', active: true, registeredDate: '2026-01-12' },
  { id: 'c-10', fullName: 'Benjamín Fuentes', age: 7, guardianName: 'Roberto Fuentes', guardianPhone: '555-0204', active: true, registeredDate: '2026-01-15' },
  { id: 'c-11', fullName: 'Luciana Paredes', age: 9, guardianName: 'Carmen Paredes', guardianPhone: '555-0205', active: true, registeredDate: '2026-01-18' },
  { id: 'c-12', fullName: 'Nicolás Aguilar', age: 8, guardianName: 'Ángel Aguilar', guardianPhone: '555-0206', active: true, registeredDate: '2026-01-20' },
];

export const INITIAL_LEADERS: Leader[] = [
  { id: 'lead-1', fullName: 'Pastor David Romero', role: 'Coordinador General', phone: '555-9001', active: true },
  { id: 'lead-2', fullName: 'Maestra Andrea Gómez', role: 'Líder de Juegos y Dinámicas', phone: '555-9002', active: true },
  { id: 'lead-3', fullName: 'Hermano Carlos Suárez', role: 'Guía de Versículos', phone: '555-9003', active: true },
  { id: 'lead-4', fullName: 'Maestra Mariana León', role: 'Maestra de Lección Bíblica', phone: '555-9004', active: true },
];

export const DEFAULT_SESSION_ID = 'session-2026-09-26';

export const INITIAL_SESSIONS: WeeklySession[] = [
  {
    id: DEFAULT_SESSION_ID,
    date: '2026-09-26',
    title: 'Sábado de Campeones del Rey',
    verse: 'Vosotros sois la luz del mundo - Mateo 5:14',
    notes: 'Jornada semanal de juegos bíblicos, lección de la fe y desafío de preguntas.',
    status: 'active',
    createdAt: '2026-09-26T09:00:00.000Z',
  },
  {
    id: 'session-2026-09-19',
    date: '2026-09-19',
    title: 'Sábado de Valientes',
    verse: 'Mira que te mando que te esfuerces y seas valiente - Josué 1:9',
    notes: 'Programa anterior concluido con victoria reñida.',
    status: 'completed',
    createdAt: '2026-09-19T09:00:00.000Z',
  }
];

export const INITIAL_STATE: ClubState = {
  children: INITIAL_CHILDREN,
  leaders: INITIAL_LEADERS,
  currentSessionId: DEFAULT_SESSION_ID,
  sessions: INITIAL_SESSIONS,
  attendance: {
    [DEFAULT_SESSION_ID]: {
      // 6 para Antorchas
      'c-1': { childId: 'c-1', present: true, assignedTeamId: 'antorchas', markedAt: '2026-09-26T09:15:00Z' },
      'c-2': { childId: 'c-2', present: true, assignedTeamId: 'antorchas', markedAt: '2026-09-26T09:16:00Z' },
      'c-3': { childId: 'c-3', present: true, assignedTeamId: 'antorchas', markedAt: '2026-09-26T09:17:00Z' },
      'c-4': { childId: 'c-4', present: true, assignedTeamId: 'antorchas', markedAt: '2026-09-26T09:18:00Z' },
      'c-5': { childId: 'c-5', present: false, assignedTeamId: 'antorchas', markedAt: '2026-09-26T09:19:00Z' },
      'c-6': { childId: 'c-6', present: true, assignedTeamId: 'antorchas', markedAt: '2026-09-26T09:20:00Z' },

      // 6 para Chispas
      'c-7': { childId: 'c-7', present: true, assignedTeamId: 'chispas', markedAt: '2026-09-26T09:15:00Z' },
      'c-8': { childId: 'c-8', present: true, assignedTeamId: 'chispas', markedAt: '2026-09-26T09:16:00Z' },
      'c-9': { childId: 'c-9', present: true, assignedTeamId: 'chispas', markedAt: '2026-09-26T09:17:00Z' },
      'c-10': { childId: 'c-10', present: true, assignedTeamId: 'chispas', markedAt: '2026-09-26T09:18:00Z' },
      'c-11': { childId: 'c-11', present: true, assignedTeamId: 'chispas', markedAt: '2026-09-26T09:19:00Z' },
      'c-12': { childId: 'c-12', present: false, assignedTeamId: 'chispas', markedAt: '2026-09-26T09:20:00Z' },
    },
  },
  leaderAssignments: {
    [DEFAULT_SESSION_ID]: {
      'lead-1': { leaderId: 'lead-1', present: true, assignedTeamId: 'antorchas', markedAt: '2026-09-26T09:00:00Z' },
      'lead-2': { leaderId: 'lead-2', present: true, assignedTeamId: 'antorchas', markedAt: '2026-09-26T09:00:00Z' },
      'lead-3': { leaderId: 'lead-3', present: true, assignedTeamId: 'chispas', markedAt: '2026-09-26T09:00:00Z' },
      'lead-4': { leaderId: 'lead-4', present: true, assignedTeamId: 'chispas', markedAt: '2026-09-26T09:00:00Z' },
    },
  },
  lessons: {
    [DEFAULT_SESSION_ID]: {
      // Antorchas
      'c-1': { childId: 'c-1', learned: true, count: 2, markedAt: '2026-09-26T10:00:00Z' },
      'c-2': { childId: 'c-2', learned: true, count: 1, markedAt: '2026-09-26T10:05:00Z' },
      'c-3': { childId: 'c-3', learned: true, count: 3, markedAt: '2026-09-26T10:10:00Z' },
      'c-4': { childId: 'c-4', learned: false, count: 0, markedAt: '2026-09-26T10:12:00Z' },
      'c-6': { childId: 'c-6', learned: true, count: 1, markedAt: '2026-09-26T10:15:00Z' },

      // Chispas
      'c-7': { childId: 'c-7', learned: true, count: 2, markedAt: '2026-09-26T10:00:00Z' },
      'c-8': { childId: 'c-8', learned: true, count: 2, markedAt: '2026-09-26T10:04:00Z' },
      'c-9': { childId: 'c-9', learned: true, count: 1, markedAt: '2026-09-26T10:08:00Z' },
      'c-10': { childId: 'c-10', learned: true, count: 2, markedAt: '2026-09-26T10:11:00Z' },
      'c-11': { childId: 'c-11', learned: false, count: 0, markedAt: '2026-09-26T10:14:00Z' },
    },
  },
  gameRounds: {
    [DEFAULT_SESSION_ID]: [
      { roundNumber: 1, name: 'Ronda 1: Carrera de Relevos', antorchasScore: 50, chispasScore: 40 },
      { roundNumber: 2, name: 'Ronda 2: Cuerda Real', antorchasScore: 40, chispasScore: 60 },
      { roundNumber: 3, name: 'Ronda 3: Búsqueda del Versículo', antorchasScore: 30, chispasScore: 30 },
    ],
  },
  questions: {
    [DEFAULT_SESSION_ID]: [
      { id: 'q-1', teamId: 'antorchas', isCorrect: true, points: 20, questionNumber: 1, timestamp: '10:30' },
      { id: 'q-2', teamId: 'chispas', isCorrect: true, points: 20, questionNumber: 2, timestamp: '10:32' },
      { id: 'q-3', teamId: 'antorchas', isCorrect: false, points: -10, questionNumber: 3, timestamp: '10:35' },
      { id: 'q-4', teamId: 'chispas', isCorrect: true, points: 20, questionNumber: 4, timestamp: '10:37' },
    ],
  },
  extras: {
    [DEFAULT_SESSION_ID]: [
      { id: 'e-1', teamId: 'antorchas', type: 'extra', points: 30, reason: 'Barra y porras con pancartas', timestamp: '09:40' },
      { id: 'e-2', teamId: 'chispas', type: 'extra', points: 40, reason: 'Trajeron 4 Biblias completas', timestamp: '09:42' },
      { id: 'e-3', teamId: 'antorchas', type: 'extra', points: 20, reason: 'Trajeron 1 niño invitado nuevo', timestamp: '09:45' },
      { id: 'e-4', teamId: 'antorchas', type: 'penalty', points: 10, reason: 'Desorden reiterado durante la fila de oración', timestamp: '10:20' },
      { id: 'e-5', teamId: 'chispas', type: 'penalty', points: 15, reason: 'Interrupción con silbatos durante la prédica', timestamp: '10:25' },
    ],
  },
  soundEnabled: true,
};
