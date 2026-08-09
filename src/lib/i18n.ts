/**
 * Every user-facing string that is NOT editable in the CMS, plus the route
 * table that pairs the two languages.
 *
 * Before this module the same job was done four different ways - literals in
 * the page files, a `COPY` map in Footer.astro, a ternary in BackToTop.astro,
 * and more ternaries in StructuredData.astro - and the /privacy <-> the German
 * /datenschutz pairing was restated in three files that all had to agree for
 * hreflang to be correct. One place now.
 *
 * CMS-authored copy does not belong here; it lives in src/content/landing/*.
 */

export type Locale = "en" | "de";

export const LOCALES = ["en", "de"] as const satisfies readonly Locale[];

/** Home page of each language. */
export const HOME_HREF: Record<Locale, string> = {
  en: "/",
  de: "/de/",
};

/**
 * Legal documents and their path in each language. The slugs differ between
 * locales (/imprint vs /de/impressum), so the pairing cannot be derived by
 * prefixing - it has to be declared, and declared exactly once.
 */
export const LEGAL_ROUTES = {
  privacy: { en: "/privacy", de: "/de/datenschutz" },
  imprint: { en: "/imprint", de: "/de/impressum" },
} as const;

export type LegalDoc = keyof typeof LEGAL_ROUTES;

/** The other language - used for og:locale:alternate and the switcher. */
export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "de" : "en";
}

export const UI = {
  en: {
    /** Section links in the header. Overridable per-site via the CMS. */
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
    /** Fallbacks when the CMS `seo` override is blank. */
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

/** External profile links. */
export const LINKEDIN_URL = "https://www.linkedin.com/in/culture-with-gen/";
