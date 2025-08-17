// src/app/api/register/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  // ⚠️ empresaId obrigatório porque a relação é required no schema
  empresaId: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, empresaId } = schema.parse(body)

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Este e-mail já está em uso' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        // ✅ satisfaça a relação obrigatória
        empresa: { connect: { id: empresaId } },
      },
      // evite devolver o hash
      select: { id: true, name: true, email: true, empresaId: true, createdAt: true },
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validação falhou', issues: error.flatten() }, { status: 422 })
    }
    console.error('Erro no registro:', error)
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor' }, { status: 500 })
  }
}
