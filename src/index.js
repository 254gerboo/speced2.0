// index.js - Cloudflare Worker
addEventListener('fetch', event => {
  event.respondWith(handle(event.request));
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

async function handle(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  if (url.pathname === '/health' ) {
    const headers = Object.assign({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }, CORS_HEADERS);
    return new Response(JSON.stringify({ ok: true, ts: Date.now() }), { status: 200, headers });
  }

  if (url.pathname === '/download') {
    const headers = Object.assign({
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    }, CORS_HEADERS);

    // Create a ReadableStream that continually enqueues fixed-size chunks.
    // Clients will stop reading when they stop the test (abort).
    const chunkSize = 64 * 1024; // 64KB
    const chunk = new Uint8Array(chunkSize);
    // fill with pattern (optional)
    for (let i = 0; i < chunk.length; i++) chunk[i] = 0x41 + (i % 26); // ASCII letters

    const stream = new ReadableStream({
      start(controller) {
        let cancelled = false;

        // If the client aborts, Cloudflare will call cancel()
        controller.enqueue(chunk);

        async function pump() {
          while (!cancelled) {
            // If backpressure, wait until desired
            const ok = controller.enqueue(chunk);
            // Yield to event loop occasionally to avoid blocking the worker event loop
            await Promise.resolve();
          }
          try { controller.close(); } catch (e) {}
        }
        pump().catch(() => { try { controller.close(); } catch(e){} });
      },
      cancel() {
        // client aborted
      }
    });

    return new Response(stream, { status: 200, headers });
  }

  // Fallback: 404
  return new Response('Not found', { status: 404, headers: CORS_HEADERS });
}
