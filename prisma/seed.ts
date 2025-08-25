// prisma/seed.ts (CommonJS)
const {
  PrismaClient,
  AtividadeStatus,
  Prioridade,
  BudgetStatus,
  Role,
} = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Empresa principal — upsert por EMAIL (único)
  const empresaPrincipal = await prisma.empresa.upsert({
    where: { email: "contato@matriz.com.br" }, // 👈 chave única existente no schema
    update: {},
    create: {
      name: "Empresa Matriz",
      email: "contato@matriz.com.br",          // 👈 obrigatório
      cnpj: "00.000.000/0001-00",              // opcional no schema
    },
    select: { id: true, name: true, email: true, cnpj: true, empresaToken: true },
  });
  console.log(`🏢 Empresa "${empresaPrincipal.name}" pronta.`);
  console.log(`🔐 Token da empresa: ${empresaPrincipal.empresaToken}`);

  // Usuário admin
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Administrador",
      // hash da senha "123456789"
      passwordHash: "$2b$10$b4ygrwy0x68hLVIb6tpySebA11HLSVdLs3tBYnSE8HtTAp.zTSzCi",
      role: Role.ADMIN,
      empresa: { connect: { id: empresaPrincipal.id } },
    },
    select: { id: true, email: true, name: true },
  });
  console.log(`👤 Admin "${adminUser.name}" criado/atualizado.`);

  // Condomínio de exemplo
  const condominioExemplo = await prisma.condominio.upsert({
    where: { cnpj: "11.111.111/0001-11" },
    update: {},
    create: {
      name: "Condomínio Central",
      cnpj: "11.111.111/0001-11",
      address: "Avenida Bezerra de Menezes, 1000",
      neighborhood: "Centro",
      city: "Fortaleza",
      state: "CE",
      type: "Residencial",
      empresa: { connect: { id: empresaPrincipal.id } },
    },
    select: { id: true, name: true },
  });
  console.log(`🏙️  Condomínio "${condominioExemplo.name}" ok.`);

  // Atividade de exemplo
  const atividadeExemplo = await prisma.atividade.create({
    data: {
      name: "Bomba de Água Piscina",
      type: "Bomba Hidráulica",
      quantity: 1,
      model: "Jacuzzi 1CV-Plus",
      location: "Casa de Máquinas da Piscina",
      status: AtividadeStatus.EM_ANDAMENTO,
      prioridade: Prioridade.MEDIO,
      frequencia: "A cada mês",
      equipe: "Equipe interna",
      tipoAtividade: "Preventiva",
      observacoes: "Verificar ruídos e vazamentos durante a operação mensal.",
      budgetStatus: BudgetStatus.SEM_ORCAMENTO,
      empresa: { connect: { id: empresaPrincipal.id } },
      condominio: { connect: { id: condominioExemplo.id } },
    },
    select: { id: true, name: true },
  });
  console.log(`🔧 Atividade "${atividadeExemplo.name}" criada.`);

  console.log("\n✅ Seed executado com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
