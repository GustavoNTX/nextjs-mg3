// prisma/seed.ts (CommonJS)
const {
  PrismaClient,
  Prioridade,
  BudgetStatus,
  HistoricoStatus,
  Role,
} = require("@prisma/client");

const prisma = new PrismaClient();

// === Helpers ===
function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
// "Agora" no fuso de Fortaleza (mesma abordagem do backend)
function nowFortaleza() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Fortaleza" }));
}
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function yesterdayFortaleza() {
  const n = nowFortaleza();
  n.setDate(n.getDate() - 1);
  return n;
}

async function main() {
  const agora = new Date();

  // ===== Empresa =====
  const empresa = await prisma.empresa.upsert({
    where: { email: "contato@matriz.com.br" },
    update: {},
    create: {
      name: "Empresa Matriz",
      email: "contato@matriz.com.br",
      cnpj: "00.000.000/0001-00",
    },
    select: { id: true, name: true },
  });

  // ===== Usuário Admin =====
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Administrador",
      // hash da senha "123456789"
      passwordHash:
        "$2b$10$b4ygrwy0x68hLVIb6tpySebA11HLSVdLs3tBYnSE8HtTAp.zTSzCi",
      role: Role.ADMIN,
      empresa: { connect: { id: empresa.id } },
    },
  });

  // ===== Condomínios =====
  const condA = await prisma.condominio.upsert({
    where: { cnpj: "11.111.111/0001-11" },
    update: {},
    create: {
      name: "Condomínio Central",
      cnpj: "11.111.111/0001-11",
      address: "Av. Bezerra de Menezes, 1000",
      neighborhood: "Centro",
      city: "Fortaleza",
      state: "CE",
      type: "Residencial",
      empresa: { connect: { id: empresa.id } },
    },
    select: { id: true, name: true },
  });

  const condB = await prisma.condominio.upsert({
    where: { cnpj: "22.222.222/0001-22" },
    update: {},
    create: {
      name: "Condomínio Norte",
      cnpj: "22.222.222/0001-22",
      address: "Rua das Palmeiras, 200",
      neighborhood: "Aldeota",
      city: "Fortaleza",
      state: "CE",
      type: "Comercial",
      empresa: { connect: { id: empresa.id } },
    },
    select: { id: true, name: true },
  });

  // Limpa atividades do seed anterior
  const sampleNames = [
    "Bomba de Água Piscina",
    "Pintura Garagem",
    "Revisão Elétrica Torre A",
    "Reparo Portão de Entrada",
    "Higienização Caixa d’Água",
    "Troca Lâmpadas Áreas Comuns",
    // novas deste seed:
    "Checklist Diário Portaria",
    "Troca Extintores (pré-alerta)",
    "Gerador – Teste Único (overdue)",
  ];
  await prisma.atividade.deleteMany({
    where: {
      empresaId: empresa.id,
      OR: [{ name: { in: sampleNames } }, { tags: { has: "seed" } }],
    },
  });

  // ===== Atividades (Condomínio A) =====
  const aBomba = await prisma.atividade.create({
    data: {
      name: "Bomba de Água Piscina",
      type: "Bomba Hidráulica",
      quantity: 1,
      model: "Jacuzzi 1CV-Plus",
      location: "Casa de Máquinas da Piscina",
      prioridade: Prioridade.MEDIO,
      frequencia: "A cada mês",
      equipe: "Equipe interna",
      tipoAtividade: "Preventiva",
      observacoes: "Verificar ruídos e vazamentos.",
      expectedDate: addDays(3),
      tags: ["seed", "hidráulica"],
      budgetStatus: BudgetStatus.SEM_ORCAMENTO,
      appliedStandard: "NR-13",
      createdAt: addDays(-10),
      empresaId: empresa.id,
      condominioId: condA.id,
    },
    select: { id: true },
  });

  const aPintura = await prisma.atividade.create({
    data: {
      name: "Pintura Garagem",
      type: "Pintura",
      quantity: 120,
      model: "Tinta Epóxi",
      location: "Garagem Subsolo",
      prioridade: Prioridade.ALTO,
      frequencia: "Uma vez",
      equipe: "Terceirizada",
      tipoAtividade: "Corretiva",
      observacoes: "Delimitar vagas após pintura.",
      expectedDate: addDays(14),
      tags: ["seed", "civil"],
      budgetStatus: BudgetStatus.PENDENTE,
      costEstimate: "8500.00",
      appliedStandard: "ABNT NBR 13245",
      createdAt: addDays(-5),
      empresaId: empresa.id,
      condominioId: condA.id,
    },
    select: { id: true },
  });

  const aRevisao = await prisma.atividade.create({
    data: {
      name: "Revisão Elétrica Torre A",
      type: "Inspeção",
      quantity: 1,
      model: "Checklist Elétrico",
      location: "Torre A",
      prioridade: Prioridade.MEDIO,
      frequencia: "Trimestral",
      equipe: "Equipe interna",
      tipoAtividade: "Preventiva",
      observacoes: "Levar alicate amperímetro.",
      expectedDate: addDays(7),
      tags: ["seed", "elétrica"],
      budgetStatus: BudgetStatus.SEM_ORCAMENTO,
      createdAt: addDays(-1),
      empresaId: empresa.id,
      condominioId: condA.id,
    },
    select: { id: true },
  });

  const aReparo = await prisma.atividade.create({
    data: {
      name: "Reparo Portão de Entrada",
      type: "Mecânico",
      quantity: 1,
      model: "Motor PPA DZ Rio",
      location: "Portaria",
      prioridade: Prioridade.MEDIO,
      frequencia: "Sob demanda",
      equipe: "Terceirizada",
      tipoAtividade: "Corretiva",
      observacoes: "Troca de engrenagem e relubrificação.",
      expectedDate: addDays(-6),
      tags: ["seed", "portaria"],
      budgetStatus: BudgetStatus.APROVADO,
      costEstimate: "1200.00",
      approvedBudget: "1200.00",
      createdAt: addDays(-12),
      empresaId: empresa.id,
      condominioId: condA.id,
    },
    select: { id: true },
  });

  // ===== Atividades (Condomínio B) =====
  const aHigienizacao = await prisma.atividade.create({
    data: {
      name: "Higienização Caixa d’Água",
      type: "Sanitização",
      quantity: 2,
      model: "Cloração Controlada",
      location: "Cobertura",
      prioridade: Prioridade.URGENTE,
      frequencia: "Semestral",
      equipe: "Terceirizada",
      tipoAtividade: "Preventiva",
      observacoes: "Agendar aviso aos moradores.",
      expectedDate: addDays(3),
      tags: ["seed", "água"],
      budgetStatus: BudgetStatus.APROVADO,
      costEstimate: "3000.00",
      approvedBudget: "3000.00",
      appliedStandard: "Portaria 888/2021",
      createdAt: addDays(-2),
      empresaId: empresa.id,
      condominioId: condB.id,
    },
    select: { id: true },
  });

  const aLampadas = await prisma.atividade.create({
    data: {
      name: "Troca Lâmpadas Áreas Comuns",
      type: "Iluminação",
      quantity: 35,
      model: "LED 9W 6500K",
      location: "Piscina/Jardins/Corredores",
      prioridade: Prioridade.BAIXO,
      frequencia: "Mensal",
      equipe: "Equipe interna",
      tipoAtividade: "Preventiva",
      observacoes: "Conferir reatores antigos.",
      expectedDate: addDays(1),
      tags: ["seed", "iluminação"],
      budgetStatus: BudgetStatus.SEM_ORCAMENTO,
      createdAt: addDays(-8),
      empresaId: empresa.id,
      condominioId: condB.id,
    },
    select: { id: true },
  });

  // ===== CASOS PARA NOTIFICAÇÕES =====

  // 1) DUE HOJE (recorrente sem âncora) -> sempre gera notificação "due" hoje (fallback)
  //    E histórico de HOJE = PENDENTE (não foi feita)
  const aChecklistHoje = await prisma.atividade.create({
    data: {
      name: "Checklist Diário Portaria",
      type: "Inspeção",
      quantity: 1,
      model: "Checklist Portaria",
      location: "Portaria",
      prioridade: Prioridade.MEDIO,
      // Sem âncora: NEM startAt NEM expectedDate
      frequencia: "Diária", // recorrente
      equipe: "Equipe interna",
      tipoAtividade: "Preventiva",
      observacoes: "Conferir ronda, baterias de rádio e livro de ocorrências.",
      tags: ["seed", "notificacao", "due-hoje"],
      budgetStatus: BudgetStatus.SEM_ORCAMENTO,
      createdAt: addDays(-3),
      empresaId: empresa.id,
      condominioId: condA.id,
    },
    select: { id: true },
  });

  // 2) PRÉ-ALERTA (próxima ocorrência amanhã) — útil para testes com leadDays=1
  const aPreAlerta = await prisma.atividade.create({
    data: {
      name: "Troca Extintores (pré-alerta)",
      type: "Inspeção",
      quantity: 10,
      model: "ABC 6kg",
      location: "Áreas comuns",
      prioridade: Prioridade.ALTO,
      frequencia: "Semanal", // recorrente
      expectedDate: addDays(1), // âncora amanhã
      equipe: "Terceirizada",
      tipoAtividade: "Preventiva",
      observacoes: "Checar validade e lacres.",
      tags: ["seed", "notificacao", "pre-alerta"],
      budgetStatus: BudgetStatus.PENDENTE,
      createdAt: addDays(-4),
      empresaId: empresa.id,
      condominioId: condB.id,
    },
    select: { id: true },
  });

  // 3) OVERDUE (não recorrente com start/expected no passado e não concluída)
  const aOverdue = await prisma.atividade.create({
    data: {
      name: "Gerador – Teste Único (overdue)",
      type: "Teste",
      quantity: 1,
      model: "Carga 50%",
      location: "Casa de Máquinas",
      prioridade: Prioridade.ALTO,
      frequencia: "Uma vez", // Não se repete
      expectedDate: addDays(-5), // âncora passada
      equipe: "Equipe interna",
      tipoAtividade: "Preventiva",
      observacoes: "Executar checklist de partida e estabilização.",
      tags: ["seed", "notificacao", "overdue"],
      budgetStatus: BudgetStatus.SEM_ORCAMENTO,
      createdAt: addDays(-6),
      empresaId: empresa.id,
      condominioId: condA.id,
    },
    select: { id: true },
  });

  // ===== Histórico (estado das execuções) =====
  await prisma.atividadeHistorico.createMany({
    data: [
      // “Em andamento” antigo -> pendente hoje
      {
        atividadeId: aBomba.id,
        dataReferencia: agora,
        status: HistoricoStatus.PENDENTE,
        observacoes: "Em andamento (seed)",
      },
      // “Pendente” antigo -> pendente na data prevista
      {
        atividadeId: aPintura.id,
        dataReferencia: addDays(14),
        status: HistoricoStatus.PENDENTE,
      },
      // “Próximas” antigo -> pendente para daqui a 7 dias
      {
        atividadeId: aRevisao.id,
        dataReferencia: addDays(7),
        status: HistoricoStatus.PENDENTE,
      },
      // “Histórico” antigo -> feito na data concluída
      {
        atividadeId: aReparo.id,
        dataReferencia: addDays(-5),
        status: HistoricoStatus.FEITO,
        completedAt: addDays(-5),
        observacoes: "Concluída (seed)",
      },
      // B
      {
        atividadeId: aHigienizacao.id,
        dataReferencia: addDays(3),
        status: HistoricoStatus.PENDENTE,
      },
      {
        atividadeId: aLampadas.id,
        dataReferencia: addDays(1),
        status: HistoricoStatus.PENDENTE,
      },

      // ===== Casos de notificação (estado) =====

      // 1) Due HOJE e NÃO FEITA
      //    dataReferencia em qualquer horário de hoje (TZ Fortaleza) funciona com a janela do endpoint
      {
        atividadeId: aChecklistHoje.id,
        dataReferencia: nowFortaleza(),
        status: HistoricoStatus.PENDENTE,
        observacoes: "Ainda não executada hoje (seed).",
      },
      // Ontem foi feito — só para dar histórico útil
      {
        atividadeId: aChecklistHoje.id,
        dataReferencia: startOfDay(yesterdayFortaleza()),
        status: HistoricoStatus.FEITO,
        completedAt: startOfDay(yesterdayFortaleza()),
        observacoes: "Concluída ontem (seed).",
      },

      // 2) Pré-alerta: não precisa histórico (a notificação é de futuro próximo)

      // 3) Overdue: não recorrente passado, sem completedAt => notificação "overdue"
      //    (sem histórico de FEITO para continuar atrasada)
    ],
  });

  console.log("✅ Seed pronto: inclui atividade recorrente sem âncora DUE HOJE (PENDENTE), pré-alerta e overdue.");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
