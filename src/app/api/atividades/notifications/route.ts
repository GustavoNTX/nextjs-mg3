// app/api/atividades/notifications/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { adaptAtividadesToTasks } from "@/utils/atividadeDate";
import {
  isTaskDueToday,
  getNextDueDate,
  getStatusNoDia,
  TaskLike,
  HistoricoLike,
} from "@/utils/atividadeStatus";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ===== Helpers de auth/escopo ===== */
function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

async function getEmpresaIdFromRequest(): Promise<string | null> {
  const h = await headers();

  const userId = h.get("x-user-id") ?? undefined;
  if (userId) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { empresaId: true },
    });
    if (u?.empresaId) return u.empresaId;
  }

  const auth = h.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const [, payloadB64] = token.split(".");
      if (payloadB64) {
        const b64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
        const jsonStr = Buffer.from(b64, "base64").toString("utf8");
        const payload = JSON.parse(jsonStr);
        const sub = payload?.sub as string | undefined;
        const email = payload?.email as string | undefined;

        if (sub) {
          const u = await prisma.user.findUnique({
            where: { id: sub },
            select: { empresaId: true },
          });
          if (u?.empresaId) return u.empresaId;
        }
        if (email) {
          const u = await prisma.user.findUnique({
            where: { email },
            select: { empresaId: true },
          });
          if (u?.empresaId) return u.empresaId;
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

function ensureEmpresaMatch(
  authEmpresaId: string,
  inputEmpresaId?: string | null,
) {
  if (!inputEmpresaId) throw json(400, { error: "empresaId é obrigatório" });
  if (authEmpresaId !== inputEmpresaId)
    throw json(403, { error: "empresaId não corresponde ao usuário" });
}

/* ===== Data (TZ Fortaleza) ===== */
function startOfDayFortaleza(d: Date | string = new Date()) {
  const x = new Date(
    new Date(d).toLocaleString("en-US", { timeZone: "America/Fortaleza" }),
  );
  x.setHours(0, 0, 0, 0);
  return x;
}

/* ===== Normalização de frequência ===== */
function normalizeFreq(val?: string | null) {
  const s = (val || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!s) return "Não se repete";
  if (/(todo|toda).*(dia)/.test(s) || /diar/.test(s)) return "Diária";
  if (/seman/.test(s)) return "Semanal";
  if (/quinzen/.test(s)) return "Quinzenal";
  if (/mensal|mes/.test(s)) return "Mensal";
  if (/trimestral|trimestre/.test(s)) return "Trimestral";
  if (/semestral/.test(s)) return "Semestral";
  if (/anual|ano/.test(s)) return "Anual";
  if (/nao se repete|não se repete|unica|única|uma vez|pontual/.test(s))
    return "Não se repete";
  return s; // mantém como veio
}

function isRecurring(freq: string) {
  return normalizeFreq(freq) !== "Não se repete";
}

/* ===== Tipos ===== */
type When = "pre" | "due" | "overdue";
type Notification = {
  atividadeId: string | number | undefined;
  when: When;
  dueDateISO: string; // YYYY-MM-DD
  title: string; // "Nome · Condomínio"
  nameOnly: string; // só o nome da atividade
  details?: string; // "Vence hoje" | "Vence em X dia(s)" | "Atrasada"
  condominioId?: string | null;
  condominioName?: string | null;
  statusOnDueDate?: string | null; // vindo do getStatusNoDia
  isDoneOnDueDate?: boolean;
  esperadoNaData?: boolean | null;
};

/* helpers locais */
const toYMD = (d: Date) => d.toISOString().slice(0, 10);
const sod = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const parseYMD = (ymd: string): Date => {
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d));
};

const addDays = (date: Date, amount: number): Date => {
  const r = new Date(date);
  r.setUTCDate(r.getUTCDate() + amount);
  r.setUTCHours(0, 0, 0, 0);
  return r;
};

/* ===== GET /api/atividades/notifications?empresaId&leadDays=1 ===== */
export async function GET(req: NextRequest) {
  try {
    const authEmpresaId = await getEmpresaIdFromRequest();
    if (!authEmpresaId) return json(401, { error: "Não autorizado" });

    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get("empresaId");
    const leadDays = Math.max(
      0,
      Number(searchParams.get("leadDays") ?? 1) || 0,
    );

    ensureEmpresaMatch(authEmpresaId, empresaId);

    const items = await prisma.atividade.findMany({
      where: { empresaId: authEmpresaId },
      orderBy: { createdAt: "desc" },
      include: { condominio: { select: { id: true, name: true } } },
    });

    const today = startOfDayFortaleza();

    const tasks = adaptAtividadesToTasks(items);

    const out: Notification[] = [];
    for (const t of tasks) {
      // se você tiver inferStatus(t.raw) pra pular HISTORICO, mantém aqui
      // if (inferStatus(t.raw) === "HISTORICO") continue;

      const nameOnly = String(t.name ?? "Atividade");
      const condoId = (t as any).condominioId ?? t.raw?.condominioId ?? null;
      const condoName = t.condominioName ?? t.raw?.condominio?.name ?? null;
      const title = condoName ? `${nameOnly} · ${condoName}` : nameOnly;

      const rawFreq =
        t.frequency ??
        (t.raw as any)?.frequency ??
        (t.raw as any)?.frequencia ??
        "Não se repete";
      const freqNorm = normalizeFreq(rawFreq);
      const recurring = isRecurring(freqNorm);

      const anchor: Date | null = (t as any).startDate
        ? new Date((t as any).startDate)
        : t.raw?.startAt
        ? new Date(t.raw.startAt)
        : t.raw?.expectedDate
        ? new Date(t.raw.expectedDate)
        : null;

      // 1) due hoje?
      if (isTaskDueToday(t as TaskLike, today)) {
        out.push({
          atividadeId: t.id,
          when: "due",
          dueDateISO: toYMD(today),
          title,
          nameOnly,
          details: "Vence hoje",
          condominioId: condoId,
          condominioName: condoName,
        });
        continue;
      }

      // 2) próxima ocorrência calculada normalmente
      const next = getNextDueDate(t as TaskLike, today);
      if (next) {
        const diffDays = Math.floor(
          (sod(next).getTime() - today.getTime()) / 86400000,
        );
        if (diffDays >= 0 && diffDays <= leadDays) {
          out.push({
            atividadeId: t.id,
            when: diffDays === 0 ? "due" : "pre",
            dueDateISO: toYMD(next),
            title,
            nameOnly,
            details:
              diffDays === 0 ? "Vence hoje" : `Vence em ${diffDays} dia(s)`,
            condominioId: condoId,
            condominioName: condoName,
          });
        }
        continue;
      }

      // 3) Fallback: recorrente sem âncora => due hoje
      if (recurring && !anchor) {
        out.push({
          atividadeId: t.id,
          when: "due",
          dueDateISO: toYMD(today),
          title,
          nameOnly,
          details: "Vence hoje",
          condominioId: condoId,
          condominioName: condoName,
        });
        continue;
      }

      // 4) Overdue só p/ não recorrentes com start passado e não concluídas
      const freqForOverdue = freqNorm || "Não se repete";
      const start = anchor ? sod(anchor) : null;
      if (
        freqForOverdue === "Não se repete" &&
        start &&
        start < today &&
        !(t.raw as any)?.completedAt
      ) {
        out.push({
          atividadeId: t.id,
          when: "overdue",
          dueDateISO: toYMD(start),
          title,
          nameOnly,
          details: "Atrasada",
          condominioId: condoId,
          condominioName: condoName,
        });
      }
    }

    // dedupe e ordenação
    const seen = new Set<string>();
    const itemsOut = out.filter((n) => {
      const k = `${n.atividadeId}|${n.when}|${n.dueDateISO}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const orderWhen: Record<When, number> = { overdue: 0, due: 1, pre: 2 };
    itemsOut.sort((a, b) => {
      if (orderWhen[a.when] !== orderWhen[b.when])
        return orderWhen[a.when] - orderWhen[b.when];
      if (a.condominioName !== b.condominioName)
        return (a.condominioName || "").localeCompare(b.condominioName || "");
      return a.dueDateISO.localeCompare(b.dueDateISO);
    });

    // ===== JUNTAR COM A LÓGICA DE HISTÓRICO (getStatusNoDia) =====

    if (itemsOut.length === 0) {
      return NextResponse.json(itemsOut);
    }

    // 1) map de TaskLike por atividadeId
    const taskById = new Map<string, TaskLike>();
    for (const t of tasks) {
      const raw = (t as any).raw ?? {};
      const freq =
        t.frequency ??
        (raw as any).frequencia ??
        (raw as any).frequency ??
        "Não se repete";

      const startSource =
        (t as any).startDate ??
        raw.expectedDate ??
        raw.createdAt ??
        new Date();

      const startDate =
        startSource instanceof Date
          ? startSource
          : new Date(startSource as string);

      const key = String(t.id);

      if (!taskById.has(key)) {
        const tk: TaskLike = {
          id: t.id,
          name: t.name,
          frequency: freq,
          startDate: startDate.toISOString(),
          // se tiver data de entrega do condomínio, dá pra colocar aqui:
          // buildingDeliveryDate: raw.condominio?.dataEntrega?.toISOString(),
        };
        taskById.set(key, tk);
      }
    }

    // 2) pegar o range de datas de vencimento das notificações
    const allDates = itemsOut.map((n) => n.dueDateISO);
    const minISO = allDates.reduce((a, b) => (a < b ? a : b));
    const maxISO = allDates.reduce((a, b) => (a > b ? a : b));

    const minDate = parseYMD(minISO);
    const maxDate = addDays(parseYMD(maxISO), 1); // lt max+1

    const atividadeIds = Array.from(
      new Set(itemsOut.map((n) => String(n.atividadeId))),
    );

    // 3) buscar histórico de todas as atividades notificadas, só nesse range
    const historicosDb = await prisma.atividadeHistorico.findMany({
      where: {
        atividadeId: { in: atividadeIds },
        dataReferencia: {
          gte: minDate,
          lt: maxDate,
        },
      },
      select: {
        atividadeId: true,
        dataReferencia: true,
        status: true,
        completedAt: true,
        observacoes: true,
      },
    });

    const historicoByAtividade = new Map<string, HistoricoLike[]>();
    for (const h of historicosDb) {
      const key = String(h.atividadeId);
      const list = historicoByAtividade.get(key) ?? [];
      list.push({
        atividadeId: h.atividadeId,
        dataReferencia: h.dataReferencia.toISOString(),
        status: h.status as any,
        completedAt: h.completedAt?.toISOString() ?? null,
        observacoes: h.observacoes ?? null,
      });
      historicoByAtividade.set(key, list);
    }

    // 4) aplicar getStatusNoDia por notificação, na data de vencimento
    const withStatus: Notification[] = itemsOut.map((n) => {
      const key = String(n.atividadeId);
      const task = taskById.get(key);
      const hist = historicoByAtividade.get(key) ?? [];

      if (!task) {
        return {
          ...n,
          statusOnDueDate: null,
          isDoneOnDueDate: false,
          esperadoNaData: null,
        };
      }

      const dueDate = parseYMD(n.dueDateISO);
      const statusDia = getStatusNoDia(task, hist, dueDate);

      return {
        ...n,
        statusOnDueDate: statusDia.statusHoje,
        isDoneOnDueDate: statusDia.statusHoje === "FEITO",
        esperadoNaData: statusDia.esperadoHoje,
      };
    });

    return NextResponse.json(withStatus);
  } catch (e: any) {
    if (e?.status) return e;
    console.error("Notifications.GET error:", e);
    return json(500, { error: "Falha ao gerar notificações." });
  }
}
