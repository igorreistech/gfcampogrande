const CACHE = 'monitor-cgr-v179';
const BASE = new URL('./', self.location).pathname;
const LOCAL_ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'styles.css',
  BASE + 'app.js',
  BASE + 'supabase-shim.js',
  BASE + 'manifest.json',
  BASE + 'nf-import.js',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
  BASE + 'icon-192-maskable.png',
  BASE + 'icon-512-maskable.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(LOCAL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== CACHE + '-cdn' && !/-cdn$/.test(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Ignora esquemas que o Cache API não suporta (ex.: extensões do Chrome
  // injetando requisições chrome-extension://) — deixa o navegador tratar.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Inventário sem internet: a página e as bibliotecas (CDN) ficam guardadas — sem sinal, abre a cópia e as leituras ficam no aparelho
  if (e.request.mode === 'navigate' && /inventario\.html$/.test(url.pathname)) {
    e.respondWith(fetch(e.request, { cache: 'reload' }).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put(url.pathname, c)); return res; })
      .catch(() => caches.match(url.pathname).then(r => r || caches.match(BASE))));
    return;
  }
  if (e.request.method === 'GET' && /^(esm\.sh|cdnjs\.cloudflare\.com|unpkg\.com|cdn\.jsdelivr\.net)$/.test(url.hostname)) {
    e.respondWith(caches.open(CACHE + '-cdn').then(k => fetch(e.request).then(res => { if (res.ok) k.put(e.request, res.clone()); return res; }).catch(() => k.match(e.request))));
    return;
  }
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, {cache:'reload'}).catch(() => caches.match(BASE))
    );
    return;
  }

  // Só tenta cache em requisições realmente do mesmo domínio do site (GET) —
  // a lista de exclusão por substring do hostname deixava passar hosts novos
  // por engano; checar a origem direto é mais robusto.
  const isLocal = url.origin === self.location.origin;
  // fretes.html (aviso de nova versão), fretes-config.js e os arquivos .sql sempre da rede: o cache guardava versões antigas.
  if (isLocal && /fretes\.html$|fretes-config\.js$|\.sql$/.test(url.pathname)) { e.respondWith(fetch(e.request, { cache: 'no-store' }).then(res => { if (res.ok && /fretes-config\.js$/.test(url.pathname)) { const c = res.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return res; }).catch(() => caches.match(e.request))); return; }
  if (isLocal && e.request.method === 'GET' && url.pathname.startsWith(BASE)) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
