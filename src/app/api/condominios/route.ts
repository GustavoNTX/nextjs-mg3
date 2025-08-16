import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const revalidate = 0;
export const dynamic = "force-dynamic";

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

export async function GET() {
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
}

export async function POST(req: Request) {
  const empresaId = await getEmpresaIdFromRequest();
  if (!empresaId) {
    return NextResponse.json(
      { error: "ID da empresa não encontrado" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
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
      referenceId: body.referenceId ?? null,
      empresaId: empresaId ?? null,
    };
    const novo = await prisma.condominio.create({ data });
    return NextResponse.json(novo, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Erro ao criar" },
      { status: 400 }
    );
  }
}
