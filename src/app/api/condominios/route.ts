import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET() {
  const condominios = await prisma.condominio.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      reference: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json(condominios)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Mapeie apenas campos permitidos
    const data = {
      name: body.name,
      cnpj: body.cnpj ?? null,
      address: body.address,
      neighborhood: body.neighborhood,
      city: body.city,
      state: body.state,
      type: body.type,
      imageUrl: body.imageUrl ?? null,
      referenceId: body.referenceId ?? null, // <- use referenceId no form
    }
    const novo = await prisma.condominio.create({ data })
    return NextResponse.json(novo, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao criar' }, { status: 400 })
  }
}
