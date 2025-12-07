import { TaskLike } from "./atividadeStatus";

type DateInput = string | Date | null | undefined;

export interface AtividadeLike {
  id?: string | number;
  name?: string;
  frequencia?: string | null;
  expectedDate?: DateInput;
  startAt?: DateInput;
  createdAt?: DateInput;
  condominio?: { name?: string | null } | null;
  [key: string]: any;
}

export interface AdaptedTask extends TaskLike {
  raw: AtividadeLike;
  condominioName?: string | null;
}

const toDateString = (input: DateInput): string | null => {
  if (!input) return null;

  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    return input.toISOString().slice(0, 10);
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;

    if (trimmed.length >= 10) {
      const slice = trimmed.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(slice)) {
        return slice;
      }
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }

    return null;
  }

  try {
    const parsed = new Date(input as any);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  } catch {
    return null;
  }

  return null;
};

const resolveStartDate = (atividade: AtividadeLike): string | null => {
  const anchor = atividade?.expectedDate ?? atividade?.startAt ?? atividade?.createdAt;
  return toDateString(anchor);
};

const normalizeFrequency = (raw?: string | null): string => {
  const s = (raw ?? "").trim();
  if (!s) return "Não se repete";

  const canonicals = new Set([
    "Não se repete",
    "Todos os dias",
    "Em dias alternados",
    "Segunda a sexta",
    "Segunda a sábado",
    "A cada semana",
    "A cada 15 dias",
    "A cada 1 mês",
    "A cada 2 meses",
    "A cada 3 meses",
    "A cada 4 meses",
    "A cada 5 meses",
    "A cada 6 meses",
    "A cada 1 ano",
    "A cada 2 anos",
    "A cada 3 anos",
    "A cada 5 anos",
    "A cada 10 anos",
    "Conforme indicação dos fornecedores",
    "Não aplicável",
  ]);
  if (canonicals.has(s)) return s;

  const base = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (base === "diaria") return "Todos os dias";
  if (base === "semanal") return "A cada semana";
  if (base === "quinzenal") return "A cada 15 dias";
  if (base === "mensal" || base === "a cada mes") return "A cada 1 mês";
  if (base === "trimestral") return "A cada 3 meses";
  if (base === "semestral") return "A cada 6 meses";
  if (base === "anual") return "A cada 1 ano";

  if (base === "uma vez" || base === "sob demanda") {
    return "Não se repete";
  }

  return "Não se repete";
};

export const adaptAtividadeToTask = (atividade: AtividadeLike): AdaptedTask | null => {
  const startDate = resolveStartDate(atividade);
  if (!startDate) return null;

  return {
    id: atividade.id,
    name: atividade.name,
    frequency: normalizeFrequency(atividade.frequencia),
    startDate,
    condominioName: atividade?.condominio?.name ?? null,
    raw: atividade,
  };
};

export const adaptAtividadesToTasks = (atividades: AtividadeLike[] = []): AdaptedTask[] => {
  return atividades
    .map((atividade) => adaptAtividadeToTask(atividade))
    .filter((task): task is AdaptedTask => Boolean(task));
};
