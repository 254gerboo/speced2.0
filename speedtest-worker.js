addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(req) {
  const url = new URL(req.url);

  if (url.pathname === '/download') {
    return new Response(streamChunks(), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // Fallback route
  return new Response(JSON.stringify({ ok: true, time: Date.now() }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function* streamChunks() {
  const chunkSize = 64 * 1024; // 64 KB
  const chunk = new Uint8Array(chunkSize).fill(97); // 'a'

  while (true) {
    yield chunk;
    await new Promise(r => setTimeout(r, 0)); // give a tiny pause to avoid blocking
  }
}
