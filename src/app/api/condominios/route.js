import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const condominios = await prisma.condominio.findMany();
  return NextResponse.json(condominios);
}

export async function POST(req) {
  const data = await req.json();
  const novo = await prisma.condominio.create({ data });
  return NextResponse.json(novo, { status: 201 });
}
