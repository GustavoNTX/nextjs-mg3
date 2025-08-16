import { NextResponse } from "next/server";
// import { cookies } from 'next/headers' // <- NÃO PRECISA MAIS
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { signAccessToken, signRefreshToken } from "@/lib/tokens";
import crypto from "node:crypto";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    console.log("TESTE      ", email, password);
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );

    const claims = { sub: String(user.id), email: user.email };
    const jti = crypto.randomUUID();

    const accessToken = await signAccessToken(claims);
    const refreshToken = await signRefreshToken({ ...claims, jti });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const res = NextResponse.json({
      accessToken,
      user: { id: user.id, email: user.email },
    });

    res.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("Login Erro: ", err);
    return NextResponse.json({ error: "Erro no login" }, { status: 500 });
  }
}
