// app/api/relatorios/route.ts
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { startOfDayBrasilia, addDaysBrasilia } from "@/utils/date-utils";
import { Prisma } from "@prisma/client";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

// Função para calcular o filtro de período baseado nos parâmetros
function getPeriodoFilter(periodo: string | null, dataInicioStr: string | null, dataFimStr: string | null) {
  const hoje = startOfDayBrasilia(new Date());
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  // Se não tiver período OU for "todos", retorna null (sem filtro = histórico completo)
  if (!periodo || periodo === "todos" || periodo === "") {
    return null;
  }

  switch (periodo) {
    case "hoje":
      startDate = hoje;
      endDate = addDaysBrasilia(hoje, 1);
      break;
    case "semana":
      startDate = startOfDayBrasilia(new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000));
      endDate = addDaysBrasilia(new Date(), 1);
      break;
    case "mes_atual":
      startDate = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      endDate = addDaysBrasilia(new Date(), 1);
      break;
    case "mes_anterior":
      startDate = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      endDate = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      break;
    case "trimestre":
      startDate = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
      endDate = addDaysBrasilia(new Date(), 1);
      break;
    case "ano":
      startDate = new Date(hoje.getFullYear(), 0, 1);
      endDate = addDaysBrasilia(new Date(), 1);
      break;
    case "personalizado":
      if (dataInicioStr && dataFimStr) {
        startDate = startOfDayBrasilia(new Date(dataInicioStr));
        endDate = startOfDayBrasilia(addDaysBrasilia(new Date(dataFimStr), 1));
      }
      break;
    default:
      return null;
  }

  return { startDate, endDate };
}

// Função para calcular o número de dias no período
function getDiasNoPeriodo(periodo: string | null, dataInicioStr: string | null, dataFimStr: string | null): number {
  if (!periodo || periodo === "todos" || periodo === "") return 0;

  const hoje = new Date();

  switch (periodo) {
    case "hoje":
      return 1;
    case "semana":
      return 7;
    case "mes_atual": {
      const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      return ultimoDia.getDate();
    }
    case "mes_anterior": {
      const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      return ultimoDia.getDate();
    }
    case "trimestre":
      return 90;
    case "ano":
      return 365;
    case "personalizado":
      if (dataInicioStr && dataFimStr) {
        const inicio = new Date(dataInicioStr);
        const fim = new Date(dataFimStr);
        const diffTime = Math.abs(fim.getTime() - inicio.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      }
      return 30;
    default:
      return 30;
  }
}

const json = (status: number, body: any) => NextResponse.json(body, { status });

export async function GET(req: NextRequest) {
  try {
    const authEmpresaId = await getEmpresaIdFromRequest();
    if (!authEmpresaId) return json(401, { error: "Não autorizado" });

    const { searchParams } = new URL(req.url);
    const condominioId = searchParams.get("condominioId") || undefined;
    const periodo = searchParams.get("periodo");
    const dataInicioStr = searchParams.get("dataInicio");
    const dataFimStr = searchParams.get("dataFim");

    // Calcular filtro de período
    const periodoFilter = getPeriodoFilter(periodo, dataInicioStr, dataFimStr);
    const diasNoPeriodo = getDiasNoPeriodo(periodo, dataInicioStr, dataFimStr);

    const hoje = startOfDayBrasilia(new Date());
    const amanha = addDaysBrasilia(hoje, 1);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);

    // Base where para atividades
    const whereBase: any = {
      empresaId: authEmpresaId,
      deletedAt: null,
      ...(condominioId ? { condominioId } : {}),
    };

    // Criar uma cópia para consultas que devem usar o filtro de período
    const whereBaseComFiltro: any = {
      empresaId: authEmpresaId,
      deletedAt: null,
      ...(condominioId ? { condominioId } : {}),
    };

    // Aplicar filtro de período SOMENTE se não for "todos"
    if (periodoFilter) {
      whereBaseComFiltro.createdAt = {
        gte: periodoFilter.startDate,
        lt: periodoFilter.endDate,
      };
    }

    // ===== CONSULTAS QUE SEMPRE USAM O FILTRO =====

    const totalAtividades = await prisma.atividade.count({
      where: whereBaseComFiltro
    });

    const porPrioridade = await prisma.atividade.groupBy({
      by: ["prioridade"],
      where: whereBaseComFiltro,
      _count: { id: true },
    });

    const porTipoAtividade = await prisma.atividade.groupBy({
      by: ["tipoAtividade"],
      where: whereBaseComFiltro,
      _count: { id: true },
    });

    const porEquipe = await prisma.atividade.groupBy({
      by: ["equipe"],
      where: whereBaseComFiltro,
      _count: { id: true },
    });

    const porFrequencia = await prisma.atividade.groupBy({
      by: ["frequencia"],
      where: whereBaseComFiltro,
      _count: { id: true },
    });

    const porBudgetStatus = await prisma.atividade.groupBy({
      by: ["budgetStatus"],
      where: whereBaseComFiltro,
      _count: { id: true },
    });

    const custos = await prisma.atividade.aggregate({
      where: whereBaseComFiltro,
      _sum: {
        costEstimate: true,
        approvedBudget: true,
      },
    });

    const porCondominio = await prisma.atividade.groupBy({
      by: ["condominioId"],
      where: whereBaseComFiltro,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    // Buscar nomes dos condomínios
    const condominioIds = porCondominio.map((c) => c.condominioId);
    const condominios = await prisma.condominio.findMany({
      where: { id: { in: condominioIds } },
      select: { id: true, name: true },
    });
    const condominioMap = new Map(condominios.map((c) => [c.id, c.name]));

    const porCondominioComNome = porCondominio.map((c) => ({
      condominioId: c.condominioId,
      name: condominioMap.get(c.condominioId) || "Desconhecido",
      count: c._count.id,
    }));

    // ===== CONSULTAS QUE NÃO USAM FILTRO (dados específicos) =====

    const historicoHoje = await prisma.atividadeHistorico.groupBy({
      by: ["status"],
      where: {
        atividade: {
          empresaId: authEmpresaId,
          deletedAt: null,
          ...(condominioId ? { condominioId } : {}),
        },
        dataReferencia: { gte: hoje, lt: amanha },
      },
      _count: { id: true },
    });

    // Atividades concluídas no período
    let concluidasNoPeriodo = 0;
    const whereConcluidas: any = {
      atividade: {
        empresaId: authEmpresaId,
        deletedAt: null,
        ...(condominioId ? { condominioId } : {}),
      },
      status: "FEITO",
    };

    if (periodoFilter) {
      whereConcluidas.completedAt = {
        gte: periodoFilter.startDate,
        lt: periodoFilter.endDate,
      };
    }

    concluidasNoPeriodo = await prisma.atividadeHistorico.count({
      where: whereConcluidas,
    });

    const concluidasMes = await prisma.atividadeHistorico.count({
      where: {
        atividade: {
          empresaId: authEmpresaId,
          deletedAt: null,
          ...(condominioId ? { condominioId } : {}),
        },
        status: "FEITO",
        completedAt: { gte: inicioMes },
      },
    });

    const concluidasAno = await prisma.atividadeHistorico.count({
      where: {
        atividade: {
          empresaId: authEmpresaId,
          deletedAt: null,
          ...(condominioId ? { condominioId } : {}),
        },
        status: "FEITO",
        completedAt: { gte: inicioAno },
      },
    });

    // EVOLUÇÃO DIÁRIA (últimos 7 dias)
    const ultimos7dias = [];
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      const dataInicioDia = startOfDayBrasilia(data);
      const dataFimDia = addDaysBrasilia(dataInicioDia, 1);

      const totalDia = await prisma.atividade.count({
        where: {
          empresaId: authEmpresaId,
          deletedAt: null,
          ...(condominioId ? { condominioId } : {}),
          createdAt: { gte: dataInicioDia, lt: dataFimDia },
        },
      });

      const concluidasDia = await prisma.atividadeHistorico.count({
        where: {
          atividade: {
            empresaId: authEmpresaId,
            deletedAt: null,
            ...(condominioId ? { condominioId } : {}),
          },
          status: "FEITO",
          completedAt: { gte: dataInicioDia, lt: dataFimDia },
        },
      });

      ultimos7dias.push({
        data: data.toISOString().split('T')[0],
        total: totalDia,
        concluidas: concluidasDia,
      });
    }

    // EVOLUÇÃO MENSAL (últimos 6 meses)
    const seisAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);

    let criadasPorMes: { mes: string; count: bigint }[] = [];
    let concluidasPorMes: { mes: string; count: bigint }[] = [];

    if (condominioId) {
      criadasPorMes = await prisma.$queryRaw`
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM') as mes,
          COUNT(*)::bigint as count
        FROM "Atividade"
        WHERE "empresaId" = ${authEmpresaId}
          AND "deletedAt" IS NULL
          AND "createdAt" >= ${seisAtras}
          AND "condominioId" = ${condominioId}
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY mes ASC
      `;

      concluidasPorMes = await prisma.$queryRaw`
        SELECT 
          TO_CHAR(h."completedAt", 'YYYY-MM') as mes,
          COUNT(*)::bigint as count
        FROM "AtividadeHistorico" h
        JOIN "Atividade" a ON h."atividadeId" = a."id"
        WHERE a."empresaId" = ${authEmpresaId}
          AND a."deletedAt" IS NULL
          AND h."status" = 'FEITO'
          AND h."completedAt" >= ${seisAtras}
          AND a."condominioId" = ${condominioId}
        GROUP BY TO_CHAR(h."completedAt", 'YYYY-MM')
        ORDER BY mes ASC
      `;
    } else {
      criadasPorMes = await prisma.$queryRaw`
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM') as mes,
          COUNT(*)::bigint as count
        FROM "Atividade"
        WHERE "empresaId" = ${authEmpresaId}
          AND "deletedAt" IS NULL
          AND "createdAt" >= ${seisAtras}
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY mes ASC
      `;

      concluidasPorMes = await prisma.$queryRaw`
        SELECT 
          TO_CHAR(h."completedAt", 'YYYY-MM') as mes,
          COUNT(*)::bigint as count
        FROM "AtividadeHistorico" h
        JOIN "Atividade" a ON h."atividadeId" = a."id"
        WHERE a."empresaId" = ${authEmpresaId}
          AND a."deletedAt" IS NULL
          AND h."status" = 'FEITO'
          AND h."completedAt" >= ${seisAtras}
        GROUP BY TO_CHAR(h."completedAt", 'YYYY-MM')
        ORDER BY mes ASC
      `;
    }

    // Taxa de conclusão
    const whereHistorico: any = {
      atividade: {
        empresaId: authEmpresaId,
        deletedAt: null,
        ...(condominioId ? { condominioId } : {}),
      },
      status: { in: ["FEITO", "PULADO", "ATRASADO"] },
    };

    if (periodoFilter) {
      whereHistorico.completedAt = {
        gte: periodoFilter.startDate,
        lt: periodoFilter.endDate,
      };
    }

    const totalHistoricosDefinitivos = await prisma.atividadeHistorico.count({
      where: whereHistorico,
    });

    const whereConcluidasTotal: any = {
      atividade: {
        empresaId: authEmpresaId,
        deletedAt: null,
        ...(condominioId ? { condominioId } : {}),
      },
      status: "FEITO",
    };

    if (periodoFilter) {
      whereConcluidasTotal.completedAt = {
        gte: periodoFilter.startDate,
        lt: periodoFilter.endDate,
      };
    }

    const totalConcluidas = await prisma.atividadeHistorico.count({
      where: whereConcluidasTotal,
    });

    const taxaConclusao =
      totalHistoricosDefinitivos > 0
        ? Math.round((totalConcluidas / totalHistoricosDefinitivos) * 100)
        : 0;

    // TEMPO MÉDIO DE RESOLUÇÃO - usando Prisma.sql corretamente
    let tempoMedioResolucao = null;

    const tempoMedioQuery = Prisma.sql`
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (h."completedAt" - a."createdAt")) / 86400), 0) as media_dias
      FROM "AtividadeHistorico" h
      JOIN "Atividade" a ON h."atividadeId" = a."id"
      WHERE a."empresaId" = ${authEmpresaId}
        AND a."deletedAt" IS NULL
        AND h."status" = 'FEITO'
        AND h."completedAt" IS NOT NULL
        ${periodoFilter ? Prisma.sql`AND h."completedAt" >= ${periodoFilter.startDate}` : Prisma.empty}
        ${periodoFilter ? Prisma.sql`AND h."completedAt" < ${periodoFilter.endDate}` : Prisma.empty}
        ${condominioId ? Prisma.sql`AND a."condominioId" = ${condominioId}` : Prisma.empty}
    `;

    const resultTempoMedio = await prisma.$queryRaw<{ media_dias: number }[]>(tempoMedioQuery);

    if (resultTempoMedio && resultTempoMedio.length > 0) {
      tempoMedioResolucao = Number(resultTempoMedio[0].media_dias).toFixed(1);
    }

    // VELOCIDADE DE RESPOSTA - usando Prisma.sql corretamente
    let velocidadeResposta = null;

    const velocidadeQuery = Prisma.sql`
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (h."completedAt" - a."createdAt")) / 3600), 0) as media_horas
      FROM "AtividadeHistorico" h
      JOIN "Atividade" a ON h."atividadeId" = a."id"
      WHERE a."empresaId" = ${authEmpresaId}
        AND a."deletedAt" IS NULL
        AND h."status" = 'FEITO'
        AND h."completedAt" IS NOT NULL
        AND a."prioridade" IN ('ALTO', 'URGENTE')
        ${periodoFilter ? Prisma.sql`AND h."completedAt" >= ${periodoFilter.startDate}` : Prisma.empty}
        ${periodoFilter ? Prisma.sql`AND h."completedAt" < ${periodoFilter.endDate}` : Prisma.empty}
        ${condominioId ? Prisma.sql`AND a."condominioId" = ${condominioId}` : Prisma.empty}
    `;

    const resultVelocidade = await prisma.$queryRaw<{ media_horas: number }[]>(velocidadeQuery);

    if (resultVelocidade && resultVelocidade.length > 0) {
      velocidadeResposta = Math.round(Number(resultVelocidade[0].media_horas));
    }

    // ATIVIDADES ATRASADAS
    let atividadesAtrasadas = 0;
    if (periodoFilter) {
      const atrasadasRaw = await prisma.atividadeHistorico.findMany({
        where: {
          atividade: {
            empresaId: authEmpresaId,
            deletedAt: null,
            ...(condominioId ? { condominioId } : {}),
          },
          status: "ATRASADO",
          dataReferencia: {
            gte: periodoFilter.startDate,
            lt: periodoFilter.endDate,
          },
        },
        distinct: ["atividadeId"],
        select: { atividadeId: true },
      });
      atividadesAtrasadas = atrasadasRaw.length;
    } else {
      atividadesAtrasadas = await prisma.atividadeHistorico.count({
        where: {
          atividade: {
            empresaId: authEmpresaId,
            deletedAt: null,
            ...(condominioId ? { condominioId } : {}),
          },
          status: "ATRASADO",
        },
      });
    }

    const totalCondominios = await prisma.condominio.count({
      where: { empresaId: authEmpresaId },
    });

    const orcamentosPendentes = porBudgetStatus.find(b => b.budgetStatus === "PENDENTE")?._count.id || 0;
    const totalOrcamentos = porBudgetStatus.reduce((acc, curr) => acc + curr._count.id, 0) || 1;
    const pendentesNoPeriodo = totalAtividades - concluidasNoPeriodo;

    return NextResponse.json({
      resumo: {
        totalAtividades,
        totalCondominios,
        concluidasMes,
        pendentesMes: pendentesNoPeriodo,
        concluidasAno,
        taxaConclusao,
        custoEstimadoTotal: custos._sum.costEstimate
          ? Number(custos._sum.costEstimate)
          : 0,
        orcamentoAprovadoTotal: custos._sum.approvedBudget
          ? Number(custos._sum.approvedBudget)
          : 0,
        tempoMedioResolucao: tempoMedioResolucao ? parseFloat(tempoMedioResolucao) : null,
        eficiencia: `${taxaConclusao}%`,
        velocidadeResposta: velocidadeResposta ? `${velocidadeResposta}h` : null,
      },
      statusHoje: historicoHoje.map((h) => ({
        status: h.status,
        count: h._count.id,
      })),
      porPrioridade: porPrioridade.map((p) => ({
        prioridade: p.prioridade,
        count: p._count.id,
      })),
      porTipoAtividade: porTipoAtividade.map((t) => ({
        tipo: t.tipoAtividade,
        count: t._count.id,
      })),
      porEquipe: porEquipe.map((e) => ({
        equipe: e.equipe,
        count: e._count.id,
      })),
      porFrequencia: porFrequencia.map((f) => ({
        frequencia: f.frequencia,
        count: f._count.id,
      })),
      porBudgetStatus: porBudgetStatus.map((b) => ({
        status: b.budgetStatus,
        count: b._count.id,
      })),
      porCondominio: porCondominioComNome,
      evolucaoMensalOriginal: {
        criadas: criadasPorMes.map((c) => ({
          mes: c.mes,
          count: Number(c.count),
        })),
        concluidas: concluidasPorMes.map((c) => ({
          mes: c.mes,
          count: Number(c.count),
        })),
      },
      evolucaoMensal: ultimos7dias,
      metricas: {
        atividadesAtrasadas,
        orcamentosPendentes,
        totalOrcamentos,
        diasNoPeriodo: diasNoPeriodo || null,
        concluidasNoPeriodo,
        pendentesNoPeriodo,
      },
      filtroAplicado: {
        periodo: periodo || "todos",
        temFiltro: !!periodoFilter,
        dataInicio: periodoFilter?.startDate,
        dataFim: periodoFilter?.endDate,
      }
    });
  } catch (e: any) {
    console.error("Relatorios.GET error:", e);
    return json(500, { error: "Falha ao gerar relatórios." });
  }
}