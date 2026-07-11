// Defers Cloudflare Turnstile's api.js (~24 KiB of third-party JS) until the
// contact section nears the viewport (SPEC-FORM-001/RNF-2): the widget lives
// at the bottom of the page, so it has no business in the critical path.
// The .cf-turnstile div is server-rendered; once api.js lands, Turnstile
// auto-renders it (implicit rendering) — no explicit API call needed.

const API_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

let injected = false;

function injectApi(): void {
  if (injected || document.querySelector(`script[src="${API_SRC}"]`)) return;
  injected = true;
  const script = document.createElement('script');
  script.src = API_SRC;
  script.async = true;
  script.defer = true;
  document.head.append(script);
}

// only when the widget is in the DOM (i.e. a site key exists at runtime)
const widget = document.querySelector('.cf-turnstile');
if (widget) {
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          io.disconnect();
          injectApi();
        }
      },
      // generous margin: the script is ready before the user reaches the form
      { rootMargin: '200px' },
    );
    io.observe(widget);
  } else {
    injectApi();
  }
}
