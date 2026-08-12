// Service worker mínimo, solo para permitir "Añadir a pantalla de inicio".
// No cachea nada de forma agresiva para evitar versiones desactualizadas.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
