// prisma/seed.ts (CommonJS)
const {
  PrismaClient,
  AtividadeStatus,
  Prioridade,
  BudgetStatus,
  Role,
} = require("@prisma/client");

const prisma = new PrismaClient();

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
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

  // Limpa atividades antigas do seed (idempotente)
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

  const agora = new Date();

  // ===== Atividades (Condomínio A) =====
  await prisma.atividade.createMany({
    data: [
      {
        // EM_ANDAMENTO
        name: "Bomba de Água Piscina",
        type: "Bomba Hidráulica",
        quantity: 1,
        model: "Jacuzzi 1CV-Plus",
        location: "Casa de Máquinas da Piscina",
        photoUrl: null,
        status: AtividadeStatus.EM_ANDAMENTO,
        prioridade: Prioridade.MEDIO,
        frequencia: "A cada mês",
        equipe: "Equipe interna",
        tipoAtividade: "Preventiva",
        observacoes: "Verificar ruídos e vazamentos.",
        expectedDate: addDays(3), // prazo em 3 dias
        startAt: addDays(-2),
        endAt: null,
        completedAt: null,
        tags: ["seed", "hidráulica"],
        budgetStatus: BudgetStatus.SEM_ORCAMENTO,
        costEstimate: null,
        approvedBudget: null,
        appliedStandard: "NR-13",
        deletedAt: null,
        createdAt: addDays(-10),
        updatedAt: agora,
        empresaId: empresa.id,
        condominioId: condA.id,
      },
      {
        // PENDENTE
        name: "Pintura Garagem",
        type: "Pintura",
        quantity: 120,
        model: "Tinta Epóxi",
        location: "Garagem Subsolo",
        photoUrl: null,
        status: AtividadeStatus.PENDENTE,
        prioridade: Prioridade.ALTO,
        frequencia: "Uma vez",
        equipe: "Terceirizada",
        tipoAtividade: "Corretiva",
        observacoes: "Delimitar vagas após pintura.",
        expectedDate: addDays(14),
        startAt: null,
        endAt: null,
        completedAt: null,
        tags: ["seed", "civil"],
        budgetStatus: BudgetStatus.PENDENTE,
        costEstimate: "8500.00",
        approvedBudget: null,
        appliedStandard: "ABNT NBR 13245",
        deletedAt: null,
        createdAt: addDays(-5),
        updatedAt: agora,
        empresaId: empresa.id,
        condominioId: condA.id,
      },
      {
        // PROXIMAS
        name: "Revisão Elétrica Torre A",
        type: "Inspeção",
        quantity: 1,
        model: "Checklist Elétrico",
        location: "Torre A",
        photoUrl: null,
        status: AtividadeStatus.PROXIMAS,
        prioridade: Prioridade.MEDIO,
        frequencia: "Trimestral",
        equipe: "Equipe interna",
        tipoAtividade: "Preventiva",
        observacoes: "Levar alicate amperímetro.",
        expectedDate: addDays(7),
        startAt: null,
        endAt: null,
        completedAt: null,
        tags: ["seed", "elétrica"],
        budgetStatus: BudgetStatus.SEM_ORCAMENTO,
        costEstimate: null,
        approvedBudget: null,
        appliedStandard: "NR-10",
        deletedAt: null,
        createdAt: addDays(-1),
        updatedAt: agora,
        empresaId: empresa.id,
        condominioId: condA.id,
      },
      {
        // HISTORICO
        name: "Reparo Portão de Entrada",
        type: "Mecânico",
        quantity: 1,
        model: "Motor PPA DZ Rio",
        location: "Portaria",
        photoUrl: null,
        status: AtividadeStatus.HISTORICO,
        prioridade: Prioridade.MEDIO,
        frequencia: "Sob demanda",
        equipe: "Terceirizada",
        tipoAtividade: "Corretiva",
        observacoes: "Troca de engrenagem e relubrificação.",
        expectedDate: addDays(-6),
        startAt: addDays(-6),
        endAt: addDays(-5),
        completedAt: addDays(-5),
        tags: ["seed", "portaria"],
        budgetStatus: BudgetStatus.APROVADO,
        costEstimate: "1200.00",
        approvedBudget: "1200.00",
        appliedStandard: null,
        deletedAt: null,
        createdAt: addDays(-12),
        updatedAt: agora,
        empresaId: empresa.id,
        condominioId: condA.id,
      },
    ],
  });

  // ===== Atividades (Condomínio B) =====
  await prisma.atividade.createMany({
    data: [
      {
        name: "Higienização Caixa d’Água",
        type: "Sanitização",
        quantity: 2,
        model: "Cloração Controlada",
        location: "Cobertura",
        photoUrl: null,
        status: AtividadeStatus.PROXIMAS,
        prioridade: Prioridade.URGENTE,
        frequencia: "Semestral",
        equipe: "Terceirizada",
        tipoAtividade: "Preventiva",
        observacoes: "Agendar aviso aos moradores.",
        expectedDate: addDays(3),
        startAt: null,
        endAt: null,
        completedAt: null,
        tags: ["seed", "água"],
        budgetStatus: BudgetStatus.APROVADO,
        costEstimate: "3000.00",
        approvedBudget: "3000.00",
        appliedStandard: "Portaria 888/2021",
        deletedAt: null,
        createdAt: addDays(-2),
        updatedAt: agora,
        empresaId: empresa.id,
        condominioId: condB.id,
      },
      {
        name: "Troca Lâmpadas Áreas Comuns",
        type: "Iluminação",
        quantity: 35,
        model: "LED 9W 6500K",
        location: "Piscina/Jardins/Corredores",
        photoUrl: null,
        status: AtividadeStatus.EM_ANDAMENTO,
        prioridade: Prioridade.BAIXO,
        frequencia: "Mensal",
        equipe: "Equipe interna",
        tipoAtividade: "Preventiva",
        observacoes: "Conferir reatores antigos.",
        expectedDate: addDays(1),
        startAt: addDays(-1),
        endAt: null,
        completedAt: null,
        tags: ["seed", "iluminação"],
        budgetStatus: BudgetStatus.SEM_ORCAMENTO,
        costEstimate: null,
        approvedBudget: null,
        appliedStandard: null,
        deletedAt: null,
        createdAt: addDays(-8),
        updatedAt: agora,
        empresaId: empresa.id,
        condominioId: condB.id,
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
