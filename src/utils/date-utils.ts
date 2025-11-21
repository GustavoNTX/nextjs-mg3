// date-utils.ts

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function isWeekend(date: Date): boolean {
  const dow = date.getDay(); // 0 = domingo, 6 = sábado
  return dow === 0 || dow === 6;
}

function isSaturday(date: Date): boolean {
  return date.getDay() === 6;
}

// próxima data útil a partir do dia seguinte
export function proximoDiaUtil(
  base: Date,
  options?: { incluiSabado?: boolean },
): Date {
  const incluiSabado = options?.incluiSabado ?? false;
  let d = addDays(startOfDay(base), 1);

  while (true) {
    const dow = d.getDay();
    const ehDomingo = dow === 0;
    const ehSabado = dow === 6;

    if (ehDomingo) {
      d = addDays(d, 1);
      continue;
    }

    if (!incluiSabado && ehSabado) {
      d = addDays(d, 2); // pula sábado e domingo
      continue;
    }

    return d;
  }
}
