// Single source of truth for the external contact destinations. Each language
// has its own Google Form, so the URL is keyed by locale. The nav, hero, and
// contact-section CTAs receive the resolved URL as a prop from their page, so
// the links are never repeated across components.
export const CONTACT_FORM_URLS = {
  en: "https://forms.gle/EjUHfZocCxnCVXs28",
  de: "https://forms.gle/exDsX7n9q11Uk2v66",
} as const;

export type Locale = keyof typeof CONTACT_FORM_URLS;
