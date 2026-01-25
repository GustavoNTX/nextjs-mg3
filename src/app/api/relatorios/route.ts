// app/api/relatorios/route.ts
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { startOfDayBrasilia, addDaysBrasilia } from "@/utils/date-utils";

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
    } catch {}
  }
  return null;
}

const json = (status: number, body: any) => NextResponse.json(body, { status });

export async function GET(req: NextRequest) {
  try {
    const authEmpresaId = await getEmpresaIdFromRequest();
    if (!authEmpresaId) return json(401, { error: "Não autorizado" });

    const { searchParams } = new URL(req.url);
    const condominioId = searchParams.get("condominioId") || undefined;

    const hoje = startOfDayBrasilia(new Date());
    const amanha = addDaysBrasilia(hoje, 1);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);

    const whereBase: any = {
      empresaId: authEmpresaId,
      deletedAt: null,
      ...(condominioId ? { condominioId } : {}),
    };

    // 1. Contagem total de atividades
    const totalAtividades = await prisma.atividade.count({ where: whereBase });

    // 2. Contagem por prioridade
    const porPrioridade = await prisma.atividade.groupBy({
      by: ["prioridade"],
      where: whereBase,
      _count: { id: true },
    });

    // 3. Contagem por tipo de atividade
    const porTipoAtividade = await prisma.atividade.groupBy({
      by: ["tipoAtividade"],
      where: whereBase,
      _count: { id: true },
    });

    // 4. Contagem por equipe
    const porEquipe = await prisma.atividade.groupBy({
      by: ["equipe"],
      where: whereBase,
      _count: { id: true },
    });

    // 5. Contagem por frequência
    const porFrequencia = await prisma.atividade.groupBy({
      by: ["frequencia"],
      where: whereBase,
      _count: { id: true },
    });

    // 6. Contagem por status de orçamento
    const porBudgetStatus = await prisma.atividade.groupBy({
      by: ["budgetStatus"],
      where: whereBase,
      _count: { id: true },
    });

    // 7. Soma de custos estimados e aprovados
    const custos = await prisma.atividade.aggregate({
      where: whereBase,
      _sum: {
        costEstimate: true,
        approvedBudget: true,
      },
    });

    // 8. Atividades por condomínio (top 10)
    const porCondominio = await prisma.atividade.groupBy({
      by: ["condominioId"],
      where: whereBase,
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

    // 9. Status do histórico (HOJE)
    const historicoHoje = await prisma.atividadeHistorico.groupBy({
      by: ["status"],
      where: {
        atividade: whereBase,
        dataReferencia: { gte: hoje, lt: amanha },
      },
      _count: { id: true },
    });

    // 10. Atividades concluídas este mês
    const concluidasMes = await prisma.atividadeHistorico.count({
      where: {
        atividade: whereBase,
        status: "FEITO",
        completedAt: { gte: inicioMes },
      },
    });

    // 11. Atividades concluídas este ano
    const concluidasAno = await prisma.atividadeHistorico.count({
      where: {
        atividade: whereBase,
        status: "FEITO",
        completedAt: { gte: inicioAno },
      },
    });

    // 12. Atividades criadas por mês (últimos 6 meses)
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

      // 13. Atividades concluídas por mês (últimos 6 meses)
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

      // 13. Atividades concluídas por mês (últimos 6 meses)
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

    // 14. Taxa de conclusão (atividades concluídas / total de históricos com status definitivo)
    const totalHistoricosDefinitivos = await prisma.atividadeHistorico.count({
      where: {
        atividade: whereBase,
        status: { in: ["FEITO", "PULADO", "ATRASADO"] },
      },
    });

    const totalConcluidas = await prisma.atividadeHistorico.count({
      where: {
        atividade: whereBase,
        status: "FEITO",
      },
    });

    const taxaConclusao =
      totalHistoricosDefinitivos > 0
        ? Math.round((totalConcluidas / totalHistoricosDefinitivos) * 100)
        : 0;

    // 15. Total de condomínios
    const totalCondominios = await prisma.condominio.count({
      where: { empresaId: authEmpresaId },
    });

    return NextResponse.json({
      resumo: {
        totalAtividades,
        totalCondominios,
        concluidasMes,
        concluidasAno,
        taxaConclusao,
        custoEstimadoTotal: custos._sum.costEstimate
          ? Number(custos._sum.costEstimate)
          : 0,
        orcamentoAprovadoTotal: custos._sum.approvedBudget
          ? Number(custos._sum.approvedBudget)
          : 0,
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
      evolucaoMensal: {
        criadas: criadasPorMes.map((c) => ({
          mes: c.mes,
          count: Number(c.count),
        })),
        concluidas: concluidasPorMes.map((c) => ({
          mes: c.mes,
          count: Number(c.count),
        })),
      },
    });
  } catch (e: any) {
    console.error("Relatorios.GET error:", e);
    return json(500, { error: "Falha ao gerar relatórios." });
  }
}
