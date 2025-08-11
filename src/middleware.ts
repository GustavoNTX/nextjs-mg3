import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request: NextRequest) {
  // 1. Pega o token do cabeçalho Authorization
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  // 2. Se não houver token, retorna erro 401
  if (!token) {
    return new NextResponse(
      JSON.stringify({ error: 'Autenticação necessária.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. Verifica a validade do token
  try {
    // Usa o mesmo segredo do .env.local para verificar
    jwt.verify(token, process.env.JWT_SECRET!);
    // Se for válido, permite que a requisição continue
    return NextResponse.next();
  } catch (error) {
    // Se a verificação falhar (token expirado, inválido, etc.)
    return new NextResponse(
      JSON.stringify({ error: 'Token inválido ou expirado.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 4. Define quais rotas serão protegidas por este middleware
export const config = {
  matcher: '/api/condominios/:path*',
};