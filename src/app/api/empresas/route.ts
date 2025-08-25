import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().min(3).optional(),
  email: z.string().email('E-mail inválido'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, cnpj, email } = schema.parse(body)

    const empresa = await prisma.empresa.create({
      data: { name, cnpj, email },
      select: { id: true, name: true, cnpj: true, email: true, empresaToken: true, createdAt: true },
    })

    return NextResponse.json(empresa, { status: 201 })
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validação falhou', issues: err.flatten() }, { status: 422 })
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || []
      const field = target.join(', ') || 'campo único'
      return NextResponse.json({ error: `Já existe uma empresa com este ${field}.` }, { status: 409 })
    }
    console.error('Erro ao criar empresa:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
