// src/app/api/register/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createHash } from 'crypto'

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    // 1. Validação básica dos campos
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
    }

    // 2. Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Este e-mail já está em uso' }, { status: 409 }) // 409 Conflict
    }

    // 3. Criptografar a senha (usando o mesmo método do login para consistência)
    const passwordHash = createHash('sha256').update(password).digest('hex')

    // 4. Criar o novo usuário no banco
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    })

    // 5. Retornar o usuário criado (sem a senha)
    const { passwordHash: _, ...userWithoutPassword } = newUser
    return NextResponse.json(userWithoutPassword, { status: 201 }) // 201 Created

  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor' }, { status: 500 })
  }
}