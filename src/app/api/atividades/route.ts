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
const TZ = "America/Fortaleza";
function startOfDayFortaleza(d = new Date()) {
  const local = new Date(d).toLocaleString("en-US", { timeZone: TZ });
  const dt = new Date(local);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** -------- GET (lista) -------- */
export async function GET(req: NextRequest) {
  try {
    const authEmpresaId = await getEmpresaIdFromRequest();
    if (!authEmpresaId) return json(401, { error: "Não autorizado" });

    const { searchParams } = new URL(req.url);

    const empresaId = searchParams.get("empresaId");
    ensureEmpresaOptionalMatch(authEmpresaId, empresaId);

    const condominioId = searchParams.get("condominioId");
    await assertCondominioDaEmpresa(condominioId, authEmpresaId, {
      required: false,
    });

    const q = (searchParams.get("q") ?? "").trim();
    const prioridadeRaw = searchParams.get("prioridade") ?? undefined;
    const statusRaw = (searchParams.get("status") ?? "").trim().toUpperCase();

    const take = Math.min(
      Math.max(Number(searchParams.get("take") ?? 50), 1),
      200
    );
    const cursor = searchParams.get("cursor") ?? undefined;

    const from = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : null;
    const to = searchParams.get("to")
      ? new Date(searchParams.get("to")!)
      : null;
    const leadDays = Number(searchParams.get("leadDays") || "7");

    const hoje = startOfDayFortaleza();
    const amanha = addDays(hoje, 1);

    // ---- Mapeia status -> filtro em AtividadeHistorico
    let historicoWhere: any | undefined = undefined;

    switch (statusRaw) {
      case "EM_ANDAMENTO":
      case "EM ANDAMENTO":
        historicoWhere = {
          status: { not: "FEITO" },
          dataReferencia: { gte: hoje, lt: amanha },
        };
        break;
      case "PROXIMAS":
      case "PRÓXIMAS":
        historicoWhere = {
          status: "PENDENTE",
          dataReferencia: {
            gt: hoje,
            lte: addDays(hoje, Number.isFinite(leadDays) ? leadDays : 7),
          },
        };
        break;
      case "PENDENTE":
        historicoWhere = {
          OR: [{ status: "PENDENTE" }, { status: "ATRASADO" }],
          ...(from && to
            ? { dataReferencia: { gte: from, lte: to } }
            : { dataReferencia: { lt: amanha } }),
        };
        break;
      case "HISTORICO":
      case "HISTÓRICO":
        historicoWhere = {
          status: { in: ["FEITO", "PULADO"] },
          ...(from && to
            ? { dataReferencia: { gte: from, lte: to } }
            : { dataReferencia: { gte: addDays(hoje, -90), lt: amanha } }),
        };
        break;
      case "FEITO":
      case "PULADO":
      case "ATRASADO":
        historicoWhere = {
          status: statusRaw,
          ...(from && to ? { dataReferencia: { gte: from, lte: to } } : {}),
        };
        break;
      default:
        historicoWhere =
          from && to ? { dataReferencia: { gte: from, lte: to } } : undefined;
    }

    // Filtro textual
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

    // WHERE para a listagem (filtrado)
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

    // Promessas paralelas: itens + total filtrado + total bruto do condomínio (quando houver)
    const itemsPromise = prisma.atividade.findMany({
      where: whereAtividade,
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        condominio: { select: { id: true, name: true } },
        historico: {
          where:
            historicoWhere ??
            (from && to
              ? { dataReferencia: { gte: from, lte: to } }
              : { dataReferencia: { gte: addDays(hoje, -30) } }),
          orderBy: { dataReferencia: "asc" },
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

    const totalFiltradoPromise = prisma.atividade.count({
      where: whereAtividade,
    });

    const totalAtividadesCondominioPromise = condominioId
      ? prisma.atividade.count({
        where: { empresaId: authEmpresaId, condominioId, deletedAt: null },
      })
      : Promise.resolve(null);

    const [items, total, totalAtividadesNosCondominios] = await Promise.all([
      itemsPromise,
      totalFiltradoPromise,
      totalAtividadesCondominioPromise,
    ]);

    const nextCursor =
      items.length === take ? items[items.length - 1].id : null;

    return NextResponse.json({
      items,
      nextCursor,
      total, // total filtrado (respeita q/prioridade/status/intervalo)
      ...(condominioId
        ? {
          totalAtividadesNosCondominios, // nome canônico
          totalAtividadeCondominhos: totalAtividadesNosCondominios, // alias solicitado
        }
        : {}),
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

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let dataRef = hoje;

    if (created.expectedDate) {
      const d = new Date(created.expectedDate);
      d.setHours(0, 0, 0, 0);
      dataRef = d;
    }

    let status: "PENDENTE" | "ATRASADO" | "FEITO" | "PULADO" = "PENDENTE";

    if (dataRef < hoje) {
      status = "ATRASADO";
    }

    await prisma.atividadeHistorico.create({
      data: {
        atividadeId: created.id,
        dataReferencia: dataRef,
        status,
      },
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
