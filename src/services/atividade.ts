// services/atividade.ts
import prisma from "@/lib/prisma";
import { Frequencia } from "@/utils/frequencias";
import {
  addDays,
  addMonths,
  addYears,
  proximoDiaUtil,
  startOfDayBrasilia,
} from "@/utils/date-utils";
import { HistoricoStatus } from "@prisma/client";

/**
 * Calcula a próxima data de execução a partir de uma data base
 * usando a frequência do molde.
 * IMPORTANTE: Usa timezone de Brasília para consistência com o resto do sistema.
 */
export function calcularProximaData(
  base: Date,
  frequencia: Frequencia
): Date | null {
  // Usar timezone de Brasília para consistência
  const dataBase = startOfDayBrasilia(base);

  switch (frequencia) {
    case "Não se repete":
    case "Conforme indicação dos fornecedores":
    case "Não aplicável":
      return null;

    // regra especial -> sem idade do prédio, não calcula
    case "A cada 5 anos para edifícios de até 10 anos de entrega, A cada 3 anos para edifícios entre 11 a 30 anos de entrega, A cada 1 ano para edifícios com mais de 30 anos de entrega":
      return null;

    case "Todos os dias":
      return addDays(dataBase, 1);

    case "Em dias alternados":
      return addDays(dataBase, 2);

    case "Segunda a sexta":
      return proximoDiaUtil(dataBase, { incluiSabado: false });

    case "Segunda a sábado":
      return proximoDiaUtil(dataBase, { incluiSabado: true });

    case "A cada semana":
      return addDays(dataBase, 7);

    case "A cada 15 dias":
      return addDays(dataBase, 15);

    case "A cada 1 mês":
      return addMonths(dataBase, 1);

    case "A cada 2 meses":
      return addMonths(dataBase, 2);

    case "A cada 3 meses":
      return addMonths(dataBase, 3);

    case "A cada 4 meses":
      return addMonths(dataBase, 4);

    case "A cada 5 meses":
      return addMonths(dataBase, 5);

    case "A cada 6 meses":
      return addMonths(dataBase, 6);

    case "A cada 1 ano":
      return addYears(dataBase, 1);

    case "A cada 2 anos":
      return addYears(dataBase, 2);

    case "A cada 3 anos":
      return addYears(dataBase, 3);

    case "A cada 5 anos":
      return addYears(dataBase, 5);

    case "A cada 10 anos":
      return addYears(dataBase, 10);

    default:
      return null;
  }
}

/**
 * Se o histórico foi marcado como FEITO, calcula e garante
 * a criação do próximo AtividadeHistorico PENDENTE.
 */
export async function agendarProximaExecucaoSeFeito(args: {
  atividadeId: string;
  dataReferencia: Date;
  status: HistoricoStatus | string;
}) {
  const statusStr =
    typeof args.status === "string" ? args.status.toUpperCase() : args.status;

  if (statusStr !== "FEITO" && statusStr !== HistoricoStatus.FEITO) return;

  const atividade = await prisma.atividade.findUnique({
    where: { id: args.atividadeId },
    select: { frequencia: true, completionDate: true },
  });
  if (!atividade) return;

  const proxima = calcularProximaData(
    args.dataReferencia,
    atividade.frequencia as Frequencia
  );
  if (!proxima) return;

  // Verifica se a próxima data ultrapassa a data de finalização do ciclo
  if (atividade.completionDate) {
    const completionDateNorm = startOfDayBrasilia(atividade.completionDate);
    if (proxima.getTime() > completionDateNorm.getTime()) {
      // Ciclo encerrado - não gera mais ocorrências
      return;
    }
  }

  await prisma.atividadeHistorico.upsert({
    where: {
      atividadeId_dataReferencia: {
        atividadeId: args.atividadeId,
        dataReferencia: proxima,
      },
    },
    create: {
      atividadeId: args.atividadeId,
      dataReferencia: proxima,
      status: HistoricoStatus.PENDENTE,
    },
    update: {}, // só garante que exista
  });
}

/**
 * Opcional: usado se você quiser consultar a próxima data sem criar histórico.
 */
export async function calcularProximaExecucaoAtividade(
  atividadeId: string
): Promise<Date | null> {
  const atividade = await prisma.atividade.findUnique({
    where: { id: atividadeId },
    include: {
      historico: {
        where: {
          status: {
            in: [HistoricoStatus.FEITO, HistoricoStatus.ATRASADO],
          },
        },
        orderBy: { dataReferencia: "desc" },
        take: 1,
      },
    },
  });

  if (!atividade) return null;

  const ultima = atividade.historico[0];
  const base = ultima?.dataReferencia ?? atividade.expectedDate;
  if (!base) return null;

  return calcularProximaData(base, atividade.frequencia as Frequencia);
}
