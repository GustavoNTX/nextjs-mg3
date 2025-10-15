// app/api/atividades/route.ts
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** -------- helpers comuns --------
 * ATENÇÃO: getEmpresaIdFromRequest apenas decodifica o JWT.
 * Em produção, valide a assinatura do token.
 */
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
        const json = Buffer.from(b64, "base64").toString("utf8");
        const payload = JSON.parse(json);
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
    } catch {
      // ignora
    }
  }
  return null;
}

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

const dateFlex = () =>
  z.preprocess((v) => (v == null || v === "" ? null : new Date(v as any)), z.date().nullable());

/** --- normalizadores para enums do banco --- */
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
  if (typeof input === "string") {
    const s = input.trim().toUpperCase();
    return STATUS_MAP[s] ?? undefined;
  }
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

/** -------- validações de escopo (empresa/condomínio) -------- */
function ensureEmpresaMatch(authEmpresaId: string, inputEmpresaId?: string) {
  if (!inputEmpresaId) throw json(400, { error: "empresaId é obrigatório" });
  if (authEmpresaId !== inputEmpresaId) throw json(403, { error: "empresaId não corresponde ao usuário" });
}

async function assertCondominioDaEmpresa(condominioId: string | undefined, empresaId: string) {
  if (!condominioId) throw json(400, { error: "condominioId é obrigatório" });
  const condo = await prisma.condominio.findFirst({
    where: { id: condominioId, empresaId },
    select: { id: true },
  });
  if (!condo) throw json(404, { error: "Condomínio não encontrado na sua empresa" });
}

/** -------- GET (lista) --------
 * Requer: empresaId (query), condominioId (query).
 * Suporta: q, prioridade, status (boolean OU enum), paginação take/cursor.
 */
export async function GET(req: NextRequest) {
  try {
    const authEmpresaId = await getEmpresaIdFromRequest();
    if (!authEmpresaId) return json(401, { error: "Não autorizado" });

    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get("empresaId") ?? undefined;
    ensureEmpresaMatch(authEmpresaId, empresaId);

    const condominioId = searchParams.get("condominioId") ?? undefined;
    await assertCondominioDaEmpresa(condominioId, authEmpresaId);

    const q = searchParams.get("q") ?? undefined;
    const prioridadeRaw = searchParams.get("prioridade") ?? undefined;
    const statusRaw = searchParams.get("status") ?? undefined;

    const take = Math.min(Math.max(Number(searchParams.get("take") ?? 50), 1), 200);
    const cursor = searchParams.get("cursor") ?? undefined;

    let whereStatus: AtividadeStatus | undefined;
    if (statusRaw != null) {
      if (statusRaw === "true" || statusRaw === "false") {
        whereStatus = statusRaw === "true" ? "EM_ANDAMENTO" : "PENDENTE";
      } else {
        whereStatus = toStatusEnum(statusRaw);
      }
    }

    const where: any = {
      empresaId: authEmpresaId,
      condominioId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { model: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(toPrioridadeEnum(prioridadeRaw || undefined) ? { prioridade: toPrioridadeEnum(prioridadeRaw || undefined) } : {}),
      ...(whereStatus ? { status: whereStatus } : {}),
    };

    const items = await prisma.atividade.findMany({
      where,
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: { condominio: { select: { id: true, name: true } } },
    });

    const nextCursor = items.length === take ? items[items.length - 1].id : null;
    return NextResponse.json({ items, nextCursor });
  } catch (e: any) {
    if (e?.status) return e; // erros levantados por ensure/assert
    console.error("Atividades.GET error:", e);
    return json(500, { error: "Falha ao listar atividades." });
  }
}

/** -------- POST (create) --------
 * Requer no body: empresaId, condominioId.
 * Aceita status boolean OU enum/string; prioridade e budgetStatus em caixa livre.
 */
const createSchema = z
  .object({
    empresaId: z.string().uuid(),
    condominioId: z.string().uuid(),

    name: z.string().min(1),
    type: z.string().min(1),
    quantity: z.number().int().positive(),
    model: z.string().min(1),
    location: z.string().min(1),

    // opcionais
    status: z.union([z.boolean(), z.string()]).optional(),
    prioridade: z.string().optional(),
    frequencia: z.string().optional(),
    equipe: z.string().optional(),
    tipoAtividade: z.string().optional(),
    observacoes: z.string().optional().nullable(),
    photoUrl: z.string().url().optional().nullable(),

    expectedDate: dateFlex().optional(),
    startAt: dateFlex().optional(),
    endAt: dateFlex().optional(),
    completedAt: dateFlex().optional(),

    tags: z.array(z.string()).optional(),

    budgetStatus: z.string().optional(),
    costEstimate: z
      .union([z.number(), z.string()])
      .optional()
      .transform((v) => (v == null || v === "" ? undefined : Number(v))),
    approvedBudget: z
      .union([z.number(), z.string()])
      .optional()
      .transform((v) => (v == null || v === "" ? undefined : Number(v))),
    appliedStandard: z.string().optional().nullable(),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    const authEmpresaId = await getEmpresaIdFromRequest();
    if (!authEmpresaId) return json(401, { error: "Não autorizado" });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "JSON malformado" });
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return json(422, { error: "Validação falhou", issues: parsed.error.flatten() });
    }

    const data = parsed.data;

    // empresaId do body deve bater com o do usuário
    ensureEmpresaMatch(authEmpresaId, data.empresaId);

    // condominioId deve pertencer à empresa
    await assertCondominioDaEmpresa(data.condominioId, authEmpresaId);

    // normalizações para enums
    const statusEnum = toStatusEnum(data.status ?? undefined);
    const prioridadeEnum = toPrioridadeEnum(data.prioridade ?? undefined);
    const budgetEnum = toBudgetEnum(data.budgetStatus ?? undefined);

    const created = await prisma.atividade.create({
      data: {
        name: data.name,
        type: data.type,
        quantity: data.quantity,
        model: data.model,
        location: data.location,
        photoUrl: data.photoUrl ?? null,

        ...(statusEnum ? { status: statusEnum } : {}),
        ...(prioridadeEnum ? { prioridade: prioridadeEnum } : {}),
        ...(budgetEnum ? { budgetStatus: budgetEnum } : {}),

        frequencia: data.frequencia ?? undefined,
        equipe: data.equipe ?? undefined,
        tipoAtividade: data.tipoAtividade ?? undefined,
        observacoes: data.observacoes ?? undefined,

        expectedDate: data.expectedDate ?? undefined,
        startAt: data.startAt ?? undefined,
        endAt: data.endAt ?? undefined,
        completedAt: data.completedAt ?? undefined,

        tags: data.tags ?? [],

        empresaId: authEmpresaId,         // força empresa do usuário
        condominioId: data.condominioId,  // já validado que pertence à empresa
        appliedStandard: data.appliedStandard ?? undefined,

        costEstimate: data.costEstimate ?? undefined,
        approvedBudget: data.approvedBudget ?? undefined,
      },
      include: { condominio: { select: { id: true, name: true } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.status) return e; // erros levantados por ensure/assert
    console.error("Atividades.POST error:", e);
    const msg = e?.meta?.cause || e?.message || "Não foi possível criar a atividade.";
    return json(400, { error: msg });
  }
}
