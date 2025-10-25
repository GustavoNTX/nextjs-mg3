// app/api/atividades/[id]/route.ts
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** -------- helpers --------
 * ATENÇÃO: getEmpresaIdFromRequest apenas decodifica o JWT.
 * Em produção, valide a assinatura do token.
 */
async function getEmpresaIdFromRequest(): Promise<string | null> {
  const h = await headers();

  // 1) x-user-id
  const userId = h.get("x-user-id") ?? undefined;
  if (userId) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { empresaId: true },
    });
    if (u?.empresaId) return u.empresaId;
  }

  // 2) Authorization: Bearer <jwt>
  const auth = h.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const [, payloadB64] = token.split(".");
      if (payloadB64) {
        const b64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
        const json = Buffer.from(b64, "base64").toString("utf8");
        const payload = JSON.parse(json);
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
      // silencioso
    }
  }
  return null;
}

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function ensureEmpresaMatch(authEmpresaId: string, inputEmpresaId?: string) {
  if (!inputEmpresaId) throw json(400, { error: "empresaId é obrigatório" });
  if (authEmpresaId !== inputEmpresaId) throw json(403, { error: "empresaId não corresponde ao usuário" });
}

const dateFlex = () =>
  z.preprocess((v) => (v == null || v === "" ? null : new Date(v as any)), z.date().nullable());

/** --- normalizadores/enums --- */
type AtividadeStatus = "PROXIMAS" | "EM_ANDAMENTO" | "PENDENTE" | "HISTORICO";
const STATUS_MAP: Record<string, AtividadeStatus> = {
  PROXIMAS: "PROXIMAS",
  "PRÓXIMAS": "PROXIMAS",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  "EM ANDAMENTO": "EM_ANDAMENTO",
  PENDENTE: "PENDENTE",
  HISTORICO: "HISTORICO",
  "HISTÓRICO": "HISTORICO",
};
function toStatusEnum(input: unknown): AtividadeStatus | undefined {
  if (typeof input === "boolean") return input ? "EM_ANDAMENTO" : "PENDENTE";
  if (typeof input === "string") return STATUS_MAP[input.trim().toUpperCase()];
  return undefined;
}

type Prioridade = "BAIXO" | "MEDIO" | "ALTO" | "URGENTE";
const PRIORIDADE_SET = new Set(["BAIXO", "MÉDIO", "MEDIO", "ALTO", "URGENTE"]);
function toPrioridadeEnum(input?: string | null): Prioridade | undefined {
  if (!input) return undefined;
  const s = input.trim().toUpperCase();
  if (!PRIORIDADE_SET.has(s)) return undefined;
  return (s === "MÉDIO" ? "MEDIO" : s) as Prioridade;
}

type BudgetStatus = "SEM_ORCAMENTO" | "PENDENTE" | "APROVADO" | "REPROVADO";
const BUDGET_SET = new Set(["SEM_ORCAMENTO", "SEM ORÇAMENTO", "PENDENTE", "APROVADO", "REPROVADO"]);
function toBudgetEnum(input?: string | null): BudgetStatus | undefined {
  if (!input) return undefined;
  const s = input.trim().toUpperCase();
  if (s === "SEM ORÇAMENTO") return "SEM_ORCAMENTO";
  if (!BUDGET_SET.has(s)) return undefined;
  return s.replace(" ", "_") as BudgetStatus;
}

/** ---------- GET ----------
 * Requer: ?empresaId & ?condominioId na query. Retorna 404 se escopo não bater.
 */
// app/api/atividades/[id]/route.ts (trecho GET)
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const authEmpresaId = await getEmpresaIdFromRequest();
    if (!authEmpresaId) return json(401, { error: "Não autorizado" });

    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get("empresaId") ?? undefined;
    const condominioId = searchParams.get("condominioId") ?? undefined;
    ensureEmpresaMatch(authEmpresaId, empresaId);
    if (!condominioId) return json(400, { error: "condominioId é obrigatório" });

    const { id } = await ctx.params;

    // 1) Valida escopo no MOLDE
    const item = await prisma.atividade.findFirst({
      where: { id, empresaId: authEmpresaId, condominioId },
      include: { condominio: { select: { id: true, name: true } } },
    });
    if (!item) return json(404, { error: "Atividade não encontrada" });

    // 2) Período opcional
    const toDate = (v: string | null) => (v ? new Date(v) : null);
    const from = toDate(searchParams.get("from"));
    const to   = toDate(searchParams.get("to"));
    const wantStats = searchParams.get("stats") === "1";

    if (!wantStats || !from || !to) {
      // comportamento antigo
      return NextResponse.json(item);
    }

    // 3) Estatísticas por período (Postgres)
    const [summary] = await prisma.$queryRaw<
      Array<{ feitos: number; nao_feitos: number; total: number }>
    >`
      SELECT
        SUM((h.status = 'FEITO')::int)  AS feitos,
        SUM((h.status <> 'FEITO')::int) AS nao_feitos,
        COUNT(*)                        AS total
      FROM "AtividadeHistorico" h
      WHERE h."atividadeId" = ${id}
        AND h."dataReferencia" BETWEEN ${from}::date AND ${to}::date
    `;

    const byDay = await prisma.$queryRaw<
      Array<{ dia: Date; feitos: number; nao_feitos: number; total: number }>
    >`
      SELECT
        h."dataReferencia" AS dia,
        COUNT(*) FILTER (WHERE h.status = 'FEITO')   AS feitos,
        COUNT(*) FILTER (WHERE h.status <> 'FEITO')  AS nao_feitos,
        COUNT(*)                                     AS total
      FROM "AtividadeHistorico" h
      WHERE h."atividadeId" = ${id}
        AND h."dataReferencia" BETWEEN ${from}::date AND ${to}::date
      GROUP BY h."dataReferencia"
      ORDER BY h."dataReferencia"
    `;

    const historico = await prisma.atividadeHistorico.findMany({
      where: { atividadeId: id, dataReferencia: { gte: from, lte: to } },
      orderBy: { dataReferencia: "asc" },
      select: { id: true, dataReferencia: true, status: true, completedAt: true, userId: true, observacoes: true },
    });

    return NextResponse.json({
      atividade: item,
      range: { from, to },
      stats: summary ?? { feitos: 0, nao_feitos: 0, total: 0 },
      byDay,
      historico,
    });
  } catch (e: any) {
    if (e?.status) return e;
    console.error("Atividade.GET error:", e);
    return json(500, { error: "Falha ao buscar a atividade." });
  }
}


/** ---------- PATCH ----------
 * Requer no body: empresaId, condominioId.
 * Atualiza somente campos presentes. Proteção multi-tenant via updateMany({ id, empresaId, condominioId }).
 */
// PATCH permissivo: app/api/atividades/[id]/route.ts (trecho)
const HIST_SET = new Set(["PENDENTE","FEITO","PULADO","ATRASADO"]);

function toHistoricoStatus(input: unknown) {
  if (typeof input !== "string") return undefined;
  const s = input.trim().toUpperCase();
  return HIST_SET.has(s) ? (s as "PENDENTE"|"FEITO"|"PULADO"|"ATRASADO") : undefined;
}

const patchSchema = z.object({
  id: z.string().uuid().optional(),
  empresaId: z.string().uuid(),
  condominioId: z.string().uuid(),

  // campos do molde (todos opcionais)
  expectedDate: dateFlex().optional(),
  prioridade: z.string().optional(),
  budgetStatus: z.string().optional(),
  appliedStandard: z.string().optional(),
  observacoes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),

  // campos de histórico (opcionais)
  dataReferencia: z.preprocess((v) => (v ? new Date(v as any) : undefined), z.date().optional()),
  status: z.union([z.boolean(), z.string()]).optional(),
  completedAt: dateFlex().optional(),
}).passthrough(); // <= deixa passar chaves desconhecidas (sem erro)

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const authEmpresaId = await getEmpresaIdFromRequest();
    if (!authEmpresaId) return json(401, { error: "Não autorizado" });

    const { id } = await ctx.params;

    let body: unknown;
    try { body = await req.json(); } catch { return json(400, { error: "JSON malformado" }); }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return json(422, { error: "Validação falhou", issues: parsed.error.flatten() });
    const b = parsed.data as any;

    // escopo
    ensureEmpresaMatch(authEmpresaId, b.empresaId);

    // garante que a atividade existe no escopo
    const molde = await prisma.atividade.findFirst({
      where: { id, empresaId: authEmpresaId, condominioId: b.condominioId, deletedAt: null },
      select: { id: true },
    });
    if (!molde) return json(404, { error: "Atividade não encontrada ou fora do escopo." });

    // ---------- caminho 1: atualizar HISTÓRICO se veio dataReferencia/status/completedAt ----------
    const histStatus = toHistoricoStatus(b.status);
    if (b.dataReferencia || histStatus || b.completedAt) {
      const dataRef = (b.dataReferencia ? new Date(b.dataReferencia) : new Date()) as Date;

      const hist = await prisma.atividadeHistorico.upsert({
        where: { atividadeId_dataReferencia: { atividadeId: id, dataReferencia: dataRef } },
        update: {
          ...(histStatus ? { status: histStatus } : {}),
          ...(b.completedAt !== undefined ? { completedAt: b.completedAt } : {}),
          ...(b.observacoes !== undefined ? { observacoes: b.observacoes } : {}),
        },
        create: {
          atividadeId: id,
          dataReferencia: dataRef,
          status: histStatus ?? "PENDENTE",
          completedAt: b.completedAt ?? null,
          observacoes: b.observacoes ?? null,
          // se quiser atrelar ao usuário do header, preencha userId aqui
        },
        select: { id: true, dataReferencia: true, status: true, completedAt: true, observacoes: true },
      });

      return NextResponse.json({ ok: true, historico: hist });
    }

    // ---------- caminho 2: atualizar apenas o MOLDE (ignora campos desconhecidos/antigos) ----------
    const d: any = {};

    if ("expectedDate" in b) d.expectedDate = b.expectedDate;

    const prioridadeEnum = toPrioridadeEnum(b.prioridade ?? undefined);
    if (prioridadeEnum) d.prioridade = prioridadeEnum; // se inválida, IGNORA silenciosamente

    const budgetEnum = toBudgetEnum(b.budgetStatus ?? undefined);
    if (budgetEnum) d.budgetStatus = budgetEnum; // se inválido, IGNORA

    if (b.appliedStandard !== undefined) d.appliedStandard = b.appliedStandard;
    if (b.observacoes !== undefined) d.observacoes = b.observacoes;
    if (b.tags !== undefined) d.tags = Array.isArray(b.tags) ? b.tags : [];

    // nunca tente escrever campos que não existem no molde
    // (status/startAt/endAt/completedAt do molde foram removidos do schema)

    if (Object.keys(d).length === 0) return json(400, { error: "Nenhum campo válido para atualizar." });

    const upd = await prisma.atividade.updateMany({
      where: { id, empresaId: authEmpresaId, condominioId: b.condominioId },
      data: d,
    });
    if (upd.count === 0) {
      return json(404, { error: "Atividade não encontrada ou fora do seu escopo (empresa/condomínio)." });
    }

    const item = await prisma.atividade.findFirst({
      where: { id },
      include: { condominio: { select: { id: true, name: true } } },
    });
    return NextResponse.json(item);
  } catch (e: any) {
    if (e?.status) return e;
    console.error("Atividade.PATCH error:", e);
    const msg = e?.meta?.cause || e?.message || "Não foi possível atualizar a atividade.";
    return json(500, { error: msg });
  }
}


/** ---------- DELETE ----------
 * Requer: ?empresaId & ?condominioId na query.
 * Deleta somente se pertencer à empresa/condomínio do usuário.
 */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const authEmpresaId = await getEmpresaIdFromRequest();
    if (!authEmpresaId) return json(401, { error: "Não autorizado" });

    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get("empresaId") ?? undefined;
    const condominioId = searchParams.get("condominioId") ?? undefined;

    ensureEmpresaMatch(authEmpresaId, empresaId);
    if (!condominioId) return json(400, { error: "condominioId é obrigatório" });

    const { id } = await ctx.params;

    const deleted = await prisma.atividade.deleteMany({
      where: { id, empresaId: authEmpresaId, condominioId },
    });
    if (deleted.count === 0) {
      return json(404, { error: "Atividade não encontrada ou fora do seu escopo (empresa/condomínio)." });
    }
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if ((e as any)?.status) return e as any;
    console.error("Atividade.DELETE error:", e);
    return json(500, { error: "Não foi possível excluir a atividade." });
  }
}
