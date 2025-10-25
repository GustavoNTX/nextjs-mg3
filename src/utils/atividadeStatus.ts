// src/utils/atividadeStatus.ts

// --- Constantes ---
export const STATUS = {
  PROXIMAS: "PROXIMAS",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  PENDENTE: "PENDENTE",
  HISTORICO: "HISTORICO",
} as const;
export type AtividadeStatus = keyof typeof STATUS;

// rótulos e cores com checagem de cobertura em compile-time
export const STATUS_LABEL: Record<AtividadeStatus, string> = {
  PROXIMAS: "Próximas",
  EM_ANDAMENTO: "Em andamento",
  PENDENTE: "Pendente",
  HISTORICO: "Histórico",
};

export const STATUS_COLOR: Record<AtividadeStatus, string> = {
  PROXIMAS: "#787878",
  EM_ANDAMENTO: "#2d96ff",
  PENDENTE: "#FF5959",
  HISTORICO: "#87E76A",
};

// --- Utils comuns ---
const TZ = "America/Fortaleza";
export { TZ };

export function startOfDayFortaleza(d: Date | number | string = new Date()) {
  const x = new Date(new Date(d).toLocaleString("en-US", { timeZone: TZ }));
  x.setHours(0, 0, 0, 0);
  return x;
}

function normalizeKey(s: string) {
  return s
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos
}

// --- Parse de qualquer entrada para enum ---
const MAP_IN: Record<string, AtividadeStatus> = {
  // próximas
  PROXIMAS: "PROXIMAS",
  UPCOMING: "PROXIMAS",
  NEXT: "PROXIMAS",
  AGENDADO: "PROXIMAS",
  AGENDADA: "PROXIMAS",
  AGENDADOS: "PROXIMAS",
  AGENDADAS: "PROXIMAS",
  SCHEDULED: "PROXIMAS",

  // em andamento
  EM_ANDAMENTO: "EM_ANDAMENTO",
  "EM ANDAMENTO": "EM_ANDAMENTO",
  IN_PROGRESS: "EM_ANDAMENTO",
  "IN PROGRESS": "EM_ANDAMENTO",
  RUNNING: "EM_ANDAMENTO",

  // pendente
  PENDENTE: "PENDENTE",
  PENDING: "PENDENTE",
  TODO: "PENDENTE",
  OPEN: "PENDENTE",

  // histórico / concluído
  HISTORICO: "HISTORICO",
  DONE: "HISTORICO",
  COMPLETED: "HISTORICO",
  CONCLUIDO: "HISTORICO",
  CONCLUIDO_S: "HISTORICO",
  CONCLUIDOS: "HISTORICO",
  CONCLUIDAS: "HISTORICO",
  CONCLUIDA: "HISTORICO",
};

export function toStatusEnum(v: unknown): AtividadeStatus | undefined {
  if (typeof v === "boolean") return v ? "EM_ANDAMENTO" : "PENDENTE";
  if (typeof v === "number") return v === 1 ? "EM_ANDAMENTO" : "PENDENTE";
  if (typeof v === "string") {
    const k = normalizeKey(v);
    // tenta direto
    if (MAP_IN[k]) return MAP_IN[k];
    // tenta variantes com/sem underline/espaço
    const k2 = k.replace(/[_\s]+/g, " ").trim();
    if (MAP_IN[k2]) return MAP_IN[k2];
  }
  return undefined;
}

// --- Inferência a partir do objeto atividade ---
// prioridade: completedAt > enum explícito > startAt > expectedDate futura > pendente
export function inferStatus(a: any): AtividadeStatus {
  if (a?.completedAt) return "HISTORICO";

  const parsed = toStatusEnum(a?.status);
  if (parsed) return parsed;

  if (a?.startAt) return "EM_ANDAMENTO";

  // "Próximas" se a expectedDate é futura no relógio atual (não precisa truncar por dia)
  const exp = a?.expectedDate ? new Date(a.expectedDate) : null;
  if (exp && exp.getTime() > Date.now()) return "PROXIMAS";

  return "PENDENTE";
}

// --- Helpers de UI (com fallback seguro) ---
function safeStatus(input: AtividadeStatus | any): AtividadeStatus {
  if (typeof input === "string") return toStatusEnum(input) ?? "PENDENTE";
  const inf = inferStatus(input);
  return inf ?? "PENDENTE";
}

export function statusLabel(s: AtividadeStatus | any) {
  const st = safeStatus(s);
  return STATUS_LABEL[st];
}

export function statusColor(s: AtividadeStatus | any) {
  const st = safeStatus(s);
  return STATUS_COLOR[st];
}

export function isRunning(sOrAtividade: AtividadeStatus | any) {
  return safeStatus(sOrAtividade) === "EM_ANDAMENTO";
}

// Para enviar ao backend conforme modo (enum | boolean)
export function toApiStatus(
  out: AtividadeStatus | boolean,
  mode: "enum" | "boolean" = "enum",
): AtividadeStatus | boolean {
  if (mode === "enum") {
    if (typeof out === "boolean") return out ? "EM_ANDAMENTO" : "PENDENTE";
    const parsed = toStatusEnum(out);
    return parsed ?? "PENDENTE";
  }
  // boolean
  const st = safeStatus(out);
  return st === "EM_ANDAMENTO";
}

// --- Datas (sem hydrate mismatch) ---
export function formatDate(v?: string | number | Date | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(v?: string | number | Date | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// --- Kanban (coluna a exibir) ---
export function pickColumnCode(a: any): AtividadeStatus {
  return inferStatus(a); // PROXIMAS | EM_ANDAMENTO | PENDENTE | HISTORICO
}

export function pickColumnLabel(
  a: any,
): "Próximas" | "Em andamento" | "Pendente" | "Histórico" {
  return STATUS_LABEL[inferStatus(a)] as
    | "Próximas"
    | "Em andamento"
    | "Pendente"
    | "Histórico";
}
