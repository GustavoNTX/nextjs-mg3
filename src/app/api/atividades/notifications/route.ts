// app/api/atividades/notifications/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { adaptAtividadesToTasks } from "@/utils/atividadeDate";
import { isTaskDueToday, getNextDueDate } from "@/utils/dateLogic";
import { inferStatus } from "@/utils/atividadeStatus";

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
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { empresaId: true } });
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
          const u = await prisma.user.findUnique({ where: { id: sub }, select: { empresaId: true } });
          if (u?.empresaId) return u.empresaId;
        }
        if (email) {
          const u = await prisma.user.findUnique({ where: { email }, select: { empresaId: true } });
          if (u?.empresaId) return u.empresaId;
        }
      }
    } catch { /* ignore */ }
  }
  return null;
}

function ensureEmpresaMatch(authEmpresaId: string, inputEmpresaId?: string | null) {
  if (!inputEmpresaId) throw json(400, { error: "empresaId é obrigatório" });
  if (authEmpresaId !== inputEmpresaId) throw json(403, { error: "empresaId não corresponde ao usuário" });
}

/* ===== Data (TZ Fortaleza) ===== */
function startOfDayFortaleza(d: Date | string = new Date()) {
  const x = new Date(new Date(d).toLocaleString("en-US", { timeZone: "America/Fortaleza" }));
  x.setHours(0, 0, 0, 0);
  return x;
}

/* ===== Normalização de frequência ===== */
function normalizeFreq(val?: string | null) {
  const s = (val || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!s) return "Não se repete";
  if (/(todo|toda).*(dia)/.test(s) || /diar/.test(s)) return "Diária";
  if (/seman/.test(s)) return "Semanal";
  if (/quinzen/.test(s)) return "Quinzenal";
  if (/mensal|mes/.test(s)) return "Mensal";
  if (/trimestral|trimestre/.test(s)) return "Trimestral";
  if (/semestral/.test(s)) return "Semestral";
  if (/anual|ano/.test(s)) return "Anual";
  if (/nao se repete|não se repete|unica|única|uma vez|pontual/.test(s)) return "Não se repete";
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
  title: string;      // "Nome · Condomínio"
  nameOnly: string;   // só o nome da atividade
  details?: string;   // "Vence hoje" | "Vence em X dia(s)" | "Atrasada"
  condominioId?: string | null;
  condominioName?: string | null;
};

/* ===== GET /api/atividades/notifications?empresaId&leadDays=1 =====
   - Todos os condomínios da empresa
   - Regras: due hoje, pré-alerta (pre), atrasadas (overdue não-recorrentes)
   - Ignora concluídas (HISTORICO)
   - Fallback: recorrentes sem âncora (start/expected) viram "due hoje" */
export async function GET(req: NextRequest) {
  try {
    const authEmpresaId = await getEmpresaIdFromRequest();
    if (!authEmpresaId) return json(401, { error: "Não autorizado" });

    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get("empresaId");
    const leadDays = Math.max(0, Number(searchParams.get("leadDays") ?? 1) || 0);

    ensureEmpresaMatch(authEmpresaId, empresaId);

    const items = await prisma.atividade.findMany({
      where: { empresaId: authEmpresaId },
      orderBy: { createdAt: "desc" },
      include: { condominio: { select: { id: true, name: true } } },
    });

    const today = startOfDayFortaleza();
    const toYMD = (d: Date) => d.toISOString().slice(0, 10);
    const sod = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };

    const tasks = adaptAtividadesToTasks(items);

    const out: Notification[] = [];
    for (const t of tasks) {
      // pula concluídas
      if (inferStatus(t.raw) === "HISTORICO") continue;

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

      const anchor: Date | null =
        (t as any).startDate
          ? new Date((t as any).startDate)
          : t.raw?.startAt
          ? new Date(t.raw.startAt)
          : t.raw?.expectedDate
          ? new Date(t.raw.expectedDate)
          : null;

      // 1) due hoje?
      if (isTaskDueToday(t, today)) {
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
      const next = getNextDueDate(t, today);
      if (next) {
        const diffDays = Math.floor((sod(next).getTime() - today.getTime()) / 86400000);
        if (diffDays >= 0 && diffDays <= leadDays) {
          out.push({
            atividadeId: t.id,
            when: diffDays === 0 ? "due" : "pre",
            dueDateISO: toYMD(next),
            title,
            nameOnly,
            details: diffDays === 0 ? "Vence hoje" : `Vence em ${diffDays} dia(s)`,
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
      if (freqForOverdue === "Não se repete" && start && start < today && !t.raw?.completedAt) {
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
      if (orderWhen[a.when] !== orderWhen[b.when]) return orderWhen[a.when] - orderWhen[b.when];
      if (a.condominioName !== b.condominioName) return (a.condominioName || "").localeCompare(b.condominioName || "");
      return a.dueDateISO.localeCompare(b.dueDateISO);
    });

    return NextResponse.json(itemsOut);
  } catch (e: any) {
    if (e?.status) return e;
    console.error("Notifications.GET error:", e);
    return json(500, { error: "Falha ao gerar notificações." });
  }
}
