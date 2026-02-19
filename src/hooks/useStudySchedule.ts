type StudyArea = 'matematica' | 'linguagens' | 'natureza' | 'humanas';
type SessionType = 'objetivas' | 'redacao' | 'simulado' | 'descanso';

interface DaySchedule {
  area: StudyArea | 'mista' | null;
  sessionType: SessionType;
  questionCount: number;
  label: string;
  dayName: string;
}

const SCHEDULE: Record<number, DaySchedule> = {
  1: { area: 'matematica', sessionType: 'objetivas', questionCount: 20, label: 'Matemática', dayName: 'Segunda' },
  2: { area: 'linguagens', sessionType: 'objetivas', questionCount: 20, label: 'Linguagens', dayName: 'Terça' },
  3: { area: 'natureza', sessionType: 'objetivas', questionCount: 20, label: 'Ciências da Natureza', dayName: 'Quarta' },
  4: { area: 'humanas', sessionType: 'objetivas', questionCount: 20, label: 'Ciências Humanas', dayName: 'Quinta' },
  5: { area: null, sessionType: 'redacao', questionCount: 0, label: 'Redação + Revisão', dayName: 'Sexta' },
  6: { area: 'mista', sessionType: 'simulado', questionCount: 90, label: 'Simulado', dayName: 'Sábado' },
  0: { area: null, sessionType: 'descanso', questionCount: 0, label: 'Descanso Ativo', dayName: 'Domingo' },
};

export function useStudySchedule() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const schedule = SCHEDULE[dayOfWeek];

  return {
    ...schedule,
    isObjectiveDay: schedule.sessionType === 'objetivas' || schedule.sessionType === 'simulado',
    isEssayDay: schedule.sessionType === 'redacao',
    isRestDay: schedule.sessionType === 'descanso',
  };
}
