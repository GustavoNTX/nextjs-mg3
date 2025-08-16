// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// @ts-expect-error jose ESM types sometimes falham sob non-NodeNext
import { jwtVerify } from 'jose'

// Rotas públicas: não exigem Authorization nem validade do token
const PUBLIC_ROUTES = [
  '/api/login',
  '/api/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/refresh',
  '/api/auth/refresh',
  '/api/health',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1) Bypass total para rotas públicas
  if (PUBLIC_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // 2) Bypass para preflight CORS
  if (request.method === 'OPTIONS') {
    return NextResponse.next()
  }

  // 3) Coletar token: Authorization: Bearer <token> OU cookie 'accessToken'
  const authHeader = request.headers.get('authorization') || ''
  let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) {
    token = request.cookies.get('accessToken')?.value ?? ''
  }
  if (!token) {
    return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 })
  }

  // 4) Validar JWT (expiração incluída)
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch (err: any) {
    const expired = err?.name === 'JWTExpired' || err?.code === 'ERR_JWT_EXPIRED'
    return NextResponse.json(
      { error: expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID' },
      { status: 401, headers: expired ? { 'x-token-expired': '1' } : undefined }
    )
  }
}

// Protege todas as rotas /api/*, deixando o bypass decidir as públicas
export const config = { matcher: ['/api/:path*'] }
