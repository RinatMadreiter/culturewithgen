// Single source of truth for the external contact destinations. Each language
// has its own Google Form, so the URL is keyed by locale. The nav, hero, and
// contact-section CTAs receive the resolved URL as a prop from their page, so
// the links are never repeated across components.
import type { Locale } from "./i18n";

export const CONTACT_FORM_URLS: Record<Locale, string> = {
  en: "https://forms.gle/EjUHfZocCxnCVXs28",
  de: "https://forms.gle/exDsX7n9q11Uk2v66",
};
