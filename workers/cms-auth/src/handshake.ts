/**
 * Netlify/Decap popup handshake (SPEC-CMS-002/RF-1).
 *
 * Contract (from sveltia-cms-auth's outputHTML): the popup announces
 * `authorizing:github` to the opener; when the CMS echoes that string back,
 * the popup replies `authorization:github:<state>:<JSON>` to that origin and
 * the CMS closes the popup. No GitHub OAuth roundtrip is involved (RNF-3).
 */

export type HandshakeState = 'success' | 'error';

export function handshakeHtml(state: HandshakeState, content: Record<string, string>): Response {
  // `</script>`-safe JSON for inline embedding
  const payload = JSON.stringify(JSON.stringify(content)).replace(/</g, '\\u003c');

  const html = `<!doctype html>
<html>
  <body>
    <script>
      (() => {
        window.addEventListener('message', ({ data, origin }) => {
          if (data === 'authorizing:github') {
            window.opener?.postMessage('authorization:github:${state}:' + ${payload}, origin);
          }
        });
        window.opener?.postMessage('authorizing:github', '*');
      })();
    </script>
  </body>
</html>
`;

  return new Response(html, {
    status: 200, // Decap contract: outcomes travel via postMessage, not HTTP status
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
