// Form UI state machine (SPEC-FORM-002/RF-3, RF-4, RF-6) — vanilla, no libraries.
// States: idle → submitting → success | error (error re-enables retry).

export type FormState = 'idle' | 'submitting' | 'success' | 'error';

export interface FormUi {
  form: HTMLFormElement;
  button: HTMLButtonElement;
  label: HTMLElement | null; // <span> inside the submit button
  card: HTMLElement | null; // confirmation card (#confirmCard)
}

export function getFormUi(form: HTMLFormElement): FormUi | null {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!button) return null;
  return {
    form,
    button,
    label: button.querySelector('span'),
    card: document.getElementById('confirmCard'),
  };
}

/** Reflect a state on the UI. Labels come from markup data, never hardcoded here. */
export function applyState(ui: FormUi, state: FormState): void {
  const { button, label } = ui;
  const submitting = state === 'submitting';

  button.disabled = submitting; // anti double-submit (RF-6)
  if (label) {
    if (!button.hasAttribute('data-idle-label')) {
      button.setAttribute('data-idle-label', label.textContent ?? '');
    }
    const next = submitting
      ? button.getAttribute('data-submitting-label')
      : button.getAttribute('data-idle-label');
    if (next !== null) label.textContent = next;
  }

  if (state === 'success') showConfirmation(ui);
}

/** The confirmation card replaces the form (RF-4): status role announces, focus moves. */
function showConfirmation({ form, card }: FormUi): void {
  if (!card) return;
  form.hidden = true;
  card.hidden = false;
  card.focus();
}
