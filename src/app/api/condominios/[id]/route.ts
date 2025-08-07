import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const revalidate = 0
export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const { id } = params
  const item = await prisma.condominio.findUnique({
    where: { id },
    include: { reference: { select: { id: true, name: true } } },
  })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = params
  const body = await req.json()
  const data = {
    name: body.name,
    cnpj: body.cnpj ?? null,
    address: body.address,
    neighborhood: body.neighborhood,
    city: body.city,
    state: body.state,
    type: body.type,
    imageUrl: body.imageUrl ?? null,
    referenceId: body.referenceId ?? null,
  }
  const upd = await prisma.condominio.update({ where: { id }, data })
  return NextResponse.json(upd)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = params
  await prisma.condominio.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
