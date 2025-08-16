import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const res = NextResponse.json({ ok: true })
    const cookieStore = cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value

    if (refreshToken) {
      // invalida no banco
      await prisma.user.updateMany({
        where: { refreshToken },
        data: { refreshToken: null }
      })
    }

   res.cookies.set('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })

  return res
  } catch {
    return NextResponse.json({ ok: true })
  }
}
