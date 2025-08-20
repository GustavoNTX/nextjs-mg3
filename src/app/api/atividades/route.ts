// app/api/atividades/route.ts
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** -------- helpers comuns -------- */
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

/** -------- GET (lista) --------
 * Suporta: condominioId (obrigatório), q, prioridade, status (boolean OU enum string),
 * paginação take/cursor.
 */
export async function GET(req: NextRequest) {
  try {
    const empresaId = await getEmpresaIdFromRequest();
    if (!empresaId) return json(401, { error: "Não autorizado" });

    const { searchParams } = new URL(req.url);

    const condominioId = searchParams.get("condominioId") ?? undefined;
    if (!condominioId) return json(400, { error: "condominioId é obrigatório" });

    const q = searchParams.get("q") ?? undefined;
    const prioridadeRaw = searchParams.get("prioridade") ?? undefined;
    const statusRaw = searchParams.get("status") ?? undefined;

    const take = Math.min(Math.max(Number(searchParams.get("take") ?? 50), 1), 200);
    const cursor = searchParams.get("cursor") ?? undefined;

    // status pode vir "true"/"false" ou nome do enum
    let whereStatus: AtividadeStatus | undefined;
    if (statusRaw != null) {
      if (statusRaw === "true" || statusRaw === "false") {
        whereStatus = statusRaw === "true" ? "EM_ANDAMENTO" : "PENDENTE";
      } else {
        whereStatus = toStatusEnum(statusRaw);
      }
    }

    const where: any = {
      empresaId,
      condominioId,
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { model: { contains: q, mode: "insensitive" } }] } : {}),
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
  } catch (e) {
    console.error("Atividades.GET error:", e);
    return json(500, { error: "Falha ao listar atividades." });
  }
}

/** -------- POST (create) --------
 * Aceita status boolean OU enum/string; prioridade e budgetStatus em caixa livre;
 * normaliza tudo para os enums do Prisma.
 */
const createSchema = z
  .object({
    name: z.string().min(1),
    type: z.string().min(1),
    quantity: z.number().int().positive(),
    model: z.string().min(1),
    location: z.string().min(1),

    condominioId: z.string().uuid(),

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
    const empresaId = await getEmpresaIdFromRequest();
    if (!empresaId) return json(401, { error: "Não autorizado" });

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

    // normalizações para os enums do Prisma
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

        // enums: só envia se veio algo coerente; senão deixa default do schema
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

        empresaId,
        condominioId: data.condominioId,
        appliedStandard: data.appliedStandard ?? undefined,

        // valores monetários (Decimal em Prisma) — pode enviar como number
        costEstimate: data.costEstimate ?? undefined,
        approvedBudget: data.approvedBudget ?? undefined,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("Atividades.POST error:", e);
    const msg =
      e?.meta?.cause ||
      e?.message ||
      "Não foi possível criar a atividade.";
    return json(400, { error: msg });
  }
}
