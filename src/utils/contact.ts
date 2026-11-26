export const CONTACT_EMAIL = 'saicharante505@gmail.com';
export const DESIGNER_NAME = 'M Sai Charan Tej';
export const DESIGNER_SHORT = 'Sai Charan';
export const PRICING_PDF_PATH = '/assets/aistudio/Pricing_Plans_e6d0f9ce.pdf';

// Assembled privately so the phone number is never printed in visible UI copy
const WA_PARTS = ['91', '805', '615', '9323'] as const;

export function buildWhatsAppUrl(message?: string): string {
  const defaultMsg =
    'Hi Sai Charan, I visited your portfolio and would like to discuss a website project.';
  const text = (message && message.trim().length > 0 ? message : defaultMsg).trim();
  const target = WA_PARTS.join('');
  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}

export function buildEmailUrl(subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const query = params.toString();
  return query ? `mailto:${CONTACT_EMAIL}?${query}` : `mailto:${CONTACT_EMAIL}`;
}

export function openWhatsAppChat(message?: string): void {
  const url = buildWhatsAppUrl(message);
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
