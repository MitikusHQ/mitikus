const CACHE_VERSION = 'mitikus-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const OFFLINE_URL = '/offline'

const PRECACHE_URLS = [OFFLINE_URL, '/']

// Instala y precachea la shell básica
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  )
})

// Limpia caches antiguas al activar
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('mitikus-') && k !== STATIC_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo interceptar mismo origen
  if (url.origin !== self.location.origin) return

  // APIs y autenticación: siempre red, nunca cachear
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/sign-')) return

  // Assets estáticos de Next.js (_next/static): cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
      }),
    )
    return
  }

  // Navegación: network-first con fallback a /offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cachear la respuesta de navegación exitosa
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() =>
          // Sin red: intentar la caché, luego la página offline
          caches.match(request).then((cached) => cached ?? caches.match(OFFLINE_URL)),
        ),
    )
    return
  }
})
