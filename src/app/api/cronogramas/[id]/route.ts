import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const revalidate = 0
export const dynamic = 'force-dynamic'

// --- Helpers ---
// Função para campos opcionais que aceitam '' como null
const nullable = () =>
  z.preprocess((v) => (v === '' ? null : v), z.string().optional().nullable())

// --- Schemas de validação ---
// Validação de status do cronograma
const StatusSchema = z.enum(['Próximas', 'Em andamento', 'Pendente', 'Histórico'])
// Validação do status do orçamento
const BudgetStatusSchema = z.enum(['aprovado', 'pendente', 'sem orçamento'])

// Schema para atualização de cronogramas
const updateBodySchema = z.object({
  title: z.string().min(1).optional(), // título opcional
  status: StatusSchema.optional(), // status opcional
  condominioId: z.string().uuid().optional(), // id do condomínio opcional

  budgetStatus: BudgetStatusSchema.optional().nullable(), // status orçamento opcional
  budget: z
    .preprocess(
      (v) => (v === '' ? null : v), // '' vira null
      z.union([z.number(), z.string()]).nullable().optional()
    )
    .optional(),
  expectedDate: z.string().datetime().optional(), // data esperada opcional
  frequency: nullable(), // frequência opcional
  team: nullable(), // equipe opcional
  appliedStandard: nullable(), // padrão aplicado opcional
  location: nullable(), // local opcional
  responsibles: nullable(), // responsáveis opcionais
  observations: nullable(), // observações opcionais
  responsibleId: z.string().uuid().optional().nullable(), // id do responsável opcional
})

// --- Funções de resposta ---
// Cronograma não encontrado
const notFound = () => NextResponse.json({ error: 'Cronograma não encontrado' }, { status: 404 })
// Validação falhou
const unprocessable = (payload: any) => NextResponse.json(payload, { status: 422 })
// Body inválido
const badRequest = (payload: any) => NextResponse.json(payload, { status: 400 })
// Erro interno
const serverError = (msg = 'Erro interno') =>
  NextResponse.json({ error: msg }, { status: 500 })

// Contexto esperado pelo Next.js 15
type Ctx = { params: Promise<{ id: string }> } // id vem como Promise<string>

// --- GET /api/cronogramas/[id] ---
// Buscar cronograma por ID
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params // extrai o id
  if (!id) return badRequest({ error: 'ID não informado' })

  try {
    const item = await prisma.cronograma.findUnique({
      where: { id }, // busca pelo id
      include: { condominio: true }, // inclui dados do condomínio
    })
    if (!item) return notFound() // retorna 404 se não achar
    return NextResponse.json(item)
  } catch (e) {
    console.error('Erro ao buscar cronograma:', e)
    return serverError()
  }
}

// --- PUT /api/cronogramas/[id] ---
// Atualizar cronograma por ID
export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  if (!id) return badRequest({ error: 'ID não informado' })

  let json: unknown
  try {
    json = await req.json() // parse do body
  } catch {
    return badRequest({ error: 'Body inválido: JSON malformado' })
  }

  // Validar body
  const parsed = updateBodySchema.safeParse(json)
  if (!parsed.success) {
    return unprocessable({ error: 'Validação falhou', issues: parsed.error.flatten() })
  }

  const b = parsed.data
  // Montar objeto para atualização apenas com campos definidos
  const data: any = {
    ...(b.title !== undefined ? { title: b.title } : {}),
    ...(b.status !== undefined ? { status: b.status } : {}),
    ...(b.condominioId !== undefined ? { condominioId: b.condominioId } : {}),
    ...(b.budgetStatus !== undefined ? { budgetStatus: b.budgetStatus } : {}),
    ...(b.frequency !== undefined ? { frequency: b.frequency } : {}),
    ...(b.team !== undefined ? { team: b.team } : {}),
    ...(b.appliedStandard !== undefined ? { appliedStandard: b.appliedStandard } : {}),
    ...(b.location !== undefined ? { location: b.location } : {}),
    ...(b.responsibles !== undefined ? { responsibles: b.responsibles } : {}),
    ...(b.observations !== undefined ? { observations: b.observations } : {}),
    ...(b.responsibleId !== undefined ? { responsibleId: b.responsibleId } : {}),
  }

  // Converter expectedDate e budget se existirem
  if (b.expectedDate !== undefined) {
    data.expectedDate = new Date(b.expectedDate)
  }
  if (b.budget !== undefined) {
    data.budget =
      b.budget === null
        ? null
        : new Prisma.Decimal(typeof b.budget === 'string' ? b.budget : b.budget)
  }

  try {
    const updated = await prisma.cronograma.update({
      where: { id }, // atualizar pelo id
      data, // dados a serem atualizados
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('Erro ao atualizar cronograma:', e)
    return serverError('Não foi possível atualizar o cronograma.')
  }
}

// --- DELETE /api/cronogramas/[id] ---
// Deletar cronograma por ID
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  if (!id) return badRequest({ error: 'ID não informado' })

  try {
    await prisma.cronograma.delete({ where: { id } }) // deletar pelo id
    return NextResponse.json({ success: true }) // retorna sucesso
  } catch (e) {
    console.error('Erro ao deletar cronograma:', e)
    return serverError('Não foi possível deletar o cronograma.')
  }
}
