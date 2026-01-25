// src/constants/timezone.ts
// Constante unificada de timezone para todo o projeto

export const APP_TIMEZONE = "America/Sao_Paulo";
export const APP_TIMEZONE_OFFSET = "-03:00"; // Brasília (Brasil não tem mais DST desde 2019)

/**
 * Retorna o início do dia (00:00:00) no timezone da aplicação
 */
export function startOfDayAppTimezone(date: Date = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  return new Date(`${ymd}T00:00:00${APP_TIMEZONE_OFFSET}`);
}

/**
 * Retorna a data atual no formato YYYY-MM-DD no timezone da aplicação
 */
export function todayISOAppTimezone(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Adiciona dias a uma data mantendo o timezone da aplicação
 */
export function addDaysAppTimezone(date: Date, days: number): Date {
  // Brasil não tem mais DST desde 2019, então 24h funciona ok
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
