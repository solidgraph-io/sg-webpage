# Dev Stage — `dev.solidgraph.dev` Runbook

> **SPEC-DEPLOY-001/RF-6** — Runbook for the dev stage pipeline.
> The dev stage deploys automatically on every push to `develop` that passes all gates.

## Architecture

```
push → develop
  → install → validate → test+trace → visual-test → a11y-test → build → perf-test
      → build-push-web-dev  (tags: dev + SHA)
          → trigger-dokploy-dev  (POST DOKPLOY_WEBHOOK_WEB_DEV)
              → Dokploy pulls registry.solidgraph.dev/solidgraph-web:dev
                  → serves dev.solidgraph.dev
```

`main` and its steps (`build-push-web`, `trigger-dokploy`) are **not affected**.

---

## 1. Drone Secrets (one-time setup by human)

Configure these in Drone CI → Settings → Secrets:

| Secret | Description | Who provides |
|--------|-------------|--------------|
| `DOKPLOY_WEBHOOK_WEB_DEV` | Deploy webhook URL for the `web-dev` Dokploy service | Human: copy from Dokploy → web-dev → Deployments → Webhook |
| `REGISTRY_USERNAME` | Private registry username (shared with prod) | Already exists |
| `REGISTRY_PASSWORD` | Private registry password (shared with prod) | Already exists |
| `TURBO_TOKEN` | Turborepo Remote Cache token (shared) | Already exists |
| `TURBO_TEAM` | Turborepo team slug (shared) | Already exists |
| `TURBO_API` | Self-hosted cache server URL (shared) | Already exists |

---

## 2. Dokploy Service `web-dev` (one-time setup by human)

Create a new service in Dokploy:

- **Name:** `web-dev`
- **Image:** `registry.solidgraph.dev/solidgraph-web:dev`
- **Domain:** `dev.solidgraph.dev`
- **Port:** `4321`

### Environment variables (set in Dokploy → web-dev → Environment):

```env
PUBLIC_SITE_URL=https://dev.solidgraph.dev
LEAD_PROVIDER=resend
LEAD_TO_EMAIL=<your-leads-inbox@example.com>
LEAD_FROM_EMAIL=admin@solidgraph.io
RESEND_API_KEY=<resend-api-key>
TURNSTILE_SITE_KEY=<cloudflare-turnstile-site-key-for-dev>
TURNSTILE_SECRET_KEY=<cloudflare-turnstile-secret-key-for-dev>
```

> **Never** put real values in `.env.example` or the repo. All secrets live in Dokploy.

After saving, copy the **deploy webhook URL** from Dokploy → web-dev → Deployments → and add it as the `DOKPLOY_WEBHOOK_WEB_DEV` Drone secret.

---

## 3. DNS / Traefik (one-time setup by human)

1. **Cloudflare DNS:** Add `A` record `dev.solidgraph.dev` → VPS IP. Set proxy status to DNS-only (orange cloud off) while testing, then enable proxy.
2. **Traefik:** Dokploy manages Traefik automatically when you set the domain in the service config. Verify TLS auto-provisions via Let's Encrypt (Traefik uses ACME).

---

## 4. Cloudflare Turnstile Setup

1. Go to [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com) → your existing Turnstile site.
2. Add `dev.solidgraph.dev` to the **allowed hostnames** list.
3. Use the **same site key and secret key** as prod, or create a separate dev Turnstile site for isolation.
4. Set `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in Dokploy → web-dev environment.

---

## 5. Resend Setup

1. Verify `solidgraph.io` domain in [Resend Dashboard](https://resend.com) → Domains.
2. Create or reuse an API key (read-write on `solidgraph.io` domain).
3. Set `RESEND_API_KEY` and `LEAD_TO_EMAIL` in Dokploy → web-dev environment.

---

## 6. Post-Deploy Verification Checklist

After a first successful deploy to `dev.solidgraph.dev`:

- [ ] `curl -I https://dev.solidgraph.dev` → `200 OK`
- [ ] Open `https://dev.solidgraph.dev/admin/index.html` in Chrome → Sveltia loads
- [ ] Open `https://dev.solidgraph.dev` → all sections render, no console errors
- [ ] Fill and submit the contact form with a valid Turnstile challenge:
  ```bash
  # With JS enabled (PE island path):
  # → browser submits JSON, expects 200 + success-msg shown inline
  #
  # Without JS (POST fallback):
  # → form POSTs to /api/lead, expects redirect to /?contact=success
  ```
- [ ] Check `LEAD_TO_EMAIL` inbox → lead email arrives from `LEAD_FROM_EMAIL`
- [ ] Verify `/api/lead` with missing field → `400` with field errors
- [ ] Verify `/api/lead` with honeypot filled → `200` silently discarded (no email)
- [ ] Open browser DevTools → Network → confirm no JS errors on page load

---

## 7. Rollback

If the dev deploy causes issues, roll back in Dokploy:

1. Dokploy → web-dev → Deployments → select a previous deploy → Redeploy.
2. Or push a fix commit to `develop` — the pipeline will build and deploy the new image automatically.

`main` and `solidgraph.io` are **never affected** by dev deployments.
