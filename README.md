<div align="center">

# SolidGraph

### Custom-built websites for local businesses — not templates.

We custom-build professional websites for local businesses so more customers can **find you, call you, and walk through your door**.

[![Astro](https://img.shields.io/badge/Built%20with-Astro%205-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-2ea44f)
![Performance budgets](https://img.shields.io/badge/Performance-Lighthouse%20budgets-2ea44f)
![Design fidelity gate](https://img.shields.io/badge/Design-fidelity%20gated-5c70d6)
![Tests](https://img.shields.io/badge/Tests-660%2B%20passing-2ea44f)

</div>

---

## This repo is our proof of work

This is **SolidGraph's own website** — and a live demonstration of the exact process we use to build every client site. If you're evaluating whether to work with us, you don't have to take our word for it: the engineering standards below are enforced automatically on every single change, and you can read them here.

Most agencies ship a template with your logo dropped in. We build **from scratch, line by line**, to the design you approve — and we prove the result matches, automatically, before anything goes live.

---

## What this means for you

| You get                                                         | How we make sure                                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **A site built for _your_ business**, not a made-over template  | Every page is hand-built from an approved design — no page builders, no bloat                                 |
| **A site that looks exactly like the design you signed off on** | An automated "fidelity gate" compares every section to the approved design on every build (more below)        |
| **A site that loads fast**                                      | Performance budgets are enforced in our pipeline — if a change makes it slower, the build fails               |
| **A site everyone can use**                                     | Accessibility (WCAG 2.1 AA) is checked automatically, not left to chance                                      |
| **A site Google can find**                                      | SEO, structured data, sitemaps and social previews are built in from day one                                  |
| **Content _you_ own and can edit**                              | Your content lives in your own repository and is editable in your browser — no monthly CMS server, no lock-in |
| **A site that works for everyone**                              | It stays fully usable even on slow connections or older devices                                               |

---

## How we guarantee the quality — our methodology

We build software the way serious engineering teams do: **write down what "done" means, then let the machine prove it.** Nothing ships on opinion.

### 1. The design is the contract

The single biggest reason websites disappoint is that the finished product drifts from the design. We eliminate that: our pipeline takes the **approved design** and, for every section of the site, **automatically compares the built page against it pixel-by-pixel**. If a change makes the site stray from the design beyond a tight tolerance, the build **fails** and never reaches you. The design is the judge — not us.

### 2. Spec-driven + test-driven

Every feature starts as a written specification with clear, testable requirements. Each requirement is linked to an **automated test**, and a traceability report proves that no approved requirement is left untested. In practice: nothing is "probably fine" — it's verified.

### 3. Quality gates that can't be skipped

Before any change is accepted, it must pass **all** of these automatically:

| Gate                                   | What it protects                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| **Design fidelity**                    | The site matches the approved design, section by section                     |
| **Accessibility (WCAG 2.1 AA)**        | Real people — including those using screen readers or keyboards — can use it |
| **Performance (Lighthouse budgets)**   | The site stays fast; regressions block the build                             |
| **Correctness (660+ automated tests)** | Features keep working as the site grows                                      |
| **Code quality & types**               | The codebase stays maintainable and safe to change                           |

### 4. Content you control — no lock-in

Your website's content lives in **your own repository** and is edited through a simple in-browser admin panel. There's no always-on database server to pay for month after month, and if you ever leave, **you keep everything**. That's the "You Own Everything" promise, built into the architecture.

### 5. Built to last

The site is engineered with small, single-purpose components and a strict design system, so it stays fast, consistent, and easy to extend as your business grows.

---

## Tech stack

- **[Astro 5](https://astro.build)** — modern, fast-by-default web framework (server-rendered, minimal JavaScript)
- **TypeScript** (strict) + **Zod** — type-safe from content to code
- **Content Collections + git-based CMS** — editable content, versioned, no server to maintain
- **Playwright** — automated visual fidelity + accessibility checks
- **Vitest** — 660+ unit/integration tests
- **Turborepo + pnpm** — fast, cache-aware monorepo builds
- **Docker + automated CI/CD** — every change is validated and deployed through a repeatable pipeline

---

## Run it locally

```bash
# Requirements: Node 22, pnpm 9
pnpm install
pnpm dev            # http://localhost:4321
```

Useful scripts:

```bash
pnpm build          # production build
pnpm test           # unit + integration tests
pnpm lint           # linting
pnpm type-check     # TypeScript
```

Content editing (in-browser admin) is available at `/admin` — content is saved straight back to the repository.

---

## Project status

The site is **live-quality (M0 complete)**: all sections built and verified against the design, content is CMS-editable, and SEO, performance, accessibility, and lead capture are in place. Continuous deployment to a staging environment is being rolled out.

---

## About SolidGraph

We build websites for local businesses that want to be found and trusted online — **built from scratch, fast to deliver, honestly priced, and fully yours.**

> _Want a website built to this standard? Reach out through [solidgraph.io](https://solidgraph.io)._

---

<div align="center">
<sub>© SolidGraph Solutions LLC. All rights reserved. This repository is published as a demonstration of our engineering standards.</sub>
</div>
