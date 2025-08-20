// prisma/seed.ts
/* eslint-disable no-console */
const {
  PrismaClient,
  AtividadeStatus,
  Prioridade,
  BudgetStatus,
  Role,
} = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // 1) Empresa (tenant) principal
  const empresaPrincipal = await prisma.empresa.upsert({
    where: { cnpj: "00.000.000/0001-00" },
    update: {},
    create: {
      name: "Empresa Matriz",
      cnpj: "00.000.000/0001-00",
    },
  });
  console.log(`🏢 Empresa "${empresaPrincipal.name}" criada/encontrada com sucesso.`);

  // 2) Usuário admin vinculado à empresa
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Administrador",
      // hash da senha "123456789"
      passwordHash: "$2b$10$b4ygrwy0x68hLVIb6tpySebA11HLSVdLs3tBYnSE8HtTAp.zTSzCi",
      role: Role.ADMIN, // <— enum
      empresa: { connect: { id: empresaPrincipal.id } },
    },
  });
  console.log(`👤 Usuário "${adminUser.name}" criado e associado à empresa "${empresaPrincipal.name}".`);

  // 3) Condomínio de exemplo
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
  });
  console.log(
    `🏙️  Condomínio "${condominioExemplo.name}" criado e associado à empresa "${empresaPrincipal.name}".`
  );

  // 4) Atividade de exemplo (agora com enums!)
  const atividadeExemplo = await prisma.atividade.create({
    data: {
      name: "Bomba de Água Piscina",
      type: "Bomba Hidráulica",
      quantity: 1,
      model: "Jacuzzi 1CV-Plus",
      location: "Casa de Máquinas da Piscina",

      // antes: status: true
      status: AtividadeStatus.EM_ANDAMENTO,

      // antes: prioridade: "Médio"
      prioridade: Prioridade.MEDIO,

      frequencia: "A cada mês",
      equipe: "Equipe interna",
      tipoAtividade: "Preventiva",
      observacoes: "Verificar ruídos e vazamentos durante a operação mensal.",

      // opcional: já definir orçamento (tem default SEM_ORCAMENTO no schema)
      budgetStatus: BudgetStatus.SEM_ORCAMENTO,

      empresa: { connect: { id: empresaPrincipal.id } },
      condominio: { connect: { id: condominioExemplo.id } },
    },
  });

  console.log(
    `🔧 Atividade "${atividadeExemplo.name}" criada e associada ao condomínio "${condominioExemplo.name}".`
  );

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
