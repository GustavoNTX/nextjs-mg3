// prisma/seed.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // 1. Criar (ou encontrar) a Empresa (Tenant) principal.
  // O usuário administrador precisa pertencer a uma empresa.
  // Usamos 'upsert' com um campo único (CNPJ) para evitar duplicatas ao rodar o seed várias vezes.
  const empresaPrincipal = await prisma.empresa.upsert({
    where: { cnpj: '00.000.000/0001-00' },
    update: {},
    create: {
      name: 'Empresa Matriz',
      cnpj: '00.000.000/0001-00',
    },
  })

  console.log(`🏢 Empresa "${empresaPrincipal.name}" criada/encontrada com sucesso.`)

  // 2. Criar o Usuário Administrador e associá-lo à Empresa principal.
  // Na cláusula 'create', usamos 'connect' para vincular este novo usuário
  // ao ID da empresa que acabamos de criar.
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Administrador',
      // hash gerado para a senha "123456789"
      passwordHash: '$2b$10$b4ygrwy0x68hLVIb6tpySebA11HLSVdLs3tBYnSE8HtTAp.zTSzCi',
      role: 'ADMIN',
      empresa: {
        connect: {
          id: empresaPrincipal.id,
        },
      },
    },
  })

  console.log(`👤 Usuário "${adminUser.name}" criado e associado à empresa "${empresaPrincipal.name}".`)

  // (Opcional, mas recomendado) 3. Criar um Condomínio de exemplo para essa empresa.
  const condominioExemplo = await prisma.condominio.upsert({
    where: { cnpj: '11.111.111/0001-11' }, // Usamos o CNPJ para o 'upsert'
    update: {},
    create: {
        name: 'Condomínio Central',
        cnpj: '11.111.111/0001-11',
        address: 'Avenida Bezerra de Menezes, 1000',
        neighborhood: 'Centro',
        city: 'Fortaleza',
        state: 'CE',
        type: 'Residencial',
        empresa: {
            connect: {
                id: empresaPrincipal.id
            }
        }
    }
  });

  console.log(`🏙️  Condomínio "${condominioExemplo.name}" criado e associado à empresa "${empresaPrincipal.name}".`)


  console.log('\n✅ Seed executado com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    // Garante que a conexão com o banco seja fechada.
    await prisma.$disconnect()
  })