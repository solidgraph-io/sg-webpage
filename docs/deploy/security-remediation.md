---
type: Runbook
title: "Runbook — Remediación de la auditoría PT-2026-002 (estrategia + pasos de infra)"
description: "Estrategia de corrección de los 7 hallazgos de PT-2026-002 (incluidos los de bajo impacto). Triaje por dónde se corrige cada uno (repo vs infra), orden de ejecución y pasos concretos de Cloudflare/GitHub/Dokploy que ejecuta el humano. Los fixes de repo van en SPEC-SEC-016 + prompt 60."
tags: [deploy, security, runbook, cloudflare]
timestamp: 2026-07-11T13:30:00Z
---

# Runbook — Remediación PT-2026-002

Objetivo: cerrar **los 7 hallazgos** de la auditoría, incluidos los de **bajo impacto** y el **informativo**.
0 críticos / 0 altos → esto es endurecimiento, no incendio. Relacionado:
[ADR-0018](/adr/0018-http-security-headers-and-csp.md), [SPEC-SEC-016](/specs/SPEC-SEC-016.md),
[prompt 60](/prompts/60-security-hardening-audit-pt2026-002.md), [ADR-0017](/adr/0017-cms-client-agnostic-auth-cloudflare-access-bridge.md).

## Estrategia y triaje

Cada hallazgo se corrige donde vive el problema. Dos carriles: **repo** (Claude Code, TDD, prompt 60) e **infra**
(tú, en Cloudflare/GitHub/Dokploy). Nada aquí bloquea el desarrollo; el gate real es **antes de publicar prod**.

> **Nota sobre F-01/F-07:** el repo es **público a propósito** (marketing/portfolio, transparencia técnica). NO se
> pasa a privado. El riesgo real de un repo público **no es que se vea el código**, sino que **filtre secretos** o
> que la divulgación de arquitectura habilite un ataque. Por eso F-01/F-07 se reencuadran como **higiene de repo
> público**: garantizar que nunca hubo ni habrá secretos en el árbol/historial, y aceptar la visibilidad del
> código y la arquitectura como **decisión de negocio** (riesgo residual asumido).

| # | Hallazgo | Sev. | Dónde se corrige | Acción |
|---|----------|------|------------------|--------|
| **F-01** | Repo público en GitHub | Media | **Infra (tú)** | **Se mantiene público (por diseño).** Higiene: escanear historial, secret scanning + push protection, branch protection. NO privatizar |
| **F-02** | Sin cabeceras de seguridad | Media | **Repo** (prompt 60) + **Infra** | Middleware (CSP/XFO/nosniff/Referrer/Permissions) + **HSTS en Cloudflare** |
| **F-03** | Rate-limit inefectivo (in-memory + XFF suplantable) | Media | **Repo** (prompt 60) + **Infra** | IP desde `CF-Connecting-IP` + **regla WAF de rate-limit en Cloudflare** |
| **F-04** | `/admin` + `config.yml` públicos | Baja | **Infra (tú)** | **Cloudflare Access** sobre `/admin` (ya previsto en ADR-0017). `config.yml` en el repo es visible por diseño y **no lleva secretos** |
| **F-05** | 500 ante JSON malformado | Baja | **Repo** (prompt 60) | `try/catch` → **400** |
| **F-06** | Staging expuesto e indexable | Baja | **Repo** (noindex) + **Infra** | `X-Robots-Tag`/robots env-gated + **Cloudflare Access** sobre staging |
| **F-07** | Divulgación de arquitectura | Info | **Aceptado (por diseño)** | Repo público expone arquitectura **a propósito**. Mitigación real: cero secretos (F-01) + **rotar webhook de Dokploy** si alguna vez estuvo en el árbol |

**Orden recomendado:** (1) **F-01 primero** — escanear historial y confirmar cero secretos (el repo sigue
público). (2) Prompt 60 (fixes de repo). (3) Cloudflare: HSTS + WAF rate-limit + Access sobre `/admin` y staging.
(4) Rotar webhook si aplica.

---

## Parte de repo (Claude Code — prompt 60)

Le pasas a Claude Code **[prompt 60](/prompts/60-security-hardening-audit-pt2026-002.md)**. Cubre F-02 (headers +
CSP), F-03 (IP `CF-Connecting-IP`), F-05 (400), F-06 (noindex env-gated) y `security.txt`, con un test de regresión
por hallazgo. Va contra `develop`; **tú** haces el `git push`/merge. No requiere prod desplegada.

---

## Parte de infra (tú)

### F-01 — Higiene de repo público (NO privatizar)  *(hazlo primero)*

El repo sigue **público** (marketing/portfolio). El objetivo no es esconderlo, sino garantizar que ser público no
cuesta nada: **cero secretos** y detección automática de futuros descuidos.

1. **Escanea el historial completo** por secretos filtrados (ramas + tags) — esto es lo importante:
   ```bash
   docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest detect --source=/repo --redact -v
   # o: trufflehog git file://. --only-verified
   ```
   Si aparece algún secreto real (tokens, claves, el PAT de servicio del CMS, webhooks), **rótalo ya** — el
   historial git es público y permanente; reescribirlo no basta (ya pudo ser clonado). Rotar es la única
   remediación fiable.
2. **Settings → Code security:** activa **Secret scanning** + **Push protection** (bloquea commits con secretos
   antes de que entren — clave en un repo público).
3. **Settings → Branches:** branch protection en `main` y `develop` (PR obligatoria, status checks, sin
   force-push) para que nadie meta un secreto por accidente.
4. **Regla operativa:** todo secreto vive en **variables de entorno de Dokploy**, nunca en el árbol. Documenta
   esto para el equipo.
5. La **Turnstile site key** del informe (`0x4AAAAAACdmD3nBo4wkkKtQ`) es **pública por diseño** (va en el HTML) —
   no hay que rotarla. Verifica solo que la **secret key** de Turnstile nunca estuvo en el repo.

### F-02 (parte infra) — HSTS en Cloudflare

- **Cloudflare → dominio `solidgraph.io` → SSL/TLS → Edge Certificates → HTTP Strict Transport Security (HSTS) →
  Enable.**
  - `max-age` 6–12 meses, **Include subdomains** si todos los subdominios van por HTTPS.
  - **`Preload`: actívalo solo cuando estés seguro** (es difícil de revertir; compromete todos los subdominios a
    HTTPS). Para el lanzamiento inicial puedes dejarlo sin preload y añadirlo después.
- No pongas HSTS en el middleware (ADR-0018): se controla desde el borde.

### F-03 (parte infra) — Regla WAF de rate-limit

El limitador en memoria del repo es **best-effort** (se reinicia con cada deploy y no es distribuido). El límite
**real** va en Cloudflare:

- **Cloudflare → Security → WAF → Rate limiting rules → Create.**
  - **If** URI Path equals `/api/lead` **and** method `POST`.
  - **Then**: p. ej. **5 requests / 1 min** por IP → **Block** (o Managed Challenge) durante 1–10 min.
  - Cloudflare usa la IP real del cliente, así que no depende de `X-Forwarded-For`.
- Complementa (no sustituye) al Turnstile ya presente en el form.

### F-04 y F-06 — Cloudflare Access sobre `/admin` y staging

Reutiliza la infraestructura de **ADR-0017** (ya prevista para el CMS):

- **`/admin` (CMS Sveltia):** Cloudflare Access delante de `/admin*` en prod y staging. Solo tu identidad (o el
  grupo del equipo) entra; el bridge Worker ya valida el JWT `Cf-Access-Jwt-Assertion`. Esto oculta `config.yml`
  y el panel a anónimos.
- **Staging `*.solidgraph.dev` (F-06):** aplica **Access a todo el dominio de staging** (self-hosted app cubriendo
  `sg-webpage.solidgraph.dev`). Así el entorno de desarrollo deja de ser público. El `noindex`/robots del repo es
  la segunda capa (por si algo se sirve sin Access), pero **el bloqueo real es Access**.

### F-07 — Divulgación de arquitectura (aceptada) + rotar webhook si aplica

La divulgación de arquitectura es **inherente y aceptada** al tener el repo público por diseño — no es un fallo a
corregir, es el trade-off del portfolio abierto. Lo único accionable:

- Si en algún archivo o en el historial hubo alguna vez la **URL del webhook de deploy** (`DOKPLOY_WEBHOOK_WEB` o
  similar): **regenera el webhook en Dokploy** y actualiza el secreto en CI. Es el único elemento de F-07 que sí es
  un secreto (lo detecta el scan de F-01).

---

## Verificación (después de todo)

1. **Cabeceras** — `curl -sI https://solidgraph.io | grep -iE 'content-security|x-frame|x-content-type|referrer|permissions|strict-transport'` → aparecen todas (HSTS incluida vía Cloudflare).
2. **CSP sin romper nada** — carga la home: Turnstile carga, el form envía, Umami reporta a `/stats`, **consola sin violaciones de CSP**.
3. **Rate-limit** — >5 POST rápidos a `/api/lead` → bloqueados por la regla WAF.
4. **JSON malformado** — `curl -X POST https://solidgraph.io/api/lead -H 'Content-Type: application/json' -d '{'` → **400**, no 500.
5. **Staging cerrado** — abrir `sg-webpage.solidgraph.dev` en incógnito → pantalla de **Cloudflare Access** (no el sitio); `robots.txt` = `Disallow: /`.
6. **`/admin`** — en incógnito → Access; autenticado → carga y el CMS funciona.
7. **Repo** — sigue **público**; gitleaks/trufflehog sin hallazgos verificados (o secretos rotados); Secret scanning + Push protection + branch protection activos.
8. **security.txt** — `https://solidgraph.io/.well-known/security.txt` responde con `Contact:` y `Expires:`.

## Notas

- **Momento:** los pasos de Cloudflare Access/HSTS/WAF sobre `solidgraph.io` aplican **al publicar prod** (que aún
  no se lanza). **F-01 (repo privado) hazlo ya**; el resto puedes prepararlo y activarlo en el lanzamiento. Access
  sobre staging (`.dev`) sí conviene **ahora** (F-06).
- **Email de `security.txt`:** confirma el buzón (p. ej. `security@solidgraph.io`) para que el prompt 60 lo use.
