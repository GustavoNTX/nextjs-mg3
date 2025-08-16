import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/tokens";
import crypto from "node:crypto";

const prisma = new PrismaClient(); // ideal: use singleton compartilhado

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    // 1) pegar do cookie
    let refreshToken = cookieStore.get("refreshToken")?.value;

    // 2) fallback: pegar do body (ex.: mobile sem cookie)
    if (!refreshToken) {
      try {
        const body = await req.json();
        if (typeof body?.refreshToken === "string") refreshToken = body.refreshToken;
      } catch {
        /* sem body */
      }
    }

    if (!refreshToken) {
      const res = NextResponse.json({ error: "Refresh token requerido" }, { status: 401 });
      // garante limpeza local se veio cookie vazio/corrompido
      res.cookies.delete("refreshToken");
      return res;
    }

    // verificar assinatura/expiração
    let payload: any;
    try {
      ({ payload } = await verifyRefreshToken(refreshToken));
    } catch {
      const res = NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 });
      res.cookies.delete("refreshToken");
      return res;
    }

    const userId = payload?.sub ? String(payload.sub) : undefined;
    if (!userId) {
      const res = NextResponse.json({ error: "Token inválido" }, { status: 401 });
      res.cookies.delete("refreshToken");
      return res;
    }

    // buscar apenas o necessário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, refreshToken: true },
    });

    // validar token persistido (single-session). Se quiser multi-sessão, mude o modelo.
    if (!user || user.refreshToken !== refreshToken) {
      const res = NextResponse.json({ error: "Token inválido" }, { status: 401 });
      res.cookies.delete("refreshToken");
      return res;
    }

    // emitir novos tokens (rotação)
    const claims = { sub: userId, email: user.email };
    const accessToken = await signAccessToken(claims);

    const jti = crypto.randomUUID();
    const newRefreshToken = await signRefreshToken({ ...claims, jti });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    const res = NextResponse.json(
      { accessToken }, // não retorna o refresh token no corpo
      { headers: { "Cache-Control": "no-store" } }
    );

    // define o novo cookie httpOnly
    res.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      // opcional: persistir por 30 dias
      // maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (e) {
    console.error(e);
    // em erro inesperado, ainda limpe o cookie para evitar loops de refresh quebrado
    const res = NextResponse.json({ error: "Erro ao atualizar token" }, { status: 500 });
    res.cookies.delete("refreshToken");
    return res;
  }
}
