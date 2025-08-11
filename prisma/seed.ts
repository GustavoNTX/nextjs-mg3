const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Administrador',
      passwordHash: '$2b$10$b4ygrwy0x68hLVIb6tpySebA11HLSVdLs3tBYnSE8HtTAp.zTSzCi', // hash de "123456789"
      role: 'ADMIN',
    },
  })

  console.log('✅ Seed executado com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
