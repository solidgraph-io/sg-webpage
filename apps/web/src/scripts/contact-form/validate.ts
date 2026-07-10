// Field validation + accessible error painting (SPEC-FORM-002/RF-1, RF-2).
// Mirrors the server LeadSchema (INV-1): the client paints early feedback with
// native constraint validation; the server re-validates every submission.

export type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// Own messages, verbatim from lead-schema.ts (the form runs novalidate; the
// browser's built-in error copy is never shown)
const MESSAGES: Record<string, string> = {
  first_name: 'First name is required',
  last_name: 'Last name is required',
  email: 'Valid email required',
  business_name: 'Business name is required',
  city: 'City is required',
};

export function isControl(el: unknown): el is FormControl {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  );
}

/** null = valid. phone is optional/lax (type=tel has no native format rule). */
export function validateField(el: FormControl): string | null {
  if (el.name === '_gotcha') return null; // honeypot is never validated client-side
  if (el.validity.valid) return null;
  return MESSAGES[el.name] ?? 'Invalid value';
}

export function showFieldError(el: FormControl, message: string): void {
  el.setAttribute('aria-invalid', 'true');
  const errId = `${el.id}_err`;
  let err = document.getElementById(errId);
  if (!err) {
    err = document.createElement('span');
    err.id = errId;
    err.className = 'field-error';
    el.parentElement?.append(err);
  }
  el.setAttribute('aria-describedby', errId);
  err.textContent = message;
}

export function clearFieldError(el: FormControl): void {
  el.removeAttribute('aria-invalid');
  el.removeAttribute('aria-describedby');
  document.getElementById(`${el.id}_err`)?.remove();
}

/** Validate all controls, paint results, focus the first invalid one. */
export function validateForm(form: HTMLFormElement): boolean {
  let first: FormControl | null = null;
  for (const el of Array.from(form.elements)) {
    if (!isControl(el) || el.name === '_gotcha') continue;
    const msg = validateField(el);
    if (msg) {
      showFieldError(el, msg);
      first ??= el;
    } else {
      clearFieldError(el);
    }
  }
  first?.focus();
  return first === null;
}

/** Paint server errors ({ field: [messages] }) — the server stays source of truth. */
export function showServerErrors(form: HTMLFormElement, errors: Record<string, string[]>): void {
  let first: FormControl | null = null;
  for (const [name, msgs] of Object.entries(errors)) {
    const el = form.querySelector(`#${CSS.escape(name)}`);
    if (!isControl(el)) continue;
    showFieldError(el, msgs[0] ?? 'Invalid value');
    first ??= el;
  }
  first?.focus();
}
