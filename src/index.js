addEventListener('fetch', event => {
  event.respondWith(handle(event.request));
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function handle(req) {

  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);

  // Health check
  if (url.pathname === "/server/ping") {
    return new Response("pong", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        ...CORS_HEADERS
      }
    });
  }

  // DOWNLOAD ENDPOINT
  if (url.pathname === "/download") {
    const headers = {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store",
      ...CORS_HEADERS
    };

    const chunkSize = 64 * 1024; // 64KB
    const chunk = new Uint8Array(chunkSize);

    const stream = new ReadableStream({
      start(controller) {
        function push() {
          controller.enqueue(chunk);
          setTimeout(push, 0);
        }
        push();
      }
    });

    return new Response(stream, {
      status: 200,
      headers
    });
  }

  // UPLOAD ENDPOINT
  if (url.pathname === "/server/upload") {
    await req.arrayBuffer();
    return new Response("ok", {
      status: 200,
      headers: CORS_HEADERS
    });
  }

  return new Response("Not found", {
    status: 404,
    headers: CORS_HEADERS
  });
}
