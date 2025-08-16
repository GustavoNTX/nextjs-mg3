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
// Validação do status do cronograma
const StatusSchema = z.enum(['Próximas', 'Em andamento', 'Pendente', 'Histórico'])
// Validação do status do orçamento
const BudgetStatusSchema = z.enum(['aprovado', 'pendente', 'sem orçamento'])

// Schema para criação de cronogramas
const createBodySchema = z.object({
  title: z.string().min(1, 'title obrigatório'), // título obrigatório
  status: StatusSchema, // status obrigatório
  condominioId: z.string().uuid('condominioId deve ser UUID'), // id do condomínio deve ser UUID

  budgetStatus: BudgetStatusSchema.optional(), // status do orçamento opcional
  budget: z.preprocess(
    (v) => (v === '' || v === null ? undefined : v), // converte '' ou null em undefined
    z.union([z.number(), z.string()]).optional()
  ),
  expectedDate: z.string().datetime('expectedDate inválida'), // data esperada obrigatória
  frequency: nullable(), // frequência opcional
  team: nullable(), // equipe opcional
  appliedStandard: nullable(), // padrão aplicado opcional
  location: nullable(), // local opcional
  responsibles: nullable(), // responsáveis opcionais
  observations: nullable(), // observações opcionais
  responsibleId: z.string().uuid().optional(), // id do responsável opcional
})

// --- Funções de resposta ---
// Retorno quando a validação falha
const unprocessable = (payload: any) => NextResponse.json(payload, { status: 422 })
// Retorno quando o body é inválido
const badRequest = (payload: any) => NextResponse.json(payload, { status: 400 })
// Retorno quando ocorre erro interno
const serverError = (msg = 'Erro interno') =>
  NextResponse.json({ error: msg }, { status: 500 })

// --- GET /api/cronogramas ---
// Função para listar todos os cronogramas
export async function GET() {
  try {
    const items = await prisma.cronograma.findMany({
      include: { condominio: true }, // incluir dados do condomínio relacionado
      orderBy: { expectedDate: 'asc' }, // ordena por data esperada
    })
    return NextResponse.json(items)
  } catch (e) {
    console.error('Erro ao listar cronogramas:', e) // log do erro para debug
    return serverError('Não foi possível buscar os cronogramas.')
  }
}

// --- POST /api/cronogramas ---
// Função para criar um novo cronograma
export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json() // tenta parsear o body
  } catch {
    return badRequest({ error: 'Body inválido: JSON malformado' })
  }

  // Validar body usando Zod
  const parsed = createBodySchema.safeParse(json)
  if (!parsed.success) {
    return unprocessable({ error: 'Validação falhou', issues: parsed.error.flatten() })
  }

  // Preparar dados para o Prisma
  const b = parsed.data
  const data = {
    title: b.title,
    status: b.status,
    condominioId: b.condominioId,

    budgetStatus: b.budgetStatus ?? null,
    budget:
      b.budget === undefined
        ? null
        : new Prisma.Decimal(typeof b.budget === 'string' ? b.budget : b.budget), // converte para Decimal se necessário
    expectedDate: new Date(b.expectedDate), // converte string para Date
    frequency: b.frequency ?? null,
    team: b.team ?? null,
    appliedStandard: b.appliedStandard ?? null,
    location: b.location ?? null,
    responsibles: b.responsibles ?? null,
    observations: b.observations ?? null,
    responsibleId: b.responsibleId ?? null,
  }

  // Tentar criar registro no Prisma
  try {
    const created = await prisma.cronograma.create({ data })
    return NextResponse.json(created, { status: 201 }) // retorna item criado
  } catch (e) {
    console.error('Erro ao criar cronograma:', e) // log do erro
    return serverError('Não foi possível criar o cronograma.')
  }
}
