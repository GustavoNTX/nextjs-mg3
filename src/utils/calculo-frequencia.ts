// calculo-frequencia.ts
import { Frequencia } from "@/utils/frequencias";
import { addDays, addMonths, addYears, proximoDiaUtil, startOfDay } from "@/utils/date-utils";

export function calcularProximaData(base: Date, frequencia: Frequencia): Date | null {
  const dataBase = startOfDay(base);

  switch (frequencia) {
    case "Não se repete":
    case "Conforme indicação dos fornecedores":
    case "Não aplicável":
      return null;

    // Aqui você poderia implementar a regra especial do edifício se tiver a idade no condomínio
    case "A cada 5 anos para edifícios de até 10 anos de entrega, A cada 3 anos para edifícios entre 11 a 30 anos de entrega, A cada 1 ano para edifícios com mais de 30 anos de entrega":
      // Sem info da idade do prédio -> não calcula automaticamente
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
      // fallback de segurança
      return null;
  }
}
