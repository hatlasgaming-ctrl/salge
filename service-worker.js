
const CACHE_NAME = "salge-v2";

const ARQUIVOS = [
  "./",
  "./index.html",
  "./app.json",
  "./icone.png",
  "./Tabela_de_densidade.json",
  "./Valores_de_Referencia.json"
];

// Instalação: armazena os arquivos para uso offline.
self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await cache.addAll(ARQUIVOS);

      await self.skipWaiting();
    })()
  );
});

// Ativação: remove caches antigos do Salge.
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const nomes = await caches.keys();

      await Promise.all(
        nomes
          .filter(nome =>
            nome.startsWith("salge-") &&
            nome !== CACHE_NAME
          )
          .map(nome => caches.delete(nome))
      );

      await self.clients.claim();
    })()
  );
});

// Requisições: busca a versão atualizada primeiro.
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignora requisições que não são GET.
  if (request.method !== "GET") return;

  // Evita o erro de cache com chrome-extension://.
  if (
    url.protocol !== "http:" &&
    url.protocol !== "https:"
  ) {
    return;
  }

  // Ignora recursos externos ao Salge.
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Busca a versão mais recente no GitHub Pages.
        const response = await fetch(request);

        if (response.ok && response.type === "basic") {
          const cache = await caches.open(CACHE_NAME);

          // Aguarda a gravação no cache.
          try {
            await cache.put(
              request,
              response.clone()
            );
          } catch (error) {
            console.warn(
              "Salge: falha ao atualizar o cache:",
              error
            );
          }
        }

        return response;

      } catch (error) {
        // Sem conexão: tenta usar o arquivo salvo.
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);

        if (cached) {
          return cached;
        }

        // Para navegação, tenta abrir a página inicial.
        if (request.mode === "navigate") {
          const pagina = await cache.match("./index.html");

          if (pagina) {
            return pagina;
          }
        }

        return Response.error();
      }
    })()
  );
});
