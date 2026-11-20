import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
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
} from '../types';

export const CLUB_ID = 'ninos-del-rey';
export const ADMIN_EMAIL = 'lehs1000@gmail.com';
export const DEFAULT_ACCESS_CODE = 'REY2026';

export interface ClubPrivateConfigData {
  clubId: string;
  accessCode: string;
  authorizedEmails: string[];
}

export interface ClubMemberData {
  uid: string;
  clubId: string;
  email: string;
  displayName: string;
  role: 'collaborator';
  joinedAt?: Timestamp;
}

export interface ContactsMap {
  childContacts: Record<string, { guardianName?: string; guardianPhone?: string }>;
  leaderContacts: Record<string, { phone?: string }>;
}

const cleanStr = (val: string | undefined, maxLen: number): string | undefined => {
  if (!val) return undefined;
  const trimmed = val.trim().slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : undefined;
};

// Sanitize Firestore IDs strictly to ^[a-zA-Z0-9_-]+$
export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  return cleaned.length > 0 ? cleaned : `id-${Date.now()}`;
}

export async function checkIsClubMember(uid: string): Promise<boolean> {
  const path = `clubs/${CLUB_ID}/members/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'clubs', CLUB_ID, 'members', uid));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function tryAutoJoinClub(
  uid: string,
  email: string,
  displayName: string
): Promise<boolean> {
  const path = `clubs/${CLUB_ID}/members/${uid}`;
  try {
    const existing = await getDoc(doc(db, 'clubs', CLUB_ID, 'members', uid));
    if (existing.exists()) return true;

    // Attempt creation without accessCode (succeeds only if email is in authorizedEmails or user is admin)
    await setDoc(doc(db, 'clubs', CLUB_ID, 'members', uid), {
      uid,
      clubId: CLUB_ID,
      email: email.slice(0, 150),
      displayName: (displayName || email.split('@')[0] || 'Líder').slice(0, 120),
      role: 'collaborator',
      joinedAt: serverTimestamp(),
    });
    return true;
  } catch {
    // Expected if not pre-authorized and no accessCode supplied yet
    return false;
  }
}

export async function joinClubWithCode(
  uid: string,
  email: string,
  displayName: string,
  accessCode: string
): Promise<void> {
  const path = `clubs/${CLUB_ID}/members/${uid}`;
  try {
    await setDoc(doc(db, 'clubs', CLUB_ID, 'members', uid), {
      uid,
      clubId: CLUB_ID,
      email: email.slice(0, 150),
      displayName: (displayName || email.split('@')[0] || 'Líder').slice(0, 120),
      role: 'collaborator',
      accessCode: accessCode.trim().slice(0, 32),
      joinedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function seedClubStateToCloud(
  stateToSeed: ClubState,
  ownerEmail: string
): Promise<void> {
  const operations: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  const clubRef = doc(db, 'clubs', CLUB_ID);
  const safeSessionId = sanitizeId(stateToSeed.currentSessionId || stateToSeed.sessions[0]?.id || 'default-session');

  operations.push((batch) => {
    batch.set(clubRef, {
      id: CLUB_ID,
      name: 'Club Niños del Rey',
      currentSessionId: safeSessionId,
      soundEnabled: Boolean(stateToSeed.soundEnabled),
      ownerEmail: ownerEmail.slice(0, 150),
      isPublicClubData: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  // Private config with default access code
  const configRef = doc(db, 'clubs', CLUB_ID, 'private', 'config');
  operations.push((batch) => {
    batch.set(configRef, {
      clubId: CLUB_ID,
      accessCode: DEFAULT_ACCESS_CODE,
      authorizedEmails: [],
      updatedAt: serverTimestamp(),
    });
  });

  // Private contacts (PII isolated)
  const childContacts: ContactsMap['childContacts'] = {};
  const leaderContacts: ContactsMap['leaderContacts'] = {};

  stateToSeed.children.forEach((child) => {
    const cid = sanitizeId(child.id);
    if (child.guardianName || child.guardianPhone) {
      childContacts[cid] = {
        ...(child.guardianName ? { guardianName: child.guardianName.slice(0, 150) } : {}),
        ...(child.guardianPhone ? { guardianPhone: child.guardianPhone.slice(0, 50) } : {}),
      };
    }

    const childRef = doc(db, 'clubs', CLUB_ID, 'children', cid);
    const notes = cleanStr(child.notes, 500);
    operations.push((batch) => {
      batch.set(childRef, {
        id: cid,
        clubId: CLUB_ID,
        fullName: (child.fullName || 'Niño').trim().slice(0, 150),
        ...(typeof child.age === 'number' && child.age >= 1 && child.age <= 99 ? { age: child.age } : {}),
        ...(notes ? { notes } : {}),
        active: child.active !== false,
        registeredDate: (child.registeredDate || new Date().toISOString().slice(0, 10)).slice(0, 20),
        isPublicClubData: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  });

  stateToSeed.leaders.forEach((leader) => {
    const lid = sanitizeId(leader.id);
    if (leader.phone) {
      leaderContacts[lid] = { phone: leader.phone.slice(0, 50) };
    }

    const leaderRef = doc(db, 'clubs', CLUB_ID, 'leaders', lid);
    const role = cleanStr(leader.role, 100);
    operations.push((batch) => {
      batch.set(leaderRef, {
        id: lid,
        clubId: CLUB_ID,
        fullName: (leader.fullName || 'Líder').trim().slice(0, 150),
        ...(role ? { role } : {}),
        active: leader.active !== false,
        isPublicClubData: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  });

  const contactsRef = doc(db, 'clubs', CLUB_ID, 'private', 'contacts');
  operations.push((batch) => {
    batch.set(contactsRef, {
      clubId: CLUB_ID,
      childContacts,
      leaderContacts,
      updatedAt: serverTimestamp(),
    });
  });

  // Sessions & subcollections
  stateToSeed.sessions.forEach((session) => {
    const sid = sanitizeId(session.id);
    const sessionRef = doc(db, 'clubs', CLUB_ID, 'sessions', sid);
    const verse = cleanStr(session.verse, 250);
    const notes = cleanStr(session.notes, 500);

    operations.push((batch) => {
      batch.set(sessionRef, {
        id: sid,
        clubId: CLUB_ID,
        date: (session.date || new Date().toISOString().slice(0, 10)).slice(0, 20),
        title: (session.title || 'Sábado del Club').trim().slice(0, 150),
        ...(verse ? { verse } : {}),
        ...(notes ? { notes } : {}),
        status: session.status === 'completed' ? 'completed' : 'active',
        isPublicClubData: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    // Attendance
    const attMap = stateToSeed.attendance[session.id] || {};
    Object.values(attMap).forEach((rec) => {
      const cid = sanitizeId(rec.childId);
      const ref = doc(db, 'clubs', CLUB_ID, 'sessions', sid, 'attendance', cid);
      operations.push((batch) => {
        batch.set(ref, {
          childId: cid,
          clubId: CLUB_ID,
          sessionId: sid,
          present: Boolean(rec.present),
          assignedTeamId: rec.assignedTeamId === 'chispas' ? 'chispas' : 'antorchas',
          markedAt: (rec.markedAt || new Date().toISOString()).slice(0, 40),
          isPublicClubData: true,
          updatedAt: serverTimestamp(),
        });
      });
    });

    // Leader assignments
    const leadMap = stateToSeed.leaderAssignments?.[session.id] || {};
    Object.values(leadMap).forEach((rec) => {
      const lid = sanitizeId(rec.leaderId);
      const ref = doc(db, 'clubs', CLUB_ID, 'sessions', sid, 'leaderAssignments', lid);
      operations.push((batch) => {
        batch.set(ref, {
          leaderId: lid,
          clubId: CLUB_ID,
          sessionId: sid,
          present: Boolean(rec.present),
          assignedTeamId: rec.assignedTeamId === 'chispas' ? 'chispas' : 'antorchas',
          markedAt: (rec.markedAt || new Date().toISOString()).slice(0, 40),
          isPublicClubData: true,
          updatedAt: serverTimestamp(),
        });
      });
    });

    // Lessons
    const lessMap = stateToSeed.lessons[session.id] || {};
    Object.values(lessMap).forEach((rec) => {
      const cid = sanitizeId(rec.childId);
      const ref = doc(db, 'clubs', CLUB_ID, 'sessions', sid, 'lessons', cid);
      const count = Math.max(0, Math.min(100, Number(rec.count ?? (rec.learned ? 1 : 0))));
      operations.push((batch) => {
        batch.set(ref, {
          childId: cid,
          clubId: CLUB_ID,
          sessionId: sid,
          learned: count > 0,
          count,
          markedAt: (rec.markedAt || new Date().toISOString()).slice(0, 40),
          isPublicClubData: true,
          updatedAt: serverTimestamp(),
        });
      });
    });

    // Game Rounds
    const rounds = stateToSeed.gameRounds[session.id] || [];
    rounds.slice(0, 3).forEach((r) => {
      const rNum = Math.max(1, Math.min(3, r.roundNumber));
      const ref = doc(db, 'clubs', CLUB_ID, 'sessions', sid, 'gameRounds', `round-${rNum}`);
      operations.push((batch) => {
        batch.set(ref, {
          clubId: CLUB_ID,
          sessionId: sid,
          roundNumber: rNum,
          name: (r.name || `Ronda ${rNum}`).trim().slice(0, 120),
          antorchasScore: Number(r.antorchasScore || 0),
          chispasScore: Number(r.chispasScore || 0),
          isPublicClubData: true,
          updatedAt: serverTimestamp(),
        });
      });
    });

    // Questions
    const questions = stateToSeed.questions[session.id] || [];
    questions.forEach((q) => {
      const qid = sanitizeId(q.id);
      const ref = doc(db, 'clubs', CLUB_ID, 'sessions', sid, 'questions', qid);
      operations.push((batch) => {
        batch.set(ref, {
          id: qid,
          clubId: CLUB_ID,
          sessionId: sid,
          teamId: q.teamId === 'chispas' ? 'chispas' : 'antorchas',
          isCorrect: Boolean(q.isCorrect),
          points: q.isCorrect ? 20 : -10,
          questionNumber: Math.max(1, Number(q.questionNumber || 1)),
          timestamp: (q.timestamp || '10:00').slice(0, 20),
          isPublicClubData: true,
          createdAt: serverTimestamp(),
        });
      });
    });

    // Extras & Penalties
    const extras = stateToSeed.extras[session.id] || [];
    extras.forEach((ex) => {
      const eid = sanitizeId(ex.id);
      const ref = doc(db, 'clubs', CLUB_ID, 'sessions', sid, 'extras', eid);
      operations.push((batch) => {
        batch.set(ref, {
          id: eid,
          clubId: CLUB_ID,
          sessionId: sid,
          teamId: ex.teamId === 'chispas' ? 'chispas' : 'antorchas',
          type: ex.type === 'penalty' ? 'penalty' : 'extra',
          points: Math.abs(Number(ex.points || 0)),
          reason: (ex.reason || 'Ajuste manual').trim().slice(0, 300),
          timestamp: (ex.timestamp || '10:00').slice(0, 20),
          isPublicClubData: true,
          createdAt: serverTimestamp(),
        });
      });
    });
  });

  // Execute in chunks of 400 operations (Firestore batch limit is 500)
  const CHUNK_SIZE = 400;
  try {
    for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
      const batch = writeBatch(db);
      const chunk = operations.slice(i, i + CHUNK_SIZE);
      chunk.forEach((fn) => fn(batch));
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `clubs/${CLUB_ID}`);
  }
}

// ==============================================================
// REAL-TIME LISTENERS
// ==============================================================

export function subscribeToClubRoot(
  onData: (data: { exists: boolean; currentSessionId?: string; soundEnabled?: boolean }) => void
) {
  const path = `clubs/${CLUB_ID}`;
  return onSnapshot(
    doc(db, 'clubs', CLUB_ID),
    (snap) => {
      if (!snap.exists()) {
        onData({ exists: false });
      } else {
        const d = snap.data();
        onData({
          exists: true,
          currentSessionId: d.currentSessionId,
          soundEnabled: d.soundEnabled,
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToChildren(onData: (children: Child[]) => void) {
  const path = `clubs/${CLUB_ID}/children`;
  const q = query(
    collection(db, 'clubs', CLUB_ID, 'children'),
    where('clubId', '==', CLUB_ID),
    where('isPublicClubData', '==', true)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: Child[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id,
          fullName: data.fullName,
          age: data.age,
          notes: data.notes,
          active: data.active !== false,
          registeredDate: data.registeredDate,
        };
      });
      list.sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToLeaders(onData: (leaders: Leader[]) => void) {
  const path = `clubs/${CLUB_ID}/leaders`;
  const q = query(
    collection(db, 'clubs', CLUB_ID, 'leaders'),
    where('clubId', '==', CLUB_ID),
    where('isPublicClubData', '==', true)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: Leader[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id,
          fullName: data.fullName,
          role: data.role,
          active: data.active !== false,
        };
      });
      list.sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToSessions(onData: (sessions: WeeklySession[]) => void) {
  const path = `clubs/${CLUB_ID}/sessions`;
  const q = query(
    collection(db, 'clubs', CLUB_ID, 'sessions'),
    where('clubId', '==', CLUB_ID),
    where('isPublicClubData', '==', true)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: WeeklySession[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id,
          date: data.date,
          title: data.title,
          verse: data.verse,
          notes: data.notes,
          status: data.status === 'completed' ? 'completed' : 'active',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        };
      });
      list.sort((a, b) => b.date.localeCompare(a.date));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToSessionDetails(
  sessionId: string,
  callbacks: {
    onAttendance: (map: Record<string, AttendanceRecord>) => void;
    onLeaderAssignments: (map: Record<string, LeaderAssignmentRecord>) => void;
    onLessons: (map: Record<string, LessonRecord>) => void;
    onGameRounds: (rounds: GameRound[]) => void;
    onQuestions: (questions: QuestionEvent[]) => void;
    onExtras: (extras: ExtraScoreEvent[]) => void;
  }
): () => void {
  const base = `clubs/${CLUB_ID}/sessions/${sessionId}`;

  const unsubAtt = onSnapshot(
    query(
      collection(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'attendance'),
      where('clubId', '==', CLUB_ID),
      where('isPublicClubData', '==', true)
    ),
    (snap) => {
      const map: Record<string, AttendanceRecord> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        map[data.childId] = {
          childId: data.childId,
          present: Boolean(data.present),
          assignedTeamId: data.assignedTeamId === 'chispas' ? 'chispas' : 'antorchas',
          markedAt: data.markedAt,
        };
      });
      callbacks.onAttendance(map);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `${base}/attendance`)
  );

  const unsubLead = onSnapshot(
    query(
      collection(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'leaderAssignments'),
      where('clubId', '==', CLUB_ID),
      where('isPublicClubData', '==', true)
    ),
    (snap) => {
      const map: Record<string, LeaderAssignmentRecord> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        map[data.leaderId] = {
          leaderId: data.leaderId,
          present: Boolean(data.present),
          assignedTeamId: data.assignedTeamId === 'chispas' ? 'chispas' : 'antorchas',
          markedAt: data.markedAt,
        };
      });
      callbacks.onLeaderAssignments(map);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `${base}/leaderAssignments`)
  );

  const unsubLess = onSnapshot(
    query(
      collection(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'lessons'),
      where('clubId', '==', CLUB_ID),
      where('isPublicClubData', '==', true)
    ),
    (snap) => {
      const map: Record<string, LessonRecord> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        map[data.childId] = {
          childId: data.childId,
          learned: Boolean(data.learned),
          count: Number(data.count || 0),
          markedAt: data.markedAt,
        };
      });
      callbacks.onLessons(map);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `${base}/lessons`)
  );

  const unsubGames = onSnapshot(
    query(
      collection(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'gameRounds'),
      where('clubId', '==', CLUB_ID),
      where('isPublicClubData', '==', true)
    ),
    (snap) => {
      const list: GameRound[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          roundNumber: Number(data.roundNumber),
          name: data.name,
          antorchasScore: Number(data.antorchasScore || 0),
          chispasScore: Number(data.chispasScore || 0),
        };
      });
      list.sort((a, b) => a.roundNumber - b.roundNumber);
      callbacks.onGameRounds(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `${base}/gameRounds`)
  );

  const unsubQuestions = onSnapshot(
    query(
      collection(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'questions'),
      where('clubId', '==', CLUB_ID),
      where('isPublicClubData', '==', true)
    ),
    (snap) => {
      const list: QuestionEvent[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id,
          teamId: data.teamId === 'chispas' ? 'chispas' : 'antorchas',
          isCorrect: Boolean(data.isCorrect),
          points: Number(data.points),
          questionNumber: Number(data.questionNumber),
          timestamp: data.timestamp,
        };
      });
      list.sort((a, b) => b.questionNumber - a.questionNumber);
      callbacks.onQuestions(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `${base}/questions`)
  );

  const unsubExtras = onSnapshot(
    query(
      collection(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'extras'),
      where('clubId', '==', CLUB_ID),
      where('isPublicClubData', '==', true)
    ),
    (snap) => {
      const list: ExtraScoreEvent[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id,
          teamId: data.teamId === 'chispas' ? 'chispas' : 'antorchas',
          type: data.type === 'penalty' ? 'penalty' : 'extra',
          points: Number(data.points),
          reason: data.reason,
          timestamp: data.timestamp,
        };
      });
      list.sort((a, b) => b.id.localeCompare(a.id));
      callbacks.onExtras(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `${base}/extras`)
  );

  return () => {
    unsubAtt();
    unsubLead();
    unsubLess();
    unsubGames();
    unsubQuestions();
    unsubExtras();
  };
}

export function subscribeToPrivateContacts(onData: (contacts: ContactsMap) => void) {
  const path = `clubs/${CLUB_ID}/private/contacts`;
  return onSnapshot(
    doc(db, 'clubs', CLUB_ID, 'private', 'contacts'),
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        onData({
          childContacts: d.childContacts || {},
          leaderContacts: d.leaderContacts || {},
        });
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

export function subscribeToPrivateConfig(onData: (config: ClubPrivateConfigData | null) => void) {
  const path = `clubs/${CLUB_ID}/private/config`;
  return onSnapshot(
    doc(db, 'clubs', CLUB_ID, 'private', 'config'),
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        onData({
          clubId: d.clubId,
          accessCode: d.accessCode || DEFAULT_ACCESS_CODE,
          authorizedEmails: Array.isArray(d.authorizedEmails) ? d.authorizedEmails : [],
        });
      } else {
        onData(null);
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

export function subscribeToMembers(onData: (members: ClubMemberData[]) => void) {
  const path = `clubs/${CLUB_ID}/members`;
  const q = query(collection(db, 'clubs', CLUB_ID, 'members'), where('clubId', '==', CLUB_ID));
  return onSnapshot(
    q,
    (snap) => {
      const list: ClubMemberData[] = snap.docs.map((d) => d.data() as ClubMemberData);
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

// ==============================================================
// MUTATIONS
// ==============================================================

export async function updateClubSettings(updates: {
  currentSessionId?: string;
  soundEnabled?: boolean;
}) {
  const path = `clubs/${CLUB_ID}`;
  try {
    await updateDoc(doc(db, 'clubs', CLUB_ID), {
      ...(updates.currentSessionId ? { currentSessionId: sanitizeId(updates.currentSessionId) } : {}),
      ...(typeof updates.soundEnabled === 'boolean' ? { soundEnabled: updates.soundEnabled } : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createChildInCloud(
  childData: Omit<Child, 'id' | 'registeredDate'>,
  sessionId: string,
  assignedTeam: TeamId
) {
  const cid = sanitizeId(`c-${Date.now()}`);
  const childPath = `clubs/${CLUB_ID}/children/${cid}`;
  const notes = cleanStr(childData.notes, 500);
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'clubs', CLUB_ID, 'children', cid), {
      id: cid,
      clubId: CLUB_ID,
      fullName: childData.fullName.trim().slice(0, 150),
      ...(typeof childData.age === 'number' && childData.age >= 1 && childData.age <= 99
        ? { age: childData.age }
        : {}),
      ...(notes ? { notes } : {}),
      active: true,
      registeredDate: new Date().toISOString().slice(0, 10),
      isPublicClubData: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'attendance', cid), {
      childId: cid,
      clubId: CLUB_ID,
      sessionId,
      present: true,
      assignedTeamId: assignedTeam,
      markedAt: new Date().toISOString(),
      isPublicClubData: true,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    // Update PII contacts separately
    if (childData.guardianName || childData.guardianPhone) {
      const contactsRef = doc(db, 'clubs', CLUB_ID, 'private', 'contacts');
      const snap = await getDoc(contactsRef);
      const existing = snap.exists() ? snap.data() : { childContacts: {}, leaderContacts: {} };
      await setDoc(contactsRef, {
        clubId: CLUB_ID,
        childContacts: {
          ...(existing.childContacts || {}),
          [cid]: {
            ...(childData.guardianName ? { guardianName: childData.guardianName.trim().slice(0, 150) } : {}),
            ...(childData.guardianPhone ? { guardianPhone: childData.guardianPhone.trim().slice(0, 50) } : {}),
          },
        },
        leaderContacts: existing.leaderContacts || {},
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, childPath);
  }
}

export async function updateChildInCloud(child: Child) {
  const cid = sanitizeId(child.id);
  const childPath = `clubs/${CLUB_ID}/children/${cid}`;
  const notes = cleanStr(child.notes, 500);
  try {
    await updateDoc(doc(db, 'clubs', CLUB_ID, 'children', cid), {
      fullName: child.fullName.trim().slice(0, 150),
      ...(typeof child.age === 'number' && child.age >= 1 && child.age <= 99 ? { age: child.age } : {}),
      ...(notes ? { notes } : {}),
      active: Boolean(child.active),
      updatedAt: serverTimestamp(),
    });

    if (child.guardianName !== undefined || child.guardianPhone !== undefined) {
      const contactsRef = doc(db, 'clubs', CLUB_ID, 'private', 'contacts');
      const snap = await getDoc(contactsRef);
      const existing = snap.exists() ? snap.data() : { childContacts: {}, leaderContacts: {} };
      await setDoc(contactsRef, {
        clubId: CLUB_ID,
        childContacts: {
          ...(existing.childContacts || {}),
          [cid]: {
            ...(child.guardianName ? { guardianName: child.guardianName.trim().slice(0, 150) } : {}),
            ...(child.guardianPhone ? { guardianPhone: child.guardianPhone.trim().slice(0, 50) } : {}),
          },
        },
        leaderContacts: existing.leaderContacts || {},
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, childPath);
  }
}

export async function deleteChildInCloud(childId: string, sessionId?: string) {
  const cid = sanitizeId(childId);
  const path = `clubs/${CLUB_ID}/children/${cid}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'clubs', CLUB_ID, 'children', cid));
    if (sessionId) {
      const sid = sanitizeId(sessionId);
      batch.delete(doc(db, 'clubs', CLUB_ID, 'sessions', sid, 'attendance', cid));
      batch.delete(doc(db, 'clubs', CLUB_ID, 'sessions', sid, 'lessons', cid));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createLeaderInCloud(leaderData: Omit<Leader, 'id'>) {
  const lid = sanitizeId(`lead-${Date.now()}`);
  const path = `clubs/${CLUB_ID}/leaders/${lid}`;
  const role = cleanStr(leaderData.role, 100);
  try {
    await setDoc(doc(db, 'clubs', CLUB_ID, 'leaders', lid), {
      id: lid,
      clubId: CLUB_ID,
      fullName: leaderData.fullName.trim().slice(0, 150),
      ...(role ? { role } : {}),
      active: true,
      isPublicClubData: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (leaderData.phone) {
      const contactsRef = doc(db, 'clubs', CLUB_ID, 'private', 'contacts');
      const snap = await getDoc(contactsRef);
      const existing = snap.exists() ? snap.data() : { childContacts: {}, leaderContacts: {} };
      await setDoc(contactsRef, {
        clubId: CLUB_ID,
        childContacts: existing.childContacts || {},
        leaderContacts: {
          ...(existing.leaderContacts || {}),
          [lid]: { phone: leaderData.phone.trim().slice(0, 50) },
        },
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteLeaderInCloud(leaderId: string, sessionId?: string) {
  const lid = sanitizeId(leaderId);
  const path = `clubs/${CLUB_ID}/leaders/${lid}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'clubs', CLUB_ID, 'leaders', lid));
    if (sessionId) {
      const sid = sanitizeId(sessionId);
      batch.delete(doc(db, 'clubs', CLUB_ID, 'sessions', sid, 'leaderAssignments', lid));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createSessionInCloud(sessionData: Omit<WeeklySession, 'id' | 'createdAt'>) {
  const sid = sanitizeId(`session-${sessionData.date}-${Date.now().toString().slice(-4)}`);
  const path = `clubs/${CLUB_ID}/sessions/${sid}`;
  const verse = cleanStr(sessionData.verse, 250);
  const notes = cleanStr(sessionData.notes, 500);
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'clubs', CLUB_ID, 'sessions', sid), {
      id: sid,
      clubId: CLUB_ID,
      date: sessionData.date.slice(0, 20),
      title: sessionData.title.trim().slice(0, 150),
      ...(verse ? { verse } : {}),
      ...(notes ? { notes } : {}),
      status: 'active',
      isPublicClubData: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const defaultRounds = [
      { roundNumber: 1, name: 'Ronda 1: Carrera de Relevos' },
      { roundNumber: 2, name: 'Ronda 2: Cuerda Real' },
      { roundNumber: 3, name: 'Ronda 3: Búsqueda del Versículo' },
    ];
    defaultRounds.forEach((r) => {
      batch.set(doc(db, 'clubs', CLUB_ID, 'sessions', sid, 'gameRounds', `round-${r.roundNumber}`), {
        clubId: CLUB_ID,
        sessionId: sid,
        roundNumber: r.roundNumber,
        name: r.name,
        antorchasScore: 0,
        chispasScore: 0,
        isPublicClubData: true,
        updatedAt: serverTimestamp(),
      });
    });

    batch.update(doc(db, 'clubs', CLUB_ID), {
      currentSessionId: sid,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    return sid;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function completeSessionInCloud(sessionId: string) {
  const path = `clubs/${CLUB_ID}/sessions/${sessionId}`;
  try {
    await updateDoc(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId), {
      status: 'completed',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function setChildAttendanceInCloud(
  sessionId: string,
  childId: string,
  present: boolean,
  assignedTeamId: TeamId
) {
  const cid = sanitizeId(childId);
  const path = `clubs/${CLUB_ID}/sessions/${sessionId}/attendance/${cid}`;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'attendance', cid), {
      childId: cid,
      clubId: CLUB_ID,
      sessionId,
      present,
      assignedTeamId,
      markedAt: new Date().toISOString(),
      isPublicClubData: true,
      updatedAt: serverTimestamp(),
    });
    if (!present) {
      batch.set(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'lessons', cid), {
        childId: cid,
        clubId: CLUB_ID,
        sessionId,
        learned: false,
        count: 0,
        markedAt: new Date().toISOString(),
        isPublicClubData: true,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function batchUpdateAttendanceInCloud(
  sessionId: string,
  updates: Array<{ childId: string; present: boolean; assignedTeamId: TeamId; resetLessons?: boolean }>
) {
  const path = `clubs/${CLUB_ID}/sessions/${sessionId}/attendance`;
  try {
    const CHUNK = 200;
    for (let i = 0; i < updates.length; i += CHUNK) {
      const batch = writeBatch(db);
      updates.slice(i, i + CHUNK).forEach((item) => {
        const cid = sanitizeId(item.childId);
        batch.set(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'attendance', cid), {
          childId: cid,
          clubId: CLUB_ID,
          sessionId,
          present: item.present,
          assignedTeamId: item.assignedTeamId,
          markedAt: new Date().toISOString(),
          isPublicClubData: true,
          updatedAt: serverTimestamp(),
        });
        if (item.resetLessons) {
          batch.set(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'lessons', cid), {
            childId: cid,
            clubId: CLUB_ID,
            sessionId,
            learned: false,
            count: 0,
            markedAt: new Date().toISOString(),
            isPublicClubData: true,
            updatedAt: serverTimestamp(),
          });
        }
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function setLeaderAssignmentInCloud(
  sessionId: string,
  leaderId: string,
  present: boolean,
  assignedTeamId: TeamId
) {
  const lid = sanitizeId(leaderId);
  const path = `clubs/${CLUB_ID}/sessions/${sessionId}/leaderAssignments/${lid}`;
  try {
    await setDoc(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'leaderAssignments', lid), {
      leaderId: lid,
      clubId: CLUB_ID,
      sessionId,
      present,
      assignedTeamId,
      markedAt: new Date().toISOString(),
      isPublicClubData: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function batchUpdateLeaderAssignmentsInCloud(
  sessionId: string,
  updates: Array<{ leaderId: string; present: boolean; assignedTeamId: TeamId }>
) {
  const path = `clubs/${CLUB_ID}/sessions/${sessionId}/leaderAssignments`;
  try {
    const batch = writeBatch(db);
    updates.forEach((item) => {
      const lid = sanitizeId(item.leaderId);
      batch.set(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'leaderAssignments', lid), {
        leaderId: lid,
        clubId: CLUB_ID,
        sessionId,
        present: item.present,
        assignedTeamId: item.assignedTeamId,
        markedAt: new Date().toISOString(),
        isPublicClubData: true,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function setLessonCountInCloud(sessionId: string, childId: string, count: number) {
  const cid = sanitizeId(childId);
  const safeCount = Math.max(0, Math.min(100, Math.floor(count)));
  const path = `clubs/${CLUB_ID}/sessions/${sessionId}/lessons/${cid}`;
  try {
    await setDoc(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'lessons', cid), {
      childId: cid,
      clubId: CLUB_ID,
      sessionId,
      learned: safeCount > 0,
      count: safeCount,
      markedAt: new Date().toISOString(),
      isPublicClubData: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function batchSetLessonsInCloud(
  sessionId: string,
  childIds: string[],
  count: number
) {
  const safeCount = Math.max(0, Math.min(100, Math.floor(count)));
  const path = `clubs/${CLUB_ID}/sessions/${sessionId}/lessons`;
  try {
    const batch = writeBatch(db);
    childIds.forEach((id) => {
      const cid = sanitizeId(id);
      batch.set(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'lessons', cid), {
        childId: cid,
        clubId: CLUB_ID,
        sessionId,
        learned: safeCount > 0,
        count: safeCount,
        markedAt: new Date().toISOString(),
        isPublicClubData: true,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveGameRoundInCloud(sessionId: string, round: GameRound) {
  const rNum = Math.max(1, Math.min(3, round.roundNumber));
  const path = `clubs/${CLUB_ID}/sessions/${sessionId}/gameRounds/round-${rNum}`;
  try {
    await setDoc(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'gameRounds', `round-${rNum}`), {
      clubId: CLUB_ID,
      sessionId,
      roundNumber: rNum,
      name: (round.name || `Ronda ${rNum}`).trim().slice(0, 120),
      antorchasScore: Number(round.antorchasScore || 0),
      chispasScore: Number(round.chispasScore || 0),
      isPublicClubData: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeGameRoundInCloud(sessionId: string, roundsAfterRemove: GameRound[]) {
  const path = `clubs/${CLUB_ID}/sessions/${sessionId}/gameRounds`;
  try {
    const batch = writeBatch(db);
    // Delete all 3 possible slots and rewrite remaining sequentially
    for (let i = 1; i <= 3; i++) {
      batch.delete(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'gameRounds', `round-${i}`));
    }
    roundsAfterRemove.slice(0, 3).forEach((r, idx) => {
      const num = idx + 1;
      batch.set(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'gameRounds', `round-${num}`), {
        clubId: CLUB_ID,
        sessionId,
        roundNumber: num,
        name: (r.name || `Ronda ${num}`).trim().slice(0, 120),
        antorchasScore: Number(r.antorchasScore || 0),
        chispasScore: Number(r.chispasScore || 0),
        isPublicClubData: true,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function addQuestionInCloud(
  sessionId: string,
  teamId: TeamId,
  isCorrect: boolean,
  nextQuestionNumber: number
) {
  const qid = sanitizeId(`q-${Date.now()}`);
  const path = `clubs/${CLUB_ID}/sessions/${sessionId}/questions/${qid}`;
  try {
    await setDoc(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'questions', qid), {
      id: qid,
      clubId: CLUB_ID,
      sessionId,
      teamId,
      isCorrect,
      points: isCorrect ? 20 : -10,
      questionNumber: Math.max(1, nextQuestionNumber),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).slice(0, 20),
      isPublicClubData: true,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeQuestionInCloud(sessionId: string, questionId: string) {
  const qid = sanitizeId(questionId);
  const path = `clubs/${CLUB_ID}/sessions/${sessionId}/questions/${qid}`;
  try {
    await deleteDoc(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'questions', qid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearQuestionsInCloud(sessionId: string) {
  const path = `clubs/${CLUB_ID}/sessions/${sessionId}/questions`;
  try {
    const snap = await getDocs(
      query(
        collection(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'questions'),
        where('clubId', '==', CLUB_ID),
        where('isPublicClubData', '==', true)
      )
    );
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function addExtraInCloud(
  sessionId: string,
  event: Omit<ExtraScoreEvent, 'id' | 'timestamp'>
) {
  const eid = sanitizeId(`extra-${Date.now()}`);
  const path = `clubs/${CLUB_ID}/sessions/${sessionId}/extras/${eid}`;
  try {
    await setDoc(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'extras', eid), {
      id: eid,
      clubId: CLUB_ID,
      sessionId,
      teamId: event.teamId,
      type: event.type,
      points: Math.abs(Number(event.points || 0)),
      reason: event.reason.trim().slice(0, 300),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).slice(0, 20),
      isPublicClubData: true,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeExtraInCloud(sessionId: string, extraId: string) {
  const eid = sanitizeId(extraId);
  const path = `clubs/${CLUB_ID}/sessions/${sessionId}/extras/${eid}`;
  try {
    await deleteDoc(doc(db, 'clubs', CLUB_ID, 'sessions', sessionId, 'extras', eid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function savePrivateConfigInCloud(accessCode: string, authorizedEmails: string[]) {
  const path = `clubs/${CLUB_ID}/private/config`;
  try {
    await setDoc(doc(db, 'clubs', CLUB_ID, 'private', 'config'), {
      clubId: CLUB_ID,
      accessCode: accessCode.trim().slice(0, 32),
      authorizedEmails: authorizedEmails
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0)
        .slice(0, 50),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeMemberInCloud(uid: string) {
  const path = `clubs/${CLUB_ID}/members/${uid}`;
  try {
    await deleteDoc(doc(db, 'clubs', CLUB_ID, 'members', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
