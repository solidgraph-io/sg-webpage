// Contact form enhancement layer (SPEC-FORM-002) over the PE base of
// SPEC-FORM-001: without JS the form still posts to /api/lead and the server
// answers (redirect); with JS we add real-time validation + state machine.

import {
  isControl,
  validateField,
  validateForm,
  showFieldError,
  clearFieldError,
  showServerErrors,
} from './validate';
import { getFormUi, applyState, type FormState } from './state';

const form = document.querySelector<HTMLFormElement>('.contact-form');
if (form) enhance(form);

function enhance(form: HTMLFormElement): void {
  const ui = getFormUi(form);
  if (!ui) return;

  // We own the error copy (RF-1); only applied with JS, so the no-JS path
  // keeps the browser's native constraint validation (RNF-1).
  form.noValidate = true;

  let state: FormState = 'idle';

  // Validate on blur (focusout bubbles; blur does not)
  form.addEventListener('focusout', (e) => {
    const el = e.target;
    if (!isControl(el)) return;
    const msg = validateField(el);
    if (msg) showFieldError(el, msg);
    else clearFieldError(el);
  });

  // Re-validate while typing only after the field first erred (RF-1)
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (!isControl(el) || el.getAttribute('aria-invalid') !== 'true') return;
    const msg = validateField(el);
    if (msg) showFieldError(el, msg);
    else clearFieldError(el);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state === 'submitting') return; // RF-6: no double submit
    if (!validateForm(form)) return; // stays idle; first error focused (RF-2)

    state = 'submitting';
    applyState(ui, state);

    const r = await fetch('/api/lead', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    }).catch(() => null);

    if (r?.ok) {
      state = 'success';
      applyState(ui, state); // form replaced by the confirmation card (RF-4)
      return;
    }

    // RF-3: error re-enables the form with server errors painted; retry allowed
    state = 'error';
    applyState(ui, state);
    const body = r
      ? ((await r.json().catch(() => ({}))) as { errors?: Record<string, string[]> })
      : undefined;
    showServerErrors(form, body?.errors ?? { message: ['Network error. Please try again.'] });
  });
}
