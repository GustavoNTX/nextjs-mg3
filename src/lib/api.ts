import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosHeaders,
  AxiosRequestHeaders,
} from 'axios'
import { tokenStore } from './tokenStore'

type FailedRequest = {
  resolve: (token: string) => void
  reject: (err: any) => void
}

let isRefreshing = false
const failedQueue: FailedRequest[] = []

function processQueue(error: any, token: string | null) {
  while (failedQueue.length) {
    const { resolve, reject } = failedQueue.shift()!
    if (token) resolve(token)
    else reject(error)
  }
}

// Garante que headers seja AxiosHeaders
function ensureHeaders(h?: AxiosRequestHeaders): AxiosHeaders {
  return h instanceof AxiosHeaders ? h : new AxiosHeaders(h)
}

async function refreshAccessToken() {
  const rt = tokenStore.getRefresh()
  if (!rt) throw new Error('NO_REFRESH_TOKEN')

  const res = await axios.post('/api/refresh', { refreshToken: rt })
  const newAccess = res.data?.accessToken as string | undefined
  const newRefresh = res.data?.refreshToken as string | undefined // opcional (rotação)
  if (!newAccess) throw new Error('INVALID_REFRESH_RESPONSE')

  tokenStore.setAccess(newAccess)
  if (newRefresh) tokenStore.setRefresh(newRefresh)

  return newAccess
}

export const api: AxiosInstance = axios.create({
  baseURL: '/api',
})

// REQUEST: injeta Authorization
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess()
  if (token) {
    config.headers = ensureHeaders(config.headers)
    ;(config.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`)
  }
  return config
})

// RESPONSE: lida com 401 e refresh
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config
    const status = error.response?.status
    const expiredHeader = error.response?.headers?.['x-token-expired'] // '1' quando expira
    const isExpired = status === 401 && expiredHeader === '1'
    const isRefreshCall =
      originalRequest?.url?.includes('/api/refresh') || originalRequest?.url === '/refresh'
    const isLoginCall =
      originalRequest?.url?.includes('/api/login') || originalRequest?.url === '/login'

    if (!status || status !== 401 || isRefreshCall || isLoginCall || !isExpired) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            if (!originalRequest) return reject(new Error('no original request'))
            originalRequest.headers = ensureHeaders(originalRequest.headers as any)
            ;(originalRequest.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`)
            resolve(api(originalRequest))
          },
          reject: (err) => reject(err),
        })
      })
    }

    isRefreshing = true
    try {
      const newToken = await refreshAccessToken()
      processQueue(null, newToken)

      if (!originalRequest) throw new Error('no original request')
      originalRequest.headers = ensureHeaders(originalRequest.headers as any)
      ;(originalRequest.headers as AxiosHeaders).set('Authorization', `Bearer ${newToken}`)

      return api(originalRequest)
    } catch (refreshErr) {
      processQueue(refreshErr, null)
      tokenStore.clearAll()
      if (typeof window !== 'undefined') window.location.href = '/login'
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)
