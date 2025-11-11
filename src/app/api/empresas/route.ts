import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().min(3).optional(),
  email: z.string().email('E-mail inválido'),
})

// POST: cria empresa (já existe)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, cnpj, email } = schema.parse(body)

    const empresa = await prisma.empresa.create({
      data: { name, cnpj, email },
      select: {
        id: true,
        name: true,
        cnpj: true,
        email: true,
        empresaToken: true,
        createdAt: true,
      },
    })

    return NextResponse.json(empresa, { status: 201 })
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validação falhou', issues: err.flatten() },
        { status: 422 }
      )
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      const target = (err.meta?.target as string[]) || []
      const field = target.join(', ') || 'campo único'
      return NextResponse.json(
        { error: `Já existe uma empresa com este ${field}.` },
        { status: 409 }
      )
    }
    console.error('Erro ao criar empresa:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET: retorna só dados necessários pro cadastro, a partir do token
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'Token da empresa é obrigatório' },
      { status: 400 }
    )
  }

  const tokenSchema = z.string().uuid('Token de empresa inválido')

  try {
    const empresaToken = tokenSchema.parse(token)

    const empresa = await prisma.empresa.findUnique({
      where: { empresaToken },
      select: {
        id: true,
        name: true,          // só o que precisa pra exibir no topo
        // se quiser algo a mais, adiciona aqui
        // ex: empresaToken: true,
      },
    })

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa não encontrada para esse token' },
        { status: 404 }
      )
    }

    return NextResponse.json(empresa, { status: 200 })
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Token de empresa inválido' },
        { status: 422 }
      )
    }
    console.error('Erro ao buscar empresa por token:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
