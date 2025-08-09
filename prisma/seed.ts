const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Administrador',
      passwordHash: '$2b$10$X8gYYZlRkls9tQZYvW1nUuDZZmA9AEXqtd9YhQ2CFJG8fZ1VZV4yG', // hash de "123456"
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
