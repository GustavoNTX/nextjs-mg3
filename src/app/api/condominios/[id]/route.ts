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
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: nullable(),
  address: z.string().min(1, "Endereço é obrigatório"),
  neighborhood: z.string().min(1, "Bairro é obrigatório"), 
  city: z.string().min(1, "Cidade é obrigatório"),
  state: z.string().min(2, "Estado é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
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
// export async function POST(req: Request) {
//   let json: unknown;
//   try {
//     json = await req.json();
//   } catch {
//     return badRequest({ error: "Body inválido: JSON malformado" });
//   }

//   // 1. Validar o corpo da requisição com o Zod
//   const parsedBody = bodySchema.safeParse(json);
//   if (!parsedBody.success) {
//     return unprocessable({
//       error: "Validação falhou",
//       issues: parsedBody.error.flatten(),
//     });
//   }
//   const empresaId = await getEmpresaIdFromRequest();
//   if (!empresaId) {
//     return NextResponse.json(
//       { error: "ID da empresa não encontrado" },
//       { status: 401 }
//     );
//   }

//   // 2. Preparar os dados para o banco de dados
//   const data = {
//     name: parsedBody.data.name,
//     cnpj: parsedBody.data.cnpj ?? null,
//     address: parsedBody.data.address,
//     neighborhood: parsedBody.data.neighborhood,
//     city: parsedBody.data.city,
//     state: parsedBody.data.state,
//     type: parsedBody.data.type,
//     imageUrl: parsedBody.data.imageUrl ?? null,
//     referenceId: parsedBody.data.referenceId ?? null,
//     empresaId: empresaId,
//   };

//   // 3. Tentar criar o registro no Prisma
//   try {
//     const newItem = await prisma.condominio.create({ data });
//     // Retorna o item criado com status 201 (Created)
//     return NextResponse.json(newItem, { status: 201 });
//   } catch (e) {
//     console.error("Erro ao criar condomínio:", e); // Logar o erro no servidor ajuda a debugar
//     return serverError("Não foi possível criar o condomínio.");
//   }
// }

// (Opcional) --- GET /api/condominios ---
// Função para LISTAR todos os condomínios
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const empresaId = await getEmpresaIdFromRequest();
    if (!empresaId) {
      return NextResponse.json(
        { error: "ID da empresa não encontrado" },
        { status: 401 }
      );
    }

    const condominioId = params.id;

    const condominios = await prisma.condominio.findMany({
      where: {
        id: condominioId,
        empresaId: empresaId,
      },
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

// --- Rota PUT: Atualizar um condomínio ---
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const empresaId = await getEmpresaIdFromRequest();
  const condominioId = params.id;

  if (!empresaId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON malformado" }, { status: 400 });
  }

  const parsedBody = bodySchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Validação falhou", issues: parsedBody.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const data = parsedBody.data;

    // A mágica da segurança está aqui: a cláusula 'where' exige que o
    // 'id' do condomínio E o 'empresaId' do usuário correspondam.
    const result = await prisma.condominio.updateMany({
      where: {
        id: condominioId,
        empresaId: empresaId,
      },
      data: {
        name: data.name,
        cnpj: data.cnpj,
        address: data.address,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        type: data.type,
        imageUrl: data.imageUrl,
        referenceId: data.referenceId,
      },
    });

    // Se nenhum registro foi atualizado, significa que o condomínio não existe ou não pertence a esta empresa.
    if (result.count === 0) {
      return NextResponse.json(
        { error: "Condomínio não encontrado ou não pertence à sua empresa." },
        { status: 404 }
      );
    }

    // Retorna o condomínio atualizado para o frontend
    const updatedCondominio = await prisma.condominio.findUnique({
      where: { id: condominioId },
    });
    return NextResponse.json(updatedCondominio);
  } catch (e) {
    console.error("Erro ao atualizar condomínio:", e);
    return NextResponse.json(
      { error: "Não foi possível atualizar o condomínio." },
      { status: 500 }
    );
  }
}

// --- Rota DELETE: Deletar um condomínio ---
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const empresaId = await getEmpresaIdFromRequest();
  const condominioId = params.id;

  if (!empresaId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // Mesma lógica de segurança do PUT: só deleta se o 'id' e o 'empresaId' baterem.
    const result = await prisma.condominio.deleteMany({
      where: {
        id: condominioId,
        empresaId: empresaId,
      },
    });

    // Se nada foi deletado, o item não existia ou o usuário não tinha permissão.
    if (result.count === 0) {
      return NextResponse.json(
        { error: "Condomínio não encontrado ou não pertence à sua empresa." },
        { status: 404 }
      );
    }

    // Retorna uma resposta de sucesso sem corpo, que é o padrão para DELETE.
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("Erro ao deletar condomínio:", e);
    return NextResponse.json(
      { error: "Não foi possível deletar o condomínio." },
      { status: 500 }
    );
  }
}
