// app/api/condominios/[id]/route.ts
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

// (opcional) se quiser tratar P2025 com tipo:
import { Prisma } from '@prisma/client'

export const revalidate = 0
export const dynamic = 'force-dynamic'

// --- Tipos do contexto (Next 15: params é Promise) ---
type Ctx<T> = { params: Promise<T> }

// --- Schemas de validação ---
const idSchema = z.object({
  id: z.string().min(1, 'id obrigatório'),
})

// helper para strings opcionais/aceitam '' -> null
const nullable = () =>
  z.preprocess(
    (v) => (v === '' ? null : v),
    z.string().nullable().optional()
  )

const bodySchema = z.object({
  name: z.string().min(1, 'name obrigatório'),
  cnpj: nullable(),            // aceita string, null, undefined e '' (vira null)
  address: z.string().min(1, 'address obrigatório'),
  neighborhood: z.string().min(1, 'neighborhood obrigatório'),
  city: z.string().min(1, 'city obrigatório'),
  state: z.string().min(2, 'state obrigatório'),
  type: z.string().min(1, 'type obrigatório'),
  imageUrl: nullable(),        // se quiser forçar URL válida, troque por z.string().url() | null
  referenceId: nullable(),
})

// --- Helpers ---
function badRequest(payload: any) {
  return NextResponse.json(payload, { status: 400 })
}
function unprocessable(payload: any) {
  return NextResponse.json(payload, { status: 422 })
}
function notFound(msg = 'Não encontrado') {
  return NextResponse.json({ error: msg }, { status: 404 })
}
function serverError(msg = 'Erro interno') {
  return NextResponse.json({ error: msg }, { status: 500 })
}

// --- GET /api/condominios/[id] ---
export async function GET(_req: Request, ctx: Ctx<{ id: string }>) {
  const parsedParams = idSchema.safeParse(await ctx.params)
  if (!parsedParams.success) {
    return badRequest({ error: 'Parâmetros inválidos', issues: parsedParams.error.flatten() })
  }
  const { id } = parsedParams.data

  try {
    const item = await prisma.condominio.findUnique({
      where: { id },
      include: { reference: { select: { id: true, name: true } } },
    })
    if (!item) return notFound()
    return NextResponse.json(item)
  } catch {
    return serverError()
  }
}

// --- PUT /api/condominios/[id] ---
export async function PUT(req: Request, ctx: Ctx<{ id: string }>) {
  const parsedParams = idSchema.safeParse(await ctx.params)
  if (!parsedParams.success) {
    return badRequest({ error: 'Parâmetros inválidos', issues: parsedParams.error.flatten() })
  }
  const { id } = parsedParams.data

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return badRequest({ error: 'Body inválido: JSON malformado' })
  }

  const parsedBody = bodySchema.safeParse(json)
  if (!parsedBody.success) {
    return unprocessable({ error: 'Validação falhou', issues: parsedBody.error.flatten() })
  }

  const data = {
    name: parsedBody.data.name,
    cnpj: parsedBody.data.cnpj ?? null,
    address: parsedBody.data.address,
    neighborhood: parsedBody.data.neighborhood,
    city: parsedBody.data.city,
    state: parsedBody.data.state,
    type: parsedBody.data.type,
    imageUrl: parsedBody.data.imageUrl ?? null,
    referenceId: parsedBody.data.referenceId ?? null,
  }

  try {
    const upd = await prisma.condominio.update({ where: { id }, data })
    return NextResponse.json(upd)
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
      // registro não encontrado para update
      return notFound()
    }
    return serverError()
  }
}

// --- DELETE /api/condominios/[id] ---
export async function DELETE(_req: Request, ctx: Ctx<{ id: string }>) {
  const parsedParams = idSchema.safeParse(await ctx.params)
  if (!parsedParams.success) {
    return badRequest({ error: 'Parâmetros inválidos', issues: parsedParams.error.flatten() })
  }
  const { id } = parsedParams.data

  try {
    await prisma.condominio.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
      return notFound()
    }
    return serverError()
  }
}
