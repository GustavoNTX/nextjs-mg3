// src/lib/tokens.ts
import { SignJWT, jwtVerify } from 'jose'

const enc = new TextEncoder()

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '10m'   // curto
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '7d'  // longo

// Em produção, garanta que as envs estão definidas
const accessSecret = enc.encode(process.env.JWT_SECRET!)
const refreshSecret = enc.encode(process.env.REFRESH_SECRET!)

export type MinimalClaims = {
  sub: string // user id
  email?: string
  roles?: string[]
}

export async function signAccessToken(claims: MinimalClaims) {
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(accessSecret)
}

export async function signRefreshToken(claims: MinimalClaims & { jti: string }) {
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(refreshSecret)
}

export async function verifyAccessToken(token: string) {
  return await jwtVerify(token, accessSecret) // lança erro se inválido/expirado
}

export async function verifyRefreshToken(token: string) {
  return await jwtVerify(token, refreshSecret)
}

// util pra checar exp no client (sem precisar bater no servidor)
export function isJwtExpiredUnix(expSeconds?: number) {
  if (!expSeconds) return true
  const now = Math.floor(Date.now() / 1000)
  return expSeconds <= now
}
