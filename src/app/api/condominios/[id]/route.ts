// app/api/condominios/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// --- Schemas de validação e Helpers (pode ser movido para um arquivo compartilhado) ---
async function getEmpresaIdFromRequest(): Promise<string | null> {
  const headerList = await headers();
  const id = headerList.get("x-user-id");

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      empresaId: true,
    },
  });
  if (user) {
    return user.empresaId;
  }

  return "";
}

// helper para strings opcionais/aceitam '' -> null
const nullable = () =>
  z.preprocess((v) => (v === "" ? null : v), z.string().nullable().optional());

const bodySchema = z.object({
  name: z.string().min(1, "name obrigatório"),
  cnpj: nullable(),
  address: z.string().min(1, "address obrigatório"),
  neighborhood: z.string().min(1, "neighborhood obrigatório"),
  city: z.string().min(1, "city obrigatório"),
  state: z.string().min(2, "state obrigatório"),
  type: z.string().min(1, "type obrigatório"),
  imageUrl: nullable(),
  referenceId: nullable(),
});

// Funções de resposta
function unprocessable(payload: any) {
  return NextResponse.json(payload, { status: 422 });
}
function badRequest(payload: any) {
  return NextResponse.json(payload, { status: 400 });
}
function serverError(msg = "Erro interno") {
  return NextResponse.json({ error: msg }, { status: 500 });
}

// --- POST /api/condominios ---
// Função para CRIAR um novo condomínio
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return badRequest({ error: "Body inválido: JSON malformado" });
  }

  // 1. Validar o corpo da requisição com o Zod
  const parsedBody = bodySchema.safeParse(json);
  if (!parsedBody.success) {
    return unprocessable({
      error: "Validação falhou",
      issues: parsedBody.error.flatten(),
    });
  }
  const empresaId = await getEmpresaIdFromRequest();
  if (!empresaId) {
    return NextResponse.json(
      { error: "ID da empresa não encontrado" },
      { status: 401 }
    );
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
    empresaId: empresaId,
  };

  // 3. Tentar criar o registro no Prisma
  try {
    const newItem = await prisma.condominio.create({ data });
    // Retorna o item criado com status 201 (Created)
    return NextResponse.json(newItem, { status: 201 });
  } catch (e) {
    console.error("Erro ao criar condomínio:", e); // Logar o erro no servidor ajuda a debugar
    return serverError("Não foi possível criar o condomínio.");
  }
}

// (Opcional) --- GET /api/condominios ---
// Função para LISTAR todos os condomínios
export async function GET() {
  try {
    const empresaId = await getEmpresaIdFromRequest();
    if (!empresaId) {
      return NextResponse.json(
        { error: "ID da empresa não encontrado" },
        { status: 401 }
      );
    }
    const condominios = await prisma.condominio.findMany({
      where: { empresaId: empresaId },
      orderBy: { createdAt: "desc" },
      include: {
        reference: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(condominios);
  } catch (e) {
    console.error("Erro ao listar condomínios:", e);
    return serverError("Não foi possível buscar os condomínios.");
  }
}
