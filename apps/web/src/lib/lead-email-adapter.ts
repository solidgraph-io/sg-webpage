import type { LeadPort, LeadPayload } from './lead-port';

interface EmailEnv {
  LEAD_PROVIDER?: string | undefined; // resend | postmark  (default: resend)
  LEAD_TO_EMAIL?: string | undefined; // where leads arrive — required at delivery time
  LEAD_FROM_EMAIL?: string | undefined; // sender address (default: leads@solidgraph.io)
  RESEND_API_KEY?: string | undefined; // required when LEAD_PROVIDER=resend
  POSTMARK_SERVER_TOKEN?: string | undefined; // required when LEAD_PROVIDER=postmark
}

function buildText(lead: LeadPayload): string {
  return [
    'New Lead — SolidGraph Website',
    '',
    `Name: ${lead.first_name} ${lead.last_name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone ?? '—'}`,
    `Business: ${lead.business_name}`,
    `City: ${lead.city}`,
    `Plan: ${lead.plan_interest ?? '—'}`,
    '',
    `Message:\n${lead.message ?? '(none)'}`,
  ].join('\n');
}

export function createEmailAdapter(env: EmailEnv): LeadPort {
  const provider = (env.LEAD_PROVIDER ?? 'resend').toLowerCase();
  const from = env.LEAD_FROM_EMAIL ?? 'leads@solidgraph.io';

  return {
    async deliver(lead: LeadPayload): Promise<void> {
      const to = env.LEAD_TO_EMAIL;
      if (!to) throw new Error('LEAD_TO_EMAIL env var is required');

      const subject = `New lead: ${lead.first_name} ${lead.last_name} (${lead.business_name})`;
      const text = buildText(lead);

      if (provider === 'resend') {
        const apiKey = env.RESEND_API_KEY;
        if (!apiKey) throw new Error('RESEND_API_KEY env var is required');
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to, subject, text }),
        });
        if (!res.ok) throw new Error(`Resend error ${res.status}`);
      } else if (provider === 'postmark') {
        const token = env.POSTMARK_SERVER_TOKEN;
        if (!token) throw new Error('POSTMARK_SERVER_TOKEN env var is required');
        const res = await fetch('https://api.postmarkapp.com/email', {
          method: 'POST',
          headers: { 'X-Postmark-Server-Token': token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ From: from, To: to, Subject: subject, TextBody: text }),
        });
        if (!res.ok) throw new Error(`Postmark error ${res.status}`);
      } else {
        throw new Error(`Unknown EMAIL_PROVIDER: "${provider}". Valid values: resend, postmark`);
      }
    },
  };
}
