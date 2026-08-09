// Non-CMS user-facing strings and the EN/DE route table.
// CMS-authored copy belongs in src/content/landing/*.

export type Locale = "en" | "de";

export const LOCALES = ["en", "de"] as const satisfies readonly Locale[];

export const HOME_HREF: Record<Locale, string> = {
  en: "/",
  de: "/de/",
};

/** Slugs differ per locale, so the pairing is declared, not derived. */
export const LEGAL_ROUTES = {
  privacy: { en: "/privacy", de: "/de/datenschutz" },
  imprint: { en: "/imprint", de: "/de/impressum" },
} as const;

export type LegalDoc = keyof typeof LEGAL_ROUTES;

export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "de" : "en";
}

export const UI = {
  en: {
    nav: {
      services: "Services",
      about: "About",
      workshops: "Workshops",
      testimonials: "Testimonials",
    },
    backToTop: "Back to top",
    footer: {
      tagline: "Intercultural Communication & Collaboration",
      privacyLabel: "Privacy Policy",
      imprintLabel: "Imprint",
      linkedInLabel: "LinkedIn profile",
    },
    legal: {
      backLabel: "Back to Home",
      homeAriaLabel: "CultureWithGen - home",
      descriptions: {
        privacy:
          "Privacy policy for CultureWithGen - how your data is handled when you visit the site or get in touch.",
        imprint:
          "Imprint and legal information for CultureWithGen intercultural communication training.",
      },
    },
    seo: {
      title: "Genevieve Navisotschnig | CultureWithGen",
      description:
        "Practical intercultural communication workshops with Genevieve Navisotschnig for international teams - in-company and online. Get in touch today.",
    },
    schema: {
      jobTitle: "Intercultural Communication Trainer",
      serviceType: "Intercultural communication training",
      areaServed: "Austria",
    },
  },
  de: {
    nav: {
      services: "Leistungen",
      about: "Über mich",
      workshops: "Workshops",
      testimonials: "Referenzen",
    },
    backToTop: "Nach oben",
    footer: {
      tagline: "Interkulturelle Kommunikation & Zusammenarbeit",
      privacyLabel: "Datenschutz",
      imprintLabel: "Impressum",
      linkedInLabel: "LinkedIn-Profil",
    },
    legal: {
      backLabel: "Zurück zur Startseite",
      homeAriaLabel: "CultureWithGen - Startseite",
      descriptions: {
        privacy:
          "Datenschutzerklärung von CultureWithGen - wie Ihre Daten beim Besuch der Website und bei der Kontaktaufnahme behandelt werden.",
        imprint:
          "Impressum und rechtliche Angaben zu CultureWithGen - interkulturelles Kommunikationstraining.",
      },
    },
    seo: {
      title: "Genevieve Navisotschnig | CultureWithGen",
      description:
        "Praxisorientierte Workshops für interkulturelle Kommunikation mit Genevieve Navisotschnig für internationale Teams - inhouse und online. Kontaktieren Sie mich noch heute.",
    },
    schema: {
      jobTitle: "Interkulturelle Kommunikationstrainerin",
      serviceType: "Interkulturelles Kommunikationstraining",
      areaServed: "Österreich",
    },
  },
} as const satisfies Record<Locale, unknown>;

export const LINKEDIN_URL = "https://www.linkedin.com/in/culture-with-gen/";
