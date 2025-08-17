// app/api/condominios/[id]/route.ts
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'

export const revalidate = 0
export const dynamic = 'force-dynamic'

// --- Schemas de validação e Helpers ---
async function getEmpresaIdFromRequest(): Promise<string | null> {
  // Next 15: headers() é assíncrono
  const headerList = await headers()
  const id = headerList.get('x-user-id') || undefined

  if (!id) return null

  const user = await prisma.user.findUnique({
    where: { id },
    select: { empresaId: true },
  })

  return user?.empresaId ?? null
}

// helper para strings opcionais/aceitam '' -> null
const nullable = () =>
  z.preprocess((v) => (v === '' ? null : v), z.string().nullable().optional())

const bodySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cnpj: nullable(),
  address: z.string().min(1, 'Endereço é obrigatório'),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatório'),
  state: z.string().min(2, 'Estado é obrigatório'),
  type: z.string().min(1, 'Tipo é obrigatório'),
  imageUrl: nullable(),
  referenceId: nullable(),
})

// Funções de resposta
function unprocessable(payload: any) {
  return NextResponse.json(payload, { status: 422 })
}
function badRequest(payload: any) {
  return NextResponse.json(payload, { status: 400 })
}
function serverError(msg = 'Erro interno') {
  return NextResponse.json({ error: msg }, { status: 500 })
}

// --- GET /api/condominios/[id] ---
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // ✅ Next 15: params como Promise
) {
  try {
    const empresaId = await getEmpresaIdFromRequest()
    if (!empresaId) {
      return NextResponse.json({ error: 'ID da empresa não encontrado' }, { status: 401 })
    }

    const { id: condominioId } = await ctx.params

    const condominios = await prisma.condominio.findMany({
      where: { id: condominioId, empresaId },
      orderBy: { createdAt: 'desc' },
      include: { reference: { select: { id: true, name: true } } },
    })

    return NextResponse.json(condominios)
  } catch (e) {
    console.error('Erro ao listar condomínios:', e)
    return serverError('Não foi possível buscar os condomínios.')
  }
}

// --- PUT /api/condominios/[id] ---
export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // ✅ Promise
) {
  const empresaId = await getEmpresaIdFromRequest()
  if (!empresaId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id: condominioId } = await ctx.params

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return badRequest({ error: 'JSON malformado' })
  }

  const parsedBody = bodySchema.safeParse(json)
  if (!parsedBody.success) {
    return unprocessable({ error: 'Validação falhou', issues: parsedBody.error.flatten() })
  }

  try {
    const data = parsedBody.data

    const result = await prisma.condominio.updateMany({
      where: { id: condominioId, empresaId },
      data: {
        name: data.name,
        cnpj: data.cnpj ?? null,
        address: data.address,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        type: data.type,
        imageUrl: data.imageUrl ?? null,
        referenceId: data.referenceId ?? null,
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Condomínio não encontrado ou não pertence à sua empresa.' },
        { status: 404 }
      )
    }

    const updatedCondominio = await prisma.condominio.findUnique({
      where: { id: condominioId },
    })
    return NextResponse.json(updatedCondominio)
  } catch (e) {
    console.error('Erro ao atualizar condomínio:', e)
    return serverError('Não foi possível atualizar o condomínio.')
  }
}

// --- DELETE /api/condominios/[id] ---
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // ✅ Promise
) {
  const empresaId = await getEmpresaIdFromRequest()
  if (!empresaId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id: condominioId } = await ctx.params

  try {
    const result = await prisma.condominio.deleteMany({
      where: { id: condominioId, empresaId },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Condomínio não encontrado ou não pertence à sua empresa.' },
        { status: 404 }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error('Erro ao deletar condomínio:', e)
    return serverError('Não foi possível deletar o condomínio.')
  }
}

/* --- (Opcional) POST para criar ficaria no /api/condominios (sem [id]) ---
export async function POST(req: Request) { ... }
*/
