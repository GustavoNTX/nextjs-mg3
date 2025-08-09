// app/api/condominios/route.ts
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const revalidate = 0
export const dynamic = 'force-dynamic'

// --- Schemas de validação e Helpers (pode ser movido para um arquivo compartilhado) ---

// helper para strings opcionais/aceitam '' -> null
const nullable = () =>
  z.preprocess(
    (v) => (v === '' ? null : v),
    z.string().nullable().optional()
  )

const bodySchema = z.object({
  name: z.string().min(1, 'name obrigatório'),
  cnpj: nullable(),
  address: z.string().min(1, 'address obrigatório'),
  neighborhood: z.string().min(1, 'neighborhood obrigatório'),
  city: z.string().min(1, 'city obrigatório'),
  state: z.string().min(2, 'state obrigatório'),
  type: z.string().min(1, 'type obrigatório'),
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


// --- POST /api/condominios ---
// Função para CRIAR um novo condomínio
export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return badRequest({ error: 'Body inválido: JSON malformado' })
  }

  // 1. Validar o corpo da requisição com o Zod
  const parsedBody = bodySchema.safeParse(json)
  if (!parsedBody.success) {
    return unprocessable({ error: 'Validação falhou', issues: parsedBody.error.flatten() })
  }

  // 2. Preparar os dados para o banco de dados
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

  // 3. Tentar criar o registro no Prisma
  try {
    const newItem = await prisma.condominio.create({ data })
    // Retorna o item criado com status 201 (Created)
    return NextResponse.json(newItem, { status: 201 }) 
  } catch (e) {
    console.error('Erro ao criar condomínio:', e) // Logar o erro no servidor ajuda a debugar
    return serverError('Não foi possível criar o condomínio.')
  }
}

// (Opcional) --- GET /api/condominios ---
// Função para LISTAR todos os condomínios
export async function GET() {
    try {
        const items = await prisma.condominio.findMany({
            orderBy: {
                name: 'asc'
            }
        });
        return NextResponse.json(items);
    } catch (e) {
        console.error('Erro ao listar condomínios:', e)
        return serverError('Não foi possível buscar os condomínios.')
    }
}