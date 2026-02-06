// src/utils/atividadeRecorrencia.ts

const DAILY_INTERVALS: Record<string, number> = {
  "Todos os dias": 1,
  "Em dias alternados": 2,
};

const WEEKLY_INTERVALS: Record<string, number> = {
  "A cada semana": 7,
  "A cada 15 dias": 15,
};

const MONTHLY_INTERVALS: Record<string, number> = {
  "A cada 1 mês": 1,
  "A cada 2 meses": 2,
  "A cada 3 meses": 3,
  "A cada 4 meses": 4,
  "A cada 5 meses": 5,
  "A cada 6 meses": 6,
  "A cada 1 ano": 12,
  "A cada 2 anos": 24,
  "A cada 3 anos": 36,
  "A cada 5 anos": 60,
  "A cada 10 anos": 120,
};

export interface TaskLike {
  id?: number | string;
  name?: string;
  frequency: string;      // precisa bater com FREQUENCIAS
  startDate: string;      // expectedDate ou createdAt
  buildingDeliveryDate?: string; // opcional, pra regra especial do edifício
  completionDate?: string; // opcional, data de finalização do ciclo recorrente
}

export interface HistoricoLike {
  atividadeId: string | number;
  dataReferencia: string; // ISO
  status: "PENDENTE" | "EM_ANDAMENTO" | "FEITO" | string;
  completedAt?: string | null;
  observacoes?: string | null;
}

export type StatusDia =
  | "NAO_ESPERADO"
  | "SEM_REGISTRO"
  | "PENDENTE"
  | "EM_ANDAMENTO"
  | "FEITO"
  | string;

export interface StatusNoDia {
  esperadoHoje: boolean;
  statusHoje: StatusDia;
  historicoHoje?: HistoricoLike | null;
}

export interface DiaCalendario {
  data: Date;
  esperado: boolean;
  status: StatusDia;
}

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const parseDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return normalizeDate(value);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const slice = trimmed.length >= 10 ? trimmed.slice(0, 10) : trimmed;
    const match = slice.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      return normalizeDate(
        new Date(Number(year), Number(month) - 1, Number(day)),
      );
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return normalizeDate(parsed);
    }
  }

  return null;
};

const differenceInDays = (start: Date, end: Date): number => {
  return Math.floor(
    (normalizeDate(end).getTime() - normalizeDate(start).getTime()) /
      MILLISECONDS_IN_DAY,
  );
};

const isSameDay = (a: Date, b: Date): boolean => {
  return normalizeDate(a).getTime() === normalizeDate(b).getTime();
};

const addDays = (date: Date, amount: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return normalizeDate(result);
};

const addMonths = (date: Date, amount: number): Date => {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + amount);

  const lastDayOfMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(originalDay, lastDayOfMonth));

  return normalizeDate(result);
};

const occursOnIntervalDays = (
  startDate: Date,
  targetDate: Date,
  interval: number,
): boolean => {
  if (targetDate < startDate) return false;
  const diff = differenceInDays(startDate, targetDate);
  return diff % interval === 0;
};

const occursOnIntervalMonths = (
  startDate: Date,
  targetDate: Date,
  monthsInterval: number,
): boolean => {
  if (targetDate < startDate) return false;
  let candidate = normalizeDate(startDate);

  // limite pra não travar
  for (let i = 0; i < 600; i += monthsInterval) {
    if (candidate > targetDate) {
      return false;
    }

    if (isSameDay(candidate, targetDate)) {
      return true;
    }

    candidate = addMonths(candidate, monthsInterval);
  }

  return false;
};

const nextOnMonthlyInterval = (
  startDate: Date,
  fromDate: Date,
  monthsInterval: number,
): Date | null => {
  let candidate = normalizeDate(startDate);
  const searchStart = fromDate > startDate ? fromDate : startDate;

  if (candidate < searchStart) {
    while (candidate < searchStart) {
      candidate = addMonths(candidate, monthsInterval);
    }
  }

  return candidate >= searchStart ? candidate : null;
};

const nextOnDailyInterval = (
  startDate: Date,
  fromDate: Date,
  interval: number,
): Date | null => {
  const from = normalizeDate(fromDate);
  const start = normalizeDate(startDate);

  if (from <= start) {
    return start;
  }

  const diff = differenceInDays(start, from);
  const remainder = diff % interval;

  if (remainder === 0) {
    return from;
  }

  return addDays(from, interval - remainder);
};

const findNextWeekday = (
  startDate: Date,
  fromDate: Date,
  includeSaturday: boolean,
): Date | null => {
  let candidate = fromDate > startDate ? fromDate : startDate;

  for (let i = 0; i < 14; i += 1) {
    const day = candidate.getDay();
    const isValid = includeSaturday
      ? day >= 1 && day <= 6
      : day >= 1 && day <= 5;

    if (candidate >= startDate && isValid) {
      return candidate;
    }

    candidate = addDays(candidate, 1);
  }

  return null;
};

/**
 * Regra especial por idade do edifício:
 *  - até 10 anos:  a cada 5 anos
 *  - 11–30 anos:  a cada 3 anos
 *  - > 30 anos:   1x por ano
 */
const occursOnBuildingRule = (
  startDate: Date,
  buildingDeliveryDate: Date,
  targetDate: Date,
): boolean => {
  let current = normalizeDate(startDate);
  const target = normalizeDate(targetDate);
  const entrega = normalizeDate(buildingDeliveryDate);

  if (target < current) return false;

  for (let i = 0; i < 100; i++) {
    if (isSameDay(current, target)) return true;
    if (current > target) return false;

    const idade = current.getFullYear() - entrega.getFullYear();

    let stepYears: number;
    if (idade <= 10) stepYears = 5;
    else if (idade <= 30) stepYears = 3;
    else stepYears = 1;

    current = addMonths(current, 12 * stepYears);
  }

  return false;
};

const nextOnBuildingRule = (
  startDate: Date,
  buildingDeliveryDate: Date,
  fromDate: Date,
): Date | null => {
  let current = normalizeDate(startDate);
  const entrega = normalizeDate(buildingDeliveryDate);
  const target = normalizeDate(fromDate > startDate ? fromDate : startDate);

  for (let i = 0; i < 100; i++) {
    if (current >= target) return current;

    const idade = current.getFullYear() - entrega.getFullYear();

    let stepYears: number;
    if (idade <= 10) stepYears = 5;
    else if (idade <= 30) stepYears = 3;
    else stepYears = 1;

    current = addMonths(current, 12 * stepYears);
  }

  return null;
};

/**
 * Pela frequência, essa tarefa é devida nesse dia?
 */
export const isTaskDueToday = (
  task: TaskLike,
  referenceDate: Date = new Date(),
): boolean => {
  const { frequency, startDate: startDateInput, buildingDeliveryDate, completionDate } = task;
  const startDate = parseDate(startDateInput);
  const targetDate = normalizeDate(referenceDate);

  if (!startDate || !frequency) {
    return false;
  }

  // Verifica se o ciclo já encerrou (completionDate)
  if (completionDate) {
    const endDate = parseDate(completionDate);
    if (endDate && targetDate > endDate) {
      return false;
    }
  }

  switch (frequency) {
    case "Não se repete":
      return isSameDay(startDate, targetDate);

    case "Todos os dias":
      return targetDate >= startDate;

    case "Em dias alternados":
      return (
        targetDate >= startDate &&
        occursOnIntervalDays(startDate, targetDate, DAILY_INTERVALS[frequency])
      );

    case "Segunda a sexta": {
      const day = targetDate.getDay();
      return targetDate >= startDate && day >= 1 && day <= 5;
    }

    case "Segunda a sábado": {
      const day = targetDate.getDay();
      return targetDate >= startDate && day >= 1 && day <= 6;
    }

    case "A cada 5 anos para edifícios de até 10 anos de entrega, A cada 3 anos para edifícios entre 11 a 30 anos de entrega, A cada 1 ano para edifícios com mais de 30 anos de entrega": {
      if (!buildingDeliveryDate) return false;
      const entrega = parseDate(buildingDeliveryDate);
      if (!entrega) return false;
      return occursOnBuildingRule(startDate, entrega, targetDate);
    }

    case "Conforme indicação dos fornecedores":
    case "Não aplicável":
      return false;

    default:
      if (frequency in WEEKLY_INTERVALS) {
        const interval = WEEKLY_INTERVALS[frequency];
        return occursOnIntervalDays(startDate, targetDate, interval);
      }

      if (frequency in MONTHLY_INTERVALS) {
        const interval = MONTHLY_INTERVALS[frequency];
        return occursOnIntervalMonths(startDate, targetDate, interval);
      }
  }

  return false;
};

export const getNextDueDate = (
  task: TaskLike,
  referenceDate: Date = new Date(),
): Date | null => {
  const { frequency, startDate: startDateInput, buildingDeliveryDate, completionDate } = task;
  const startDate = parseDate(startDateInput);
  const targetDate = normalizeDate(referenceDate);

  if (!startDate || !frequency) {
    return null;
  }

  // Verifica se o ciclo já encerrou (completionDate)
  if (completionDate) {
    const endDate = parseDate(completionDate);
    if (endDate && targetDate > endDate) {
      return null;
    }
  }

  if (isTaskDueToday(task, targetDate)) {
    return targetDate;
  }

  switch (frequency) {
    case "Não se repete":
      return startDate > targetDate ? startDate : null;

    case "Todos os dias":
      return nextOnDailyInterval(
        startDate,
        addDays(targetDate, 1),
        DAILY_INTERVALS[frequency],
      );

    case "Em dias alternados":
      return nextOnDailyInterval(
        startDate,
        addDays(targetDate, 1),
        DAILY_INTERVALS[frequency],
      );

    case "Segunda a sexta":
      return findNextWeekday(startDate, addDays(targetDate, 1), false);

    case "Segunda a sábado":
      return findNextWeekday(startDate, addDays(targetDate, 1), true);

    case "A cada 5 anos para edifícios de até 10 anos de entrega, A cada 3 anos para edifícios entre 11 a 30 anos de entrega, A cada 1 ano para edifícios com mais de 30 anos de entrega": {
      if (!buildingDeliveryDate) return null;
      const entrega = parseDate(buildingDeliveryDate);
      if (!entrega) return null;
      return nextOnBuildingRule(startDate, entrega, addDays(targetDate, 1));
    }

    case "Conforme indicação dos fornecedores":
    case "Não aplicável":
      return null;

    default:
      if (frequency in WEEKLY_INTERVALS) {
        const interval = WEEKLY_INTERVALS[frequency];
        return nextOnDailyInterval(
          startDate,
          addDays(targetDate, 1),
          interval,
        );
      }

      if (frequency in MONTHLY_INTERVALS) {
        const interval = MONTHLY_INTERVALS[frequency];
        return nextOnMonthlyInterval(
          startDate,
          addDays(targetDate, 1),
          interval,
        );
      }
  }

  return null;
};

export const sortTasksByNextDueDate = (
  tasks: TaskLike[],
  referenceDate: Date = new Date(),
): TaskLike[] => {
  return [...tasks].sort((a, b) => {
    const nextA = getNextDueDate(a, referenceDate);
    const nextB = getNextDueDate(b, referenceDate);

    if (!nextA && !nextB) return 0;
    if (!nextA) return 1;
    if (!nextB) return -1;

    return nextA.getTime() - nextB.getTime();
  });
};

/**
 * Junta frequência + histórico pra dizer o status de um dia.
 */
export const getStatusNoDia = (
  task: TaskLike,
  historico: HistoricoLike[],
  referenceDate: Date = new Date(),
): StatusNoDia => {
  const target = normalizeDate(referenceDate);

  const esperado = isTaskDueToday(task, target);

  const histHoje = historico.find((h) => {
    const d = parseDate(h.dataReferencia);
    return d && isSameDay(d, target);
  });

  if (!esperado) {
    if (!histHoje) {
      return {
        esperadoHoje: false,
        statusHoje: "NAO_ESPERADO",
        historicoHoje: null,
      };
    }

    return {
      esperadoHoje: false,
      statusHoje: histHoje.status,
      historicoHoje: histHoje,
    };
  }

  if (!histHoje) {
    return {
      esperadoHoje: true,
      statusHoje: "SEM_REGISTRO",
      historicoHoje: null,
    };
  }

  return {
    esperadoHoje: true,
    statusHoje: histHoje.status,
    historicoHoje: histHoje,
  };
};

/**
 * Calendário no intervalo [from, to], só com dias que deveriam ter execução.
 */
export const buildCalendar = (
  task: TaskLike,
  historico: HistoricoLike[],
  from: Date,
  to: Date,
): DiaCalendario[] => {
  const inicio = normalizeDate(from);
  let fim = normalizeDate(to);
  const dias: DiaCalendario[] = [];

  // Limita o calendário até a data de finalização do ciclo, se definida
  if (task.completionDate) {
    const endDate = parseDate(task.completionDate);
    if (endDate && endDate < fim) {
      fim = endDate;
    }
  }

  for (
    let d = new Date(inicio);
    d.getTime() <= fim.getTime();
    d = addDays(d, 1)
  ) {
    const statusDia = getStatusNoDia(task, historico, d);
    if (!statusDia.esperadoHoje) continue;

    dias.push({
      data: new Date(d),
      esperado: statusDia.esperadoHoje,
      status: statusDia.statusHoje,
    });
  }

  return dias;
};
