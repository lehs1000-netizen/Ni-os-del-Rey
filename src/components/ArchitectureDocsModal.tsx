import React, { useState } from 'react';
import { Database, Server, Layers, Cpu, Code2, Download, Upload, RotateCcw, X, Check, Copy } from 'lucide-react';
import { ClubState } from '../types';
import { exportBackup } from '../utils/storage';

interface ArchitectureDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: ClubState;
  onRestoreState: (state: ClubState) => void;
  onResetToDefault: () => void;
}

export const ArchitectureDocsModal: React.FC<ArchitectureDocsModalProps> = ({
  isOpen,
  onClose,
  state,
  onRestoreState,
  onResetToDefault,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'erd' | 'backup'>('architecture');
  const [copiedSql, setCopiedSql] = useState(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const sqlDDL = `-- ========================================================
-- ESQUEMA DE BASE DE DATOS RELACIONAL: CLUB NIÑOS DEL REY
-- Compatible con PostgreSQL / Supabase / Cloud SQL / SQLite
-- ========================================================

-- 1. Catálogo de Equipos
CREATE TABLE teams (
    id VARCHAR(20) PRIMARY KEY, -- 'antorchas' | 'chispas'
    name VARCHAR(50) NOT NULL,
    color_name VARCHAR(30) NOT NULL,
    color_hex VARCHAR(7) NOT NULL,
    motto TEXT
);

INSERT INTO teams (id, name, color_name, color_hex, motto) VALUES
('antorchas', 'ANTORCHAS', 'Rojo', '#DC2626', '¡Luz y Fuego en la Verdad!'),
('chispas', 'CHISPAS', 'Amarillo', '#EAB308', '¡Brillando con el Poder del Rey!');

-- 2. Registro Permanente de Niños y Líderes
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    age INT CHECK (age BETWEEN 3 AND 18),
    guardian_name VARCHAR(150),
    guardian_phone VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE leaders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(100) DEFAULT 'Líder de Equipo',
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Sesiones Semanales del Programa (1 día por semana)
CREATE TABLE weekly_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_date DATE NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    memory_verse TEXT,
    status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Marcador de Asistencia Semanal y Asignación de Equipos (Dinámico / Aleatorio cada Sábado)
CREATE TABLE attendance_records (
    session_id UUID NOT NULL REFERENCES weekly_sessions(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    assigned_team_id VARCHAR(20) NOT NULL REFERENCES teams(id) ON UPDATE CASCADE,
    is_present BOOLEAN DEFAULT FALSE NOT NULL,
    marked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (session_id, child_id)
);

CREATE TABLE leader_session_assignments (
    session_id UUID NOT NULL REFERENCES weekly_sessions(id) ON DELETE CASCADE,
    leader_id UUID NOT NULL REFERENCES leaders(id) ON DELETE CASCADE,
    assigned_team_id VARCHAR(20) NOT NULL REFERENCES teams(id) ON UPDATE CASCADE,
    is_present BOOLEAN DEFAULT TRUE NOT NULL,
    marked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (session_id, leader_id)
);

-- 5. Lecciones Aprendidas (Multiplicador: Lecciones Dadas × 20)
CREATE TABLE lesson_evaluations (
    session_id UUID NOT NULL,
    child_id UUID NOT NULL,
    lessons_count INT DEFAULT 0 NOT NULL CHECK (lessons_count >= 0),
    points_awarded INT GENERATED ALWAYS AS (lessons_count * 20) STORED,
    marked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (session_id, child_id),
    FOREIGN KEY (session_id, child_id) REFERENCES attendance_records(session_id, child_id) ON DELETE CASCADE
);

-- 6. Puntuación de Juegos (2 a 3 Rondas por Sesión)
CREATE TABLE game_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES weekly_sessions(id) ON DELETE CASCADE,
    round_number INT NOT NULL CHECK (round_number BETWEEN 1 AND 3),
    game_title VARCHAR(100) NOT NULL,
    antorchas_score INT DEFAULT 0 NOT NULL CHECK (antorchas_score >= 0),
    chispas_score INT DEFAULT 0 NOT NULL CHECK (chispas_score >= 0),
    UNIQUE (session_id, round_number)
);

-- 7. Preguntas Bíblicas / Rápidas (+20 / -10)
CREATE TABLE question_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES weekly_sessions(id) ON DELETE CASCADE,
    team_id VARCHAR(20) NOT NULL REFERENCES teams(id) ON UPDATE CASCADE,
    is_correct BOOLEAN NOT NULL,
    points_delta INT NOT NULL CHECK (points_delta IN (20, -10)),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Extras y Descuentos Manuales (Sin Restricciones + Auditoría Detallada)
CREATE TABLE score_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES weekly_sessions(id) ON DELETE CASCADE,
    team_id VARCHAR(20) NOT NULL REFERENCES teams(id) ON UPDATE CASCADE,
    adjustment_type VARCHAR(10) NOT NULL CHECK (adjustment_type IN ('extra', 'penalty')),
    points INT NOT NULL, -- Cualquier cantidad sin restricción
    reason TEXT NOT NULL, -- Justificación auditada
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Vista en Tiempo Real de Puntajes Totales por Equipo y Sesión:
CREATE VIEW v_session_leaderboard AS
SELECT
    s.id AS session_id,
    s.program_date,
    t.id AS team_id,
    t.name AS team_name,
    COALESCE(games.total_games, 0) AS games_points,
    COALESCE(lessons.total_lessons, 0) AS lessons_points,
    COALESCE(questions.total_questions, 0) AS questions_points,
    COALESCE(extras.total_extras, 0) - COALESCE(penalties.total_penalties, 0) AS adjustments_points,
    (
      COALESCE(games.total_games, 0) +
      COALESCE(lessons.total_lessons, 0) +
      COALESCE(questions.total_questions, 0) +
      COALESCE(extras.total_extras, 0) -
      COALESCE(penalties.total_penalties, 0)
    ) AS grand_total
FROM weekly_sessions s
CROSS JOIN teams t
LEFT JOIN (
    SELECT session_id,
           SUM(CASE WHEN t.id = 'antorchas' THEN antorchas_score ELSE chispas_score END) as total_games
    FROM game_rounds g
    CROSS JOIN teams t
    GROUP BY session_id, t.id
) games ON games.session_id = s.id
LEFT JOIN (
    SELECT l.session_id, c.team_id, SUM(l.points_awarded) as total_lessons
    FROM lesson_evaluations l
    JOIN children c ON c.id = l.child_id
    GROUP BY l.session_id, c.team_id
) lessons ON lessons.session_id = s.id AND lessons.team_id = t.id
LEFT JOIN (
    SELECT session_id, team_id, SUM(points_delta) as total_questions
    FROM question_events
    GROUP BY session_id, team_id
) questions ON questions.session_id = s.id AND questions.team_id = t.id
LEFT JOIN (
    SELECT session_id, team_id, SUM(points) as total_extras
    FROM score_adjustments WHERE adjustment_type = 'extra'
    GROUP BY session_id, team_id
) extras ON extras.session_id = s.id AND extras.team_id = t.id
LEFT JOIN (
    SELECT session_id, team_id, SUM(points) as total_penalties
    FROM score_adjustments WHERE adjustment_type = 'penalty'
    GROUP BY session_id, team_id
) penalties ON penalties.session_id = s.id AND penalties.team_id = t.id;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlDDL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.children && parsed.sessions) {
          onRestoreState(parsed);
          setBackupNotice('¡Base de datos restaurada con éxito!');
        } else {
          setBackupNotice('Archivo JSON no válido para Niños del Rey.');
        }
      } catch {
        setBackupNotice('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-slate-900">
                Arquitectura del Sistema y Esquema de Base de Datos
              </h2>
              <p className="text-xs text-slate-500">
                Diseño técnico formal para el club infantil &ldquo;Niños del Rey&rdquo;
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 gap-6 bg-white overflow-x-auto">
          {[
            { id: 'architecture', label: 'Arquitectura del Sistema', icon: Layers },
            { id: 'schema', label: 'Esquema Relacional SQL', icon: Database },
            { id: 'erd', label: 'Diagrama Entidad-Relación (ERD)', icon: Cpu },
            { id: 'backup', label: 'Exportar / Importar Datos', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-amber-500 text-amber-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-700 text-sm space-y-6">
          
          {/* TAB 1: ARQUITECTURA */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <h3 className="font-bold text-base text-amber-950 font-display mb-1">
                  1. Visión General de la Arquitectura
                </h3>
                <p className="text-xs text-amber-900/80 leading-relaxed">
                  El sistema está diseñado bajo una arquitectura multicapa reactiva, optimizada para tablets, laptops y proyectores de salones dominicales o eventos sabatinos. Garantiza operación offline y sincronización en tiempo real.
                </p>
              </div>

              {/* Architecture 4-Tier Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs mb-2">
                      01
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Capa de Presentación</h4>
                    <p className="text-xs text-slate-500 leading-normal">
                      React 19, Tailwind CSS v4, animaciones con Motion y efectos de celebración con Canvas-Confetti.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono text-blue-600">
                    UI Responsiva + Top Bar Contract
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs mb-2">
                      02
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Motor de Reglas de Negocio</h4>
                    <p className="text-xs text-slate-500 leading-normal">
                      Multiplicador automático de lecciones (20 pts), cálculo de preguntas (+20/-10), validación de presencia previa obligatoria.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono text-amber-700">
                    Domain Scoring Engine
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mb-2">
                      03
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Capa de Persistencia</h4>
                    <p className="text-xs text-slate-500 leading-normal">
                      Almacenamiento reactivo local en LocalStorage/IndexedDB con versionado de esquema, compatible con exportación JSON y respaldo en la nube.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono text-emerald-700">
                    Storage Repository
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs mb-2">
                      04
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Motor de Audio y FX</h4>
                    <p className="text-xs text-slate-500 leading-normal">
                      Sintetizador Web Audio API autónomo (sin dependencias externas de archivos mp3) y generador de partículas de victoria.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] font-mono text-purple-700">
                    Web Audio Synth + Confetti
                  </div>
                </div>

              </div>

              {/* Mathematical Formulation */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">
                  Fórmula Matemática del Marcador en Tiempo Real:
                </h4>
                <div className="p-3 bg-slate-900 text-amber-300 font-mono text-xs sm:text-sm rounded-xl overflow-x-auto">
                  TotalEquipo = Σ(PuntosJuegos_rondas) + (NiñosPresentesQueAprendieron × 20) + (PreguntasCorrectas × 20 - PreguntasIncorrectas × 10) + Extras - Penalizaciones
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <strong>Regla de Lecciones:</strong> No se puede otorgar lección a un niño que no tiene registro de asistencia activo (Attendance.present = true).
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <strong>Regla de Asignación:</strong> Cada niño pertenece estrictamente a 1 equipo permanente (Antorchas o Chispas), evitando discrepancias entre semanas.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SQL DDL */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-display">
                    Definición de Tablas Relacionales (DDL ANSI SQL)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Estructura normalizada en 3ra Forma Normal (3NF) con claves foráneas, restricciones CHECK e índices.
                  </p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-xs rounded-2xl overflow-x-auto leading-relaxed border border-slate-800 max-h-[420px]">
                {sqlDDL}
              </pre>
            </div>
          )}

          {/* TAB 3: ERD DIAGRAM */}
          {activeTab === 'erd' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 font-display">
                  Diagrama Entidad-Relación (ERD)
                </h3>
                <p className="text-xs text-slate-500">
                  Relaciones de cardinalidad y claves primarias/foráneas
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  
                  {/* Entity Teams */}
                  <div className="p-3 bg-white rounded-xl border-2 border-red-300 shadow-2xs">
                    <div className="font-bold text-red-700 border-b border-red-100 pb-1 mb-2">
                      TEAMS [Catálogo]
                    </div>
                    <ul className="space-y-1 text-slate-600">
                      <li><strong className="text-slate-900">PK:</strong> id (antorchas|chispas)</li>
                      <li>name: VARCHAR</li>
                      <li>color_hex: VARCHAR</li>
                      <li>motto: TEXT</li>
                    </ul>
                  </div>

                  {/* Entity Children */}
                  <div className="p-3 bg-white rounded-xl border-2 border-amber-400 shadow-2xs">
                    <div className="font-bold text-amber-800 border-b border-amber-100 pb-1 mb-2">
                      CHILDREN [Permanente]
                    </div>
                    <ul className="space-y-1 text-slate-600">
                      <li><strong className="text-slate-900">PK:</strong> id (UUID)</li>
                      <li><strong className="text-amber-700">FK:</strong> team_id → TEAMS.id</li>
                      <li>full_name: VARCHAR</li>
                      <li>age: INT</li>
                      <li>guardian_phone: VARCHAR</li>
                      <li>is_active: BOOLEAN</li>
                    </ul>
                  </div>

                  {/* Entity Weekly Sessions */}
                  <div className="p-3 bg-white rounded-xl border-2 border-blue-300 shadow-2xs">
                    <div className="font-bold text-blue-700 border-b border-blue-100 pb-1 mb-2">
                      WEEKLY_SESSIONS [Semanal]
                    </div>
                    <ul className="space-y-1 text-slate-600">
                      <li><strong className="text-slate-900">PK:</strong> id (UUID)</li>
                      <li>program_date: DATE (1 por sem)</li>
                      <li>title: VARCHAR</li>
                      <li>verse: TEXT</li>
                      <li>status: VARCHAR</li>
                    </ul>
                  </div>

                </div>

                {/* Second row of ERD */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
                  
                  <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-2xs">
                    <div className="font-bold text-slate-900 border-b pb-1 mb-1.5">
                      ATTENDANCE_RECORDS
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div><strong>PK, FK:</strong> session_id</div>
                      <div><strong>PK, FK:</strong> child_id</div>
                      <div>is_present: BOOLEAN</div>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-2xs">
                    <div className="font-bold text-slate-900 border-b pb-1 mb-1.5">
                      LESSON_EVALUATIONS
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div><strong>PK, FK:</strong> session_id, child_id</div>
                      <div>has_learned: BOOLEAN</div>
                      <div>points: 20 (Multiplicador)</div>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-2xs">
                    <div className="font-bold text-slate-900 border-b pb-1 mb-1.5">
                      GAME_ROUNDS
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div><strong>PK:</strong> id</div>
                      <div><strong>FK:</strong> session_id</div>
                      <div>round_number: 1..3</div>
                      <div>antorchas_score: INT</div>
                      <div>chispas_score: INT</div>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-2xs">
                    <div className="font-bold text-slate-900 border-b pb-1 mb-1.5">
                      QUESTION_EVENTS
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div><strong>PK:</strong> id</div>
                      <div><strong>FK:</strong> session_id, team_id</div>
                      <div>is_correct: BOOLEAN</div>
                      <div>delta: +20 ó -10</div>
                    </div>
                  </div>

                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-900">Cardinalidades Clave:</span>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><strong>TEAMS (1) ── (N) CHILDREN:</strong> Un niño pertenece estrictamente a un único equipo.</li>
                    <li><strong>WEEKLY_SESSIONS (1) ── (N) ATTENDANCE_RECORDS (N) ── (1) CHILDREN:</strong> Asistencia semanal única por niño.</li>
                    <li><strong>ATTENDANCE_RECORDS (1) ── (1) LESSON_EVALUATIONS:</strong> La evaluación de lección deriva directamente de la asistencia del niño.</li>
                    <li><strong>WEEKLY_SESSIONS (1) ── (2..3) GAME_ROUNDS:</strong> Cada sesión contiene de 2 a 3 rondas recreativas.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-base text-slate-900 font-display">
                  Gestión y Respaldo de Datos del Club
                </h3>
                <p className="text-xs text-slate-500">
                  Exporta una copia de seguridad en formato JSON estándar o restaura un respaldo previo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Export Card */}
                <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-amber-950 text-sm mb-1">
                      <Download className="w-4 h-4 text-amber-700" />
                      <span>Descargar Copia de Seguridad JSON</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Guarda todos los niños registrados, historial de asistencias, rondas de juegos, preguntas y extras.
                    </p>
                  </div>
                  <button
                    onClick={() => exportBackup(state)}
                    className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Backup JSON</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-blue-950 text-sm mb-1">
                      <Upload className="w-4 h-4 text-blue-700" />
                      <span>Restaurar desde Archivo JSON</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Carga un archivo de respaldo previo para restaurar los datos en esta u otra computadora.
                    </p>
                  </div>
                  <label className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer text-center">
                    <Upload className="w-4 h-4" />
                    <span>Seleccionar Archivo JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

              </div>

              {backupNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                  {backupNotice}
                </div>
              )}

              {/* Reset to initial demo data */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-800">Restablecer Datos de Demostración</div>
                  <div className="text-[11px] text-slate-500">Reinicia la lista de niños, sesiones y puntuaciones a los valores iniciales.</div>
                </div>

                {confirmReset ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onResetToDefault();
                        setConfirmReset(false);
                        setBackupNotice('Datos restablecidos.');
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-500 cursor-pointer"
                    >
                      Confirmar Restablecimiento
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer Semilla</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
};
