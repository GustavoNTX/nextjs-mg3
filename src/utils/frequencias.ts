// frequencias.ts

export const FREQUENCIAS = [
  "Não se repete",
  "Todos os dias",
  "Em dias alternados",
  "Segunda a sexta",
  "Segunda a sábado",

  // Semana / dias
  "A cada semana",
  "A cada 15 dias",

  // Meses
  "A cada 1 mês",
  "A cada 2 meses",
  "A cada 3 meses",
  "A cada 4 meses",
  "A cada 5 meses",
  "A cada 6 meses",

  // Anos
  "A cada 1 ano",
  "A cada 2 anos",
  "A cada 3 anos",
  "A cada 5 anos",
  "A cada 10 anos",

  // Regra especial de inspeção por idade do edifício (id 11)
  "A cada 5 anos para edifícios de até 10 anos de entrega, A cada 3 anos para edifícios entre 11 a 30 anos de entrega, A cada 1 ano para edifícios com mais de 30 anos de entrega",

  // Especiais
  "Conforme indicação dos fornecedores",
  "Não aplicável",
] as const;

export type Frequencia = (typeof FREQUENCIAS)[number];
