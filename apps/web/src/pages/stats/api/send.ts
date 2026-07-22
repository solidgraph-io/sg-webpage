import type { APIRoute } from 'astro';

// Exported for testing — inject fetchImpl to mock the Umami upstream
export async function handleSend(
  request: Request,
  host: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (!host) return new Response('Not Found', { status: 404 });

  // Umami hashes IP+UA daily to count visitors — without forwarding these,
  // every visit would arrive from this server and count as one visitor.
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    undefined;
  const userAgent = request.headers.get('user-agent') ?? undefined;
  const contentType = request.headers.get('content-type') ?? 'application/json';

  const upstream = await fetchImpl(`${host}/api/send`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      ...(ip ? { 'X-Forwarded-For': ip } : {}),
      ...(userAgent ? { 'User-Agent': userAgent } : {}),
    },
    body: await request.text(),
  });

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const env = await import('astro:env/server');
  return handleSend(request, env.ANALYTICS_UMAMI_HOST);
};
