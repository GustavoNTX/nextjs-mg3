import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

/** ATENÇÃO: valida apenas decodificação do JWT. Em produção, valide a assinatura. */
async function getEmpresaIdFromRequest(): Promise<string | null> {
  const h = await headers();

  const userId = h.get("x-user-id") ?? undefined;
  if (userId) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { empresaId: true } });
    if (u?.empresaId) return u.empresaId;
  }

  const auth = h.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const [, payloadB64] = token.split(".");
      if (payloadB64) {
        const b64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
        const json = Buffer.from(b64, "base64").toString("utf8");
        const payload = JSON.parse(json);
        const sub = payload?.sub as string | undefined;
        const email = payload?.email as string | undefined;

        if (sub) {
          const u = await prisma.user.findUnique({ where: { id: sub }, select: { empresaId: true } });
          if (u?.empresaId) return u.empresaId;
        }
        if (email) {
          const u = await prisma.user.findUnique({ where: { email }, select: { empresaId: true } });
          if (u?.empresaId) return u.empresaId;
        }
      }
    } catch {
      // silencioso
    }
  }
  return null;
}

export async function GET(_req: NextRequest) {
  try {
    const empresaId = await getEmpresaIdFromRequest();
    if (!empresaId) return json(401, { error: "Não autorizado" });

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true, name: true, cnpj: true, email: true, createdAt: true },
    });
    if (!empresa) return json(404, { error: "Empresa não encontrada" });

    return NextResponse.json({ empresaId, empresa });
  } catch (e) {
    console.error("empresas/minha GET error:", e);
    return json(500, { error: "Erro interno" });
  }
}
