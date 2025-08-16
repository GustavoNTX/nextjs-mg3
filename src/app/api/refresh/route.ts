import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "@/lib/tokens";
import crypto from "node:crypto";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    let refreshToken = await cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      try {
        const body = await req.json();
        if (typeof body.refreshToken === "string") {
          refreshToken = body.refreshToken;
        }
      } catch {
        // no body provided
      }
    }

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token requerido" },
        { status: 401 }
      );
    }

    const { payload } = await verifyRefreshToken(refreshToken);
    const userId = payload.sub ? String(payload.sub) : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.refreshToken !== refreshToken) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const claims = { sub: userId, email: user.email };

    const accessToken = await signAccessToken(claims);

    const jti = crypto.randomUUID();
    const newRefreshToken = await signRefreshToken({ ...claims, jti });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    cookieStore.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });

    return NextResponse.json({ accessToken, refreshToken: newRefreshToken });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erro ao atualizar token" },
      { status: 500 }
    );
  }
}
