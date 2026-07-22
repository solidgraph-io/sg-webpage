import type { APIRoute } from 'astro';

// Exported for testing — inject fetchImpl to mock the Umami upstream
export async function handleScript(
  host: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (!host) return new Response('Not Found', { status: 404 });

  const upstream = await fetchImpl(`${host}/script.js`);
  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export const GET: APIRoute = async () => {
  const env = await import('astro:env/server');
  return handleScript(env.ANALYTICS_UMAMI_HOST);
};
