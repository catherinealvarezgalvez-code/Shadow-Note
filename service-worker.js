// Service Worker para Shadow Note - Soporte offline PWA
const CACHE_NAME = 'shadow-note-v1';
const STATIC_CACHE = 'shadow-note-static-v1';

// Archivos a cachear para funcionamiento offline
const STATIC_FILES = [
    '/',
    '/index.php',
    '/assets/css/style.css',
    '/assets/js/app.js',
    '/manifest.json'
];

// Archivos dinámicos (notas) - estrategia stale-while-revalidate
const DYNAMIC_CACHE = 'shadow-note-dynamic-v1';

// Instalar service worker
self.addEventListener('install', event => {
    console.log('Service Worker instalando...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Cacheando archivos estáticos');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => self.skipWaiting())
    );
});

// Activar service worker
self.addEventListener('activate', event => {
    console.log('Service Worker activando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interceptar requests
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Para archivos estáticos - Cache First
    if (STATIC_FILES.some(file => url.pathname.endsWith(file))) {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(request).then(response => {
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(STATIC_CACHE).then(cache => {
                                cache.put(request, responseClone);
                            });
                        }
                        return response;
                    });
                })
        );
    }
    // Para API de notas - Network First (stale-while-revalidate)
    else if (url.pathname.includes('/api/notes.php')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Si falla la red, intentar cache
                    return caches.match(request).then(response => {
                        if (response) {
                            return response;
                        }
                        // Si no hay cache, devolver respuesta de error
                        return new Response(JSON.stringify({
                            success: false,
                            error: 'Sin conexión a internet',
                            offline: true
                        }), {
                            status: 503,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
                })
        );
    }
    // Para otras requests - Network First
    else {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    // Si falla la red, intentar cache
                    return caches.match(request);
                })
        );
    }
});

// Manejar mensajes del cliente
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});