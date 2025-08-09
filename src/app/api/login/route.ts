import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createHash } from 'crypto'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  const hash = createHash('sha256').update(password).digest('hex')
  if (hash !== user.passwordHash) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  const { passwordHash, ...rest } = user
  return NextResponse.json(rest)
}