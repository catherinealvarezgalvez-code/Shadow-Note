// Service Worker para Shadow Note - Soporte offline PWA
const CACHE_NAME = 'shadow-note-v1';
const STATIC_CACHE = 'shadow-note-static-v1';

// Archivos a cachear para funcionamiento offline
const STATIC_FILES = [
    './assets/css/style.css',
    './assets/js/app.js',
    './manifest.json'
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
                // Cachear cada archivo individualmente para evitar que uno falle todo
                return Promise.all(
                    STATIC_FILES.map(file => {
                        return cache.add(file)
                            .catch(err => {
                                console.warn(`No se pudo cachear ${file}:`, err);
                                return null;
                            });
                    })
                );
            })
            .then(() => self.skipWaiting())
            .catch(err => {
                console.error('Error en install:', err);
                return self.skipWaiting();
            })
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

    // Para navegación de páginas - Network First con fallback offline
    if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))) {
        event.respondWith(
            fetch(request).then(response => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(STATIC_CACHE).then(cache => cache.put(request, responseClone));
                }
                return response;
            }).catch(() => {
                // En offline, devolver página HTML estática
                return new Response(
                    `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Shadow Note</title><link rel="manifest" href="manifest.json"><style>:root{--primary:#667eea;--secondary:#764ba2}.auth-section{background:linear-gradient(135deg,var(--primary) 0%,var(--secondary) 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;color:#333}body{margin:0;padding:0}.auth-container{background:#fff;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,.1);padding:2rem;width:90%;max-width:400px}.auth-container h1{margin:0 0 .5rem;text-align:center}p{text-align:center;margin:.5rem 0}.offline-message{background:#fff3cd;border:1px solid #ffc107;border-radius:4px;padding:1rem;margin-bottom:1rem;color:#856404;text-align:center}</style></head><body><div class="auth-section"><div class="auth-container"><h1>📝 Shadow Note</h1><p>Aplicación de notas con soporte offline</p><div class="offline-message"><strong>Sin conexión a internet</strong><p>Recarga la página cuando tengas conexión para continuar.</p></div></div></div></body></html>`,
                    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                );
            })
        );
        return;
    }

    // Para archivos estáticos - Cache First
    if (url.pathname.includes('/assets/') || url.pathname.endsWith('manifest.json')) {
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
    // Para API de autenticación - Pass-through
    else if (url.pathname.includes('/api/auth.php')) {
        event.respondWith(
            fetch(request)
                .then(response => response)
                .catch(error => {
                    console.error('Auth fetch error:', error);
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Error de conexión',
                        offline: true
                    }), {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
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
    // Para otras requests - Network First con fallback vacío
    else {
        event.respondWith(
            fetch(request).catch(() => {
                // Si falla la red, intentar cache
                return caches.match(request)
                    .then(response => response || new Response(JSON.stringify({
                        success: false,
                        error: 'Sin conexión a internet',
                        offline: true
                    }), { 
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    }))
                    .catch(() => new Response(JSON.stringify({
                        success: false,
                        error: 'Sin conexión a internet'
                    }), { 
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    }));
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