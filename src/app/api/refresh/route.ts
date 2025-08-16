import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value

    if (refreshToken) {
      // invalida no banco
      await prisma.user.updateMany({
        where: { refreshToken },
        data: { refreshToken: null }
      })
    }

    // apaga cookie
    cookieStore.set('refreshToken', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    })

    return NextResponse.json({ ok: true })
  } catch(e) {
    console.error(e)
    return NextResponse.json({ ok: true })
  }
}
