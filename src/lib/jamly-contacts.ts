export const JAMLY_EMAILS = {
  main: "main@getjamly.com",
  contact: "contact@getjamly.com",
  hakanefe: "hakanefe@getjamly.com",
  koraykurt: "koraykurt@getjamly.com",
  noreply: "noreply@getjamly.com",
  payment: "payment@getjamly.com",
  social: "social@getjamly.com",
  support: "support@getjamly.com"
} as const;

type MailtoOptions = {
  subject?: string;
  body?: string;
};

export function createMailto(address: string, options: MailtoOptions = {}) {
  const params = new URLSearchParams();
  if (options.subject) params.set("subject", options.subject);
  if (options.body) params.set("body", options.body);
  const query = params.toString();
  return `mailto:${address}${query ? `?${query}` : ""}`;
}
