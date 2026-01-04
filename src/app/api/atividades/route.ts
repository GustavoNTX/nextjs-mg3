// app/api/atividades/route.ts
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { startOfDayFortaleza, addDaysFortaleza } from "@/utils/date-utils";
import { APP_TIMEZONE, APP_TIMEZONE_OFFSET } from "@/constants/timezone";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** -------- helpers comuns -------- */
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
    } catch { }
  }
  return null;
}

const json = (status: number, body: any) => NextResponse.json(body, { status });

const dateFlex = () =>
  z.preprocess(
    (v) => (v == null || v === "" ? null : new Date(v as any)),
    z.date().nullable()
  );

/** --- normalizadores para enums --- */
type Prioridade = "BAIXO" | "MEDIO" | "ALTO" | "URGENTE";
const PRIORIDADE_SET = new Set(["BAIXO", "MÉDIO", "MEDIO", "ALTO", "URGENTE"]);
function toPrioridadeEnum(input?: string | null): Prioridade | undefined {
  if (!input) return undefined;
  const s = input.trim().toUpperCase();
  if (!PRIORIDADE_SET.has(s)) return undefined;
  return (s === "MÉDIO" ? "MEDIO" : s) as Prioridade;
}

type BudgetStatus = "SEM_ORCAMENTO" | "PENDENTE" | "APROVADO" | "REPROVADO";
const BUDGET_SET = new Set([
  "SEM_ORCAMENTO",
  "SEM ORÇAMENTO",
  "PENDENTE",
  "APROVADO",
  "REPROVADO",
]);
function toBudgetEnum(input?: string | null): BudgetStatus | undefined {
  if (!input) return undefined;
  const s = input.trim().toUpperCase();
  if (s === "SEM ORÇAMENTO") return "SEM_ORCAMENTO";
  if (!BUDGET_SET.has(s)) return undefined;
  return s.replace(" ", "_") as BudgetStatus;
}

/** -------- validações de escopo -------- */
function ensureEmpresaOptionalMatch(
  authEmpresaId: string,
  inputEmpresaId?: string | null
) {
  if (inputEmpresaId && authEmpresaId !== inputEmpresaId) {
    throw json(403, { error: "empresaId não corresponde ao usuário" });
  }
}

async function assertCondominioDaEmpresa(
  condominioId: string | undefined | null,
  empresaId: string,
  options: { required?: boolean } = {}
) {
  const { required = true } = options;
  if (!condominioId) {
    if (required) throw json(400, { error: "condominioId é obrigatório" });
    return;
  }
  const condo = await prisma.condominio.findFirst({
    where: { id: condominioId, empresaId },
    select: { id: true },
  });
  if (!condo)
    throw json(404, { error: "Condomínio não encontrado na sua empresa" });
}

/** -------- datas (TZ Fortaleza) -------- */
// Funções importadas de @/utils/date-utils e @/constants/timezone

/** -------- GET (lista) -------- */
export async function GET(req: NextRequest) {
  try {
    const authEmpresaId = await getEmpresaIdFromRequest();
    if (!authEmpresaId) return json(401, { error: "Não autorizado" });

    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get("empresaId");
    ensureEmpresaOptionalMatch(authEmpresaId, empresaId);

    const condominioId = searchParams.get("condominioId");
    await assertCondominioDaEmpresa(condominioId, authEmpresaId, { required: false });

    const q = (searchParams.get("q") ?? "").trim();
    const prioridadeRaw = searchParams.get("prioridade") ?? undefined;
    const statusRaw = (searchParams.get("status") ?? "").trim().toUpperCase();

    const take = Math.min(Math.max(Number(searchParams.get("take") ?? 50), 1), 200);
    const cursor = searchParams.get("cursor") ?? undefined;

    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : null;
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : null;
    const leadDays = Number(searchParams.get("leadDays") || "7");

    // ✅ HOJE / AMANHÃ canônico (Fortaleza)
    const hoje = startOfDayFortaleza(new Date());         // => 03:00Z
    const amanha = addDaysFortaleza(hoje, 1);             // => 03:00Z do dia seguinte

    // ---- status filter no WHERE (se você quiser manter)
    let historicoWhere: any | undefined = undefined;

    switch (statusRaw) {
      case "EM_ANDAMENTO":
      case "EM ANDAMENTO":
        historicoWhere = { status: "EM_ANDAMENTO", dataReferencia: { gte: hoje, lt: amanha } };
        break;

      case "PENDENTE":
        historicoWhere = { status: { in: ["PENDENTE", "ATRASADO"] }, dataReferencia: { gte: hoje, lt: amanha } };
        break;

      case "HISTORICO":
      case "HISTÓRICO":
        historicoWhere = {
          status: { in: ["FEITO", "PULADO"] },
          dataReferencia: { gte: addDaysFortaleza(hoje, -90), lt: amanha },
        };
        break;

      case "PROXIMAS":
      case "PRÓXIMAS":
        // se você NÃO pré-cria futuro, isso aqui via histórico não faz sentido
        // deixa sem filtro ou trate por expectedDate
        historicoWhere = undefined;
        break;

      default:
        historicoWhere = from && to ? { dataReferencia: { gte: from, lte: to } } : undefined;
    }

    const textWhere = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { model: { contains: q, mode: "insensitive" } },
            { type: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
            { tags: { has: q } },
          ],
        }
      : {};

    const whereAtividade: any = {
      empresaId: authEmpresaId,
      ...(condominioId ? { condominioId } : {}),
      deletedAt: null,
      ...textWhere,
      ...(toPrioridadeEnum(prioridadeRaw || undefined)
        ? { prioridade: toPrioridadeEnum(prioridadeRaw || undefined) }
        : {}),
      ...(historicoWhere ? { historico: { some: historicoWhere } } : {}),
    };

    const items = await prisma.atividade.findMany({
      where: whereAtividade,
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      distinct: ["id"],
      include: {
        condominio: { select: { id: true, name: true } },

        // ✅ PARA O KANBAN: ÚLTIMO EVENTO DE HOJE (1 só)
        historico: {
          where: { dataReferencia: { gte: hoje, lt: amanha } },
          orderBy: { dataReferencia: "desc" },
          take: 1,
          select: {
            id: true,
            dataReferencia: true,
            status: true,
            completedAt: true,
            userId: true,
            observacoes: true,
          },
        },
      },
    });

    const total = await prisma.atividade.count({ where: whereAtividade });

    const totalAtividadesNosCondominios = condominioId
      ? await prisma.atividade.count({ where: { empresaId: authEmpresaId, condominioId, deletedAt: null } })
      : null;

    const nextCursor = items.length === take ? items[items.length - 1].id : null;

    return NextResponse.json({
      items,
      nextCursor,
      total,
      ...(condominioId ? { totalAtividadesNosCondominios } : {}),
    });
  } catch (e: any) {
    if (e?.status) return e;
    console.error("Atividades.GET error:", e);
    return json(500, { error: "Falha ao listar atividades." });
  }
}

/** -------- POST (create) -------- */
const createSchema = z
  .object({
    empresaId: z.string().uuid().optional(),
    condominioId: z.string().uuid(),
    name: z.string().min(1),
    type: z.string().min(1),
    quantity: z.number().int().positive(),
    model: z.string().min(1),
    location: z.string().min(1),
    prioridade: z.string().optional(),
    frequencia: z.string().optional(),
    equipe: z.string().optional(),
    tipoAtividade: z.string().optional(),
    observacoes: z.string().optional().nullable(),
    photoUrl: z.string().url().optional().nullable(),
    expectedDate: dateFlex().optional(),
    tags: z.array(z.string()).optional(),
    budgetStatus: z.string().optional(),
    costEstimate: z
      .union([z.number(), z.string()])
      .optional()
      .transform((v) => {
        if (v == null || v === "") return undefined;
        const n = typeof v === "string" ? Number(v) : v;
        return Number.isFinite(n) ? n : undefined;
      }),
    approvedBudget: z
      .union([z.number(), z.string()])
      .optional()
      .transform((v) => {
        if (v == null || v === "") return undefined;
        const n = typeof v === "string" ? Number(v) : v;
        return Number.isFinite(n) ? n : undefined;
      }),
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
      return json(422, {
        error: "Validação falhou",
        issues: parsed.error.flatten(),
      });
    }
    const data = parsed.data;

    ensureEmpresaOptionalMatch(authEmpresaId, data.empresaId);
    await assertCondominioDaEmpresa(data.condominioId, authEmpresaId);

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
        ...(prioridadeEnum ? { prioridade: prioridadeEnum } : {}),
        ...(budgetEnum ? { budgetStatus: budgetEnum } : {}),
        frequencia: data.frequencia ?? undefined,
        equipe: data.equipe ?? undefined,
        tipoAtividade: data.tipoAtividade ?? undefined,
        observacoes: data.observacoes ?? undefined,
        expectedDate: data.expectedDate ?? undefined,
        tags: data.tags ?? [],
        empresaId: authEmpresaId,
        condominioId: data.condominioId,
        appliedStandard: data.appliedStandard ?? undefined,
        costEstimate: data.costEstimate ?? undefined,
        approvedBudget: data.approvedBudget ?? undefined,
      },
      include: { condominio: { select: { id: true, name: true } } },
    });

    // CRIAÇÃO AUTOMÁTICA DO HISTÓRICO
    // Usar início do dia (Fortaleza) para comparação correta
    const hojeInicio = startOfDayFortaleza(new Date());
    const amanha = addDaysFortaleza(hojeInicio, 1);

    let dataRef: Date;
    if (created.expectedDate) {
      // Normalizar para início do dia no timezone correto
      dataRef = startOfDayFortaleza(new Date(created.expectedDate));
    } else {
      dataRef = hojeInicio;
    }

    // Determinar status baseado na comparação de DIAS, não timestamps
    let status: "PENDENTE" | "ATRASADO" | "EM_ANDAMENTO" | "PROXIMAS" = "PENDENTE";

    if (dataRef.getTime() >= amanha.getTime()) {
      // Data futura (a partir de amanhã)
      status = "PROXIMAS";
    } else if (dataRef.getTime() === hojeInicio.getTime()) {
      // É hoje - começa como PENDENTE
      status = "PENDENTE";
    } else if (dataRef.getTime() < hojeInicio.getTime()) {
      // Data passada
      status = "ATRASADO";
    }

    await prisma.atividadeHistorico.create({
      data: { atividadeId: created.id, dataReferencia: dataRef, status },
    });


    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e?.status) return e;
    console.error("Atividades.POST error:", e);
    const msg =
      e?.meta?.cause || e?.message || "Não foi possível criar a atividade.";
    return json(400, { error: msg });
  }
}
