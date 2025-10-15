const DAILY_INTERVALS: Record<string, number> = {
  "Todos os dias": 1,
  "Em dias alternados": 2,
};

const WEEKLY_INTERVALS: Record<string, number> = {
  "A cada semana": 7,
  "A cada duas semanas": 14,
};

const MONTHLY_INTERVALS: Record<string, number> = {
  "A cada mês": 1,
  "A cada dois meses": 2,
  "A cada três meses": 3,
  "A cada quatro meses": 4,
  "A cada cinco meses": 5,
  "A cada seis meses": 6,
  "A cada ano": 12,
  "A cada dois anos": 24,
  "A cada três anos": 36,
  "A cada cinco anos": 60,
  "A cada dez anos": 120,
};

export interface TaskLike {
  id?: number | string;
  name?: string;
  frequency: string;
  startDate: string;
}

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const parseDate = (value: string | Date): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return normalizeDate(value);
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return normalizeDate(new Date(year, month - 1, day));
};

const differenceInDays = (start: Date, end: Date): number => {
  return Math.floor((normalizeDate(end).getTime() - normalizeDate(start).getTime()) / MILLISECONDS_IN_DAY);
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

  const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(originalDay, lastDayOfMonth));

  return normalizeDate(result);
};

const occursOnIntervalDays = (startDate: Date, targetDate: Date, interval: number): boolean => {
  if (targetDate < startDate) return false;
  const diff = differenceInDays(startDate, targetDate);
  return diff % interval === 0;
};

const occursOnIntervalMonths = (startDate: Date, targetDate: Date, monthsInterval: number): boolean => {
  if (targetDate < startDate) return false;
  let candidate = normalizeDate(startDate);

  // Avoid infinite loops by stopping after 600 iterations (~50 years for monthly tasks).
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

const nextOnMonthlyInterval = (startDate: Date, fromDate: Date, monthsInterval: number): Date | null => {
  let candidate = normalizeDate(startDate);
  const searchStart = fromDate > startDate ? fromDate : startDate;

  if (candidate < searchStart) {
    while (candidate < searchStart) {
      candidate = addMonths(candidate, monthsInterval);
    }
  }

  return candidate >= searchStart ? candidate : null;
};

const nextOnDailyInterval = (startDate: Date, fromDate: Date, interval: number): Date | null => {
  if (fromDate <= startDate) {
    return startDate;
  }

  const diff = differenceInDays(startDate, fromDate);
  const remainder = diff % interval;

  if (remainder === 0) {
    return fromDate;
  }

  return addDays(fromDate, interval - remainder);
};

const findNextWeekday = (
  startDate: Date,
  fromDate: Date,
  includeSaturday: boolean
): Date | null => {
  let candidate = fromDate > startDate ? fromDate : startDate;

  // search up to 14 days ahead to find next valid business day
  for (let i = 0; i < 14; i += 1) {
    const day = candidate.getDay();
    const isValid = includeSaturday ? day >= 1 && day <= 6 : day >= 1 && day <= 5;

    if (candidate >= startDate && isValid) {
      return candidate;
    }

    candidate = addDays(candidate, 1);
  }

  return null;
};

export const isTaskDueToday = (task: TaskLike, referenceDate: Date = new Date()): boolean => {
  const { frequency, startDate: startDateInput } = task;
  const startDate = parseDate(startDateInput);
  const targetDate = normalizeDate(referenceDate);

  if (!startDate || !frequency) {
    return false;
  }

  switch (frequency) {
    case "Não se repete":
      return isSameDay(startDate, targetDate);
    case "Todos os dias":
      return targetDate >= startDate;
    case "Em dias alternados":
      return targetDate >= startDate && occursOnIntervalDays(startDate, targetDate, DAILY_INTERVALS[frequency]);
    case "Segunda a sexta": {
      const day = targetDate.getDay();
      return targetDate >= startDate && day >= 1 && day <= 5;
    }
    case "Segunda a sábado": {
      const day = targetDate.getDay();
      return targetDate >= startDate && day >= 1 && day <= 6;
    }
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

export const getNextDueDate = (task: TaskLike, referenceDate: Date = new Date()): Date | null => {
  const { frequency, startDate: startDateInput } = task;
  const startDate = parseDate(startDateInput);
  const targetDate = normalizeDate(referenceDate);

  if (!startDate || !frequency) {
    return null;
  }

  if (isTaskDueToday(task, targetDate)) {
    return targetDate;
  }

  switch (frequency) {
    case "Não se repete":
      return startDate > targetDate ? startDate : null;
    case "Todos os dias":
      return nextOnDailyInterval(startDate, addDays(targetDate, 1), DAILY_INTERVALS[frequency]);
    case "Em dias alternados":
      return nextOnDailyInterval(startDate, targetDate, DAILY_INTERVALS[frequency]);
    case "Segunda a sexta":
      return findNextWeekday(startDate, addDays(targetDate, 1), false);
    case "Segunda a sábado":
      return findNextWeekday(startDate, addDays(targetDate, 1), true);
    default:
      if (frequency in WEEKLY_INTERVALS) {
        const interval = WEEKLY_INTERVALS[frequency];
        const nextDate = nextOnDailyInterval(startDate, addDays(targetDate, 1), interval);
        return nextDate;
      }

      if (frequency in MONTHLY_INTERVALS) {
        const interval = MONTHLY_INTERVALS[frequency];
        return nextOnMonthlyInterval(startDate, addDays(targetDate, 1), interval);
      }
  }

  return null;
};

export const sortTasksByNextDueDate = (tasks: TaskLike[], referenceDate: Date = new Date()): TaskLike[] => {
  return [...tasks].sort((a, b) => {
    const nextA = getNextDueDate(a, referenceDate);
    const nextB = getNextDueDate(b, referenceDate);

    if (!nextA && !nextB) return 0;
    if (!nextA) return 1;
    if (!nextB) return -1;

    return nextA.getTime() - nextB.getTime();
  });
};
