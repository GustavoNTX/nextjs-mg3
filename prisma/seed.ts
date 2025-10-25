// prisma/seed.ts (CommonJS)
const {
  PrismaClient,
  Prioridade,
  BudgetStatus,
  HistoricoStatus,
  Role,
} = require("@prisma/client");

const prisma = new PrismaClient();

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
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
    ],
  });

  console.log("✅ Seed pronto.");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
