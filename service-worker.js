
const CACHE_NAME = "salge-v1";

const ARQUIVOS = [
  "./",
  "./index.html",
  "./app.json",
  "./icon-192.png",
  "./Tabela_de_densidade.json",
  "./Valores_de_Referencia.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const copia = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copia);
          });
        }

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
