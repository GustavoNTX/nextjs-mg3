// src/utils/atividadeStatus.ts

// --- Constantes ---
export const STATUS = {
  PROXIMAS: "PROXIMAS",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  PENDENTE: "PENDENTE",
  HISTORICO: "HISTORICO",
} as const;
export type AtividadeStatus = keyof typeof STATUS;

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

// --- Parse de qualquer entrada para enum ---
const MAP_IN: Record<string, AtividadeStatus> = {
  // próximos
  PROXIMAS: "PROXIMAS",
  "PRÓXIMAS": "PROXIMAS",
  UPCOMING: "PROXIMAS",
  NEXT: "PROXIMAS",
  AGENDADO: "PROXIMAS",
  "AGENDADA": "PROXIMAS",

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

  // histórico / concluído
  HISTORICO: "HISTORICO",
  "HISTÓRICO": "HISTORICO",
  DONE: "HISTORICO",
  COMPLETED: "HISTORICO",
  CONCLUIDO: "HISTORICO",
  "CONCLUÍDO": "HISTORICO",
};

export function toStatusEnum(v: unknown): AtividadeStatus | undefined {
  if (typeof v === "boolean") return v ? "EM_ANDAMENTO" : "PENDENTE";
  if (typeof v === "number") return v === 1 ? "EM_ANDAMENTO" : "PENDENTE";
  if (typeof v === "string") {
    const k = v.trim().toUpperCase();
    return MAP_IN[k];
  }
  return undefined;
}

// --- Inferência a partir do objeto atividade ---
export function inferStatus(a: any): AtividadeStatus {
  // prioridade: completedAt > enum explícito > startAt > expectedDate futura > pendente
  if (a?.completedAt) return "HISTORICO";

  const parsed = toStatusEnum(a?.status);
  if (parsed) return parsed;

  if (a?.startAt) return "EM_ANDAMENTO";

  const exp = a?.expectedDate ? new Date(a.expectedDate) : null;
  if (exp && exp.getTime() > Date.now()) return "PROXIMAS";

  return "PENDENTE";
}

// --- Helpers de UI ---
export function statusLabel(s: AtividadeStatus | any) {
  const st =
    typeof s === "string"
      ? toStatusEnum(s) ?? inferStatus({ status: s })
      : inferStatus(s);
  return STATUS_LABEL[st];
}

export function statusColor(s: AtividadeStatus | any) {
  const st =
    typeof s === "string"
      ? toStatusEnum(s) ?? inferStatus({ status: s })
      : inferStatus(s);
  return STATUS_COLOR[st];
}

export function isRunning(sOrAtividade: AtividadeStatus | any) {
  const st =
    typeof sOrAtividade === "string"
      ? toStatusEnum(sOrAtividade) ?? inferStatus({ status: sOrAtividade })
      : inferStatus(sOrAtividade);
  return st === "EM_ANDAMENTO";
}

// Para enviar ao backend conforme modo (enum | boolean)
export function toApiStatus(
  out: AtividadeStatus | boolean,
  mode: "enum" | "boolean" = "enum"
): AtividadeStatus | boolean {
  if (mode === "enum") {
    // Se seu backend aceitar só binário ("EM_ANDAMENTO"/"PENDENTE"),
    // mapeie PROXIMAS/HISTORICO para "PENDENTE" aqui.
    if (typeof out === "boolean") return out ? "EM_ANDAMENTO" : "PENDENTE";
    const parsed = toStatusEnum(out);
    return parsed ?? "PENDENTE";
  }
  // boolean
  const st =
    typeof out === "boolean"
      ? out
        ? "EM_ANDAMENTO"
        : "PENDENTE"
      : toStatusEnum(out) ?? "PENDENTE";
  return st === "EM_ANDAMENTO";
}

// --- Datas (sem hydrate mismatch) ---
const TZ = "America/Fortaleza";

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
  return inferStatus(a); // retorna PROXIMAS | EM_ANDAMENTO | PENDENTE | HISTORICO
}

export function pickColumnLabel(a: any): "Próximas" | "Em andamento" | "Pendente" | "Histórico" {
  return STATUS_LABEL[inferStatus(a)] as
    | "Próximas"
    | "Em andamento"
    | "Pendente"
    | "Histórico";
}
