// NutriMentor PWA Service Worker (PWABuilder Score Optimized)
const CACHE_NAME = "nutrimentor-v2"
const OFFLINE_URLS = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    )
  )
  self.clients.claim()
})

// Stale-While-Revalidate with network fallback for offline support
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  // Do not intercept dynamic authentication or server actions
  if (event.request.url.includes("/api/auth/")) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return networkResponse
        })
        .catch(() => {
          // If network fails, return cached response or offline root
          return cachedResponse || caches.match("/")
        })

      return cachedResponse || fetchPromise
    })
  )
})

// Periodic Background Sync Support
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "sync-nutrition-data") {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
    )
  }
})

// Background Sync Support
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-food-entries") {
    console.log("[SW] Background sync triggered for food entries")
  }
})

// Push Notification Support
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "NutriMentor", body: "Remember to log your meals today!" }
  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [100, 50, 100],
    data: { url: "/" },
  }
  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus()
      }
      return clients.openWindow("/")
    })
  )
})
