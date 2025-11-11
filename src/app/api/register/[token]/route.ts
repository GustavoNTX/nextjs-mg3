import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'

const bodySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type RouteParams = { token: string }

export async function POST(
  req: Request,
  context: { params: Promise<RouteParams> }
) {
  try {
    const { token } = await context.params

    const tokenSchema = z.string().uuid('Token de empresa inválido')
    const empresaToken = tokenSchema.parse(token)

    const { name, email, password } = bodySchema.parse(await req.json())

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está em uso' },
        { status: 409 },
      )
    }

    const empresa = await prisma.empresa.findUnique({
      where: { empresaToken },
      select: { id: true },
    })
    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa não encontrada para esse token' },
        { status: 404 },
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        empresa: { connect: { id: empresa.id } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        empresaId: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validação falhou', issues: err.flatten() },
        { status: 422 },
      )
    }
    console.error('Erro no registro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
