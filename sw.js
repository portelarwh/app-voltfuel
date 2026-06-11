'use strict';

// ⚠️ VERSÃO DO APP — incremente a CADA mudança publicada.
// Deve ser igual ao APP_VERSION definido em index.html.
// Mudar este valor é o que força o navegador a baixar a nova versão.
const CACHE_NAME = 'voltfuel-v2.0.9';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/icon-192.png',
    '/assets/icon-512.png',
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys
                    .filter(function(key) { return key !== CACHE_NAME; })
                    .map(function(key) { return caches.delete(key); })
            );
        }).then(function() { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function(event) {
    // Sempre busca o HTML mais recente na rede (ignorando o cache HTTP),
    // para que o app instalado nunca fique preso numa versão antiga.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request, { cache: 'no-store' }).then(function(resp) {
                var copia = resp.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put('/index.html', copia);
                });
                return resp;
            }).catch(function() {
                return caches.match('/index.html').then(function(c) {
                    return c || caches.match('/');
                });
            })
        );
        return;
    }
    // Demais assets: cache primeiro, fallback na rede
    event.respondWith(
        caches.match(event.request).then(function(cached) {
            return cached || fetch(event.request);
        })
    );
});

// Recebe sinal do app para ativar o novo SW imediatamente
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
