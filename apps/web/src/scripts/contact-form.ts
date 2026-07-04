// Progressive enhancement for Contact form — SPEC-FORM-001/RF-4,RF-5,RNF-1
// Intercepts submit, uses fetch+JSON, shows inline success/errors (a11y).
// Without JS the form posts to /api/lead normally (server redirect fallback).

const form = document.querySelector<HTMLFormElement>('.contact-form');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);
    const r = await fetch('/api/lead', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    }).catch(() => null);
    if (!r) { setFieldErrors(form, { message: ['Network error. Please try again.'] }); return; }
    const data: { ok?: boolean; errors?: Record<string, string[]> } = await r.json() as never;
    if (r.ok) { showSuccess(); return; }
    setFieldErrors(form, data.errors ?? {});
  });
}

function showSuccess(): void {
  const el = document.getElementById('successMsg');
  if (!el) return;
  el.style.display = 'block';
  el.focus();
  const f = document.querySelector<HTMLFormElement>('.contact-form');
  if (f) f.inert = true;
}

function setFieldErrors(form: HTMLFormElement, errors: Record<string, string[]>): void {
  const first = Object.keys(errors)[0];
  for (const [f, msgs] of Object.entries(errors)) {
    const inp = form.querySelector<HTMLElement>(`#${f}`);
    if (!inp) continue;
    inp.setAttribute('aria-invalid', 'true');
    const eid = `${f}_err`;
    let err = document.getElementById(eid);
    if (!err) {
      err = document.createElement('span');
      err.id = eid;
      err.className = 'field-error';
      inp.parentElement?.append(err);
    }
    inp.setAttribute('aria-describedby', eid);
    err.textContent = msgs[0] ?? 'Invalid';
  }
  if (first) form.querySelector<HTMLElement>(`#${first}`)?.focus();
}

function clearErrors(form: HTMLFormElement): void {
  form.querySelectorAll('[aria-invalid]').forEach((el) => {
    const id = (el as HTMLElement).id;
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
    document.getElementById(`${id}_err`)?.remove();
  });
}
