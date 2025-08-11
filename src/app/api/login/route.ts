import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Comparar a senha fornecida com o hash armazenado
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Gerar o Token JWT
    const { passwordHash, ...userPayload } = user;
    const token = jwt.sign(
      userPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '1h' } // Token expira em 1 hora
    );

    // Retornar o token e os dados do usuário (sem o hash da senha)
    return NextResponse.json({ user: userPayload, token });

  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: 'No momento estamos em manutenção.' }, { status: 500 });
  }
}