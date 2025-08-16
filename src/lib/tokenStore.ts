// Simples e resiliente: mantém em memória e persiste no localStorage.
// Evita leituras repetidas do localStorage a cada request.

let accessTokenMem: string | null = null
let refreshTokenMem: string | null = null

const isBrowser = typeof window !== 'undefined'

export const tokenStore = {
  getAccess() {
    if (accessTokenMem) return accessTokenMem
    if (isBrowser) accessTokenMem = localStorage.getItem('accessToken')
    return accessTokenMem
  },
  setAccess(token: string | null) {
    accessTokenMem = token
    if (!isBrowser) return
    if (token) localStorage.setItem('accessToken', token)
    else localStorage.removeItem('accessToken')
  },
  getRefresh() {
    if (refreshTokenMem) return refreshTokenMem
    if (isBrowser) refreshTokenMem = localStorage.getItem('refreshToken')
    return refreshTokenMem
  },
  setRefresh(token: string | null) {
    refreshTokenMem = token
    if (!isBrowser) return
    if (token) localStorage.setItem('refreshToken', token)
    else localStorage.removeItem('refreshToken')
  },
  clearAll() {
    accessTokenMem = null
    refreshTokenMem = null
    if (isBrowser) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }
}
