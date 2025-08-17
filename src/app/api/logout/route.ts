// src/app/api/logout/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(_req: Request) {
  try {
    const res = NextResponse.json({ ok: true })

    // ✅ Next 15: cookies() agora é Promise
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value

    if (refreshToken) {
      // invalida no banco
      await prisma.user.updateMany({
        where: { refreshToken },
        data: { refreshToken: null },
      })
    }

    // remove o cookie no cliente
    res.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0, // expira imediatamente
    })

    return res
  } catch (e) {
    // Em caso de erro, ainda respondemos ok
    return NextResponse.json({ ok: true })
  }
}
