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

export const adaptAtividadeToTask = (atividade: AtividadeLike): AdaptedTask | null => {
  const startDate = resolveStartDate(atividade);
  if (!startDate) return null;

  return {
    id: atividade.id,
    name: atividade.name,
    frequency: atividade.frequencia ?? "Não se repete",
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
