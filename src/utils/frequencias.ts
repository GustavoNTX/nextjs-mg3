// @/utils/frequencias

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

// set canônico pra lookup rápido
const CANONICAL_SET = new Set<string>(FREQUENCIAS as readonly string[]);

export const normalizeFrequency = (raw?: string | null): Frequencia => {
  const s = (raw ?? "").trim();
  if (!s) return "Não se repete";

  // se já veio certinho, devolve
  if (CANONICAL_SET.has(s)) return s as Frequencia;

  const base = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  // mapeia variações comuns para os canônicos da lista acima
  if (base === "diaria") return "Todos os dias";
  if (base === "semanal") return "A cada semana";
  if (base === "quinzenal") return "A cada 15 dias";
  if (base === "mensal" || base === "a cada mes") return "A cada 1 mês";
  if (base === "trimestral") return "A cada 3 meses";
  if (base === "semestral") return "A cada 6 meses";
  if (base === "anual") return "A cada 1 ano";

  if (base === "uma vez" || base === "sob demanda") {
    return "Não se repete";
  }

  // fallback seguro
  return "Não se repete";
};
