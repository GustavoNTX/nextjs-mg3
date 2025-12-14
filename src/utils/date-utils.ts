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


const TZ_FORTALEZA = "America/Fortaleza";
const OFFSET = "-03:00"; // Fortaleza não tem DST

export function startOfDayFortaleza(dateLike: Date) {
  // pega YYYY-MM-DD no fuso de Fortaleza
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_FORTALEZA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dateLike); // "2025-12-14"

  // cria uma data que representa 00:00 Fortaleza (vira 03:00Z)
  return new Date(`${ymd}T00:00:00${OFFSET}`);
}


function getTzOffsetMinutes(utcDate: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "shortOffset",
  }).formatToParts(utcDate);

  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = tzName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;

  const sign = m[1] === "-" ? -1 : 1;
  const hh = Number(m[2] ?? 0);
  const mm = Number(m[3] ?? 0);
  return sign * (hh * 60 + mm);
}

export function startOfDayFortaleza_get(date: Date = new Date()) {
  // pega Y/M/D no fuso Fortaleza
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_FORTALEZA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);

  // offset naquele dia (pega no "meio do dia" pra evitar treta em troca de offset)
  const offsetMin = getTzOffsetMinutes(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)), TZ_FORTALEZA);

  // UTC do "00:00 Fortaleza" = UTC(00:00) - offset
  const utcMillis = Date.UTC(y, m - 1, d, 0, 0, 0) - offsetMin * 60 * 1000;
  return new Date(utcMillis);
}

export function addDaysFortaleza(dayRef: Date, days: number) {
  // Fortaleza não tem DST, então 24h funciona ok aqui
  return new Date(dayRef.getTime() + days * 24 * 60 * 60 * 1000);
}
