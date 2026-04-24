'use strict';

const CACHE_NAME = 'voltfuel-v2.0.6';
const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/styles.css',
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
        })
    );
});

self.addEventListener('fetch', function(event) {
    // Sempre busca HTML na rede para detectar novas versões
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(function() {
                return caches.match('/index.html');
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
