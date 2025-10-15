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
export async function GET(
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
    const item = await prisma.atividade.findFirst({
      where: { id, empresaId: authEmpresaId, condominioId },
      include: { condominio: { select: { id: true, name: true } } },
    });
    if (!item) return json(404, { error: "Atividade não encontrada" });
    return NextResponse.json(item);
  } catch (e) {
    if ((e as any)?.status) return e as any;
    console.error("Atividade.GET error:", e);
    return json(500, { error: "Falha ao buscar a atividade." });
  }
}

/** ---------- PATCH ----------
 * Requer no body: empresaId, condominioId.
 * Atualiza somente campos presentes. Proteção multi-tenant via updateMany({ id, empresaId, condominioId }).
 */
const patchSchema = z
  .object({
    empresaId: z.string().uuid(),
    condominioId: z.string().uuid(),

    // campos editáveis
    status: z.union([
      z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string()),
      z.preprocess((v) => {
        if (typeof v === "string") {
          if (v.toLowerCase() === "true") return true;
          if (v.toLowerCase() === "false") return false;
        }
        return v;
      }, z.boolean()),
    ]).optional(),
    expectedDate: dateFlex().optional(),
    startAt: dateFlex().optional(),
    endAt: dateFlex().optional(),
    completedAt: dateFlex().optional(),

    prioridade: z.string().optional(),
    budgetStatus: z.string().optional(),
    appliedStandard: z.string().optional(),
    observacoes: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
  })
  .strict();

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const authEmpresaId = await getEmpresaIdFromRequest();
    if (!authEmpresaId) return json(401, { error: "Não autorizado" });

    const { id } = await ctx.params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "JSON malformado" });
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return json(422, { error: "Validação falhou", issues: parsed.error.flatten() });
    }
    const b = parsed.data;

    // empresaId do body deve bater com o do usuário
    ensureEmpresaMatch(authEmpresaId, b.empresaId);

    // monta data apenas com campos presentes + normalizações
    const d: any = {};

    if (b.status !== undefined) {
      const norm = toStatusEnum(b.status);
      if (!norm) return json(400, { error: "status inválido" });
      d.status = norm;
    }
    if ("expectedDate" in b) d.expectedDate = b.expectedDate;
    if ("startAt" in b) d.startAt = b.startAt;
    if ("endAt" in b) d.endAt = b.endAt;
    if ("completedAt" in b) d.completedAt = b.completedAt;

    const prioridadeEnum = toPrioridadeEnum(b.prioridade ?? undefined);
    if (b.prioridade !== undefined && !prioridadeEnum) {
      return json(400, { error: "prioridade inválida" });
    }
    if (prioridadeEnum) d.prioridade = prioridadeEnum;

    const budgetEnum = toBudgetEnum(b.budgetStatus ?? undefined);
    if (b.budgetStatus !== undefined && !budgetEnum) {
      return json(400, { error: "budgetStatus inválido" });
    }
    if (budgetEnum) d.budgetStatus = budgetEnum;

    if (b.appliedStandard !== undefined) d.appliedStandard = b.appliedStandard;
    if (b.observacoes !== undefined) d.observacoes = b.observacoes;
    if (b.tags !== undefined) d.tags = b.tags;

    if (Object.keys(d).length === 0) {
      return json(400, { error: "Nenhum campo para atualizar." });
    }

    // proteção multi-tenant + amarração ao condomínio
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
    const msg =
      e?.meta?.cause ||
      e?.message ||
      "Não foi possível atualizar a atividade.";
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
