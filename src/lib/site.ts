/** Contact details and legal constants used across the site. Update before launch. */
export const SITE = {
  name: "Social9",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://social9.s4meer.com",
  supportEmail: "sameer.fyi@hotmail.com",
  privacyEmail: "sameer.fyi@hotmail.com",
  legalEmail: "sameer.fyi@hotmail.com",
  policiesUpdated: "5 October 2026",
  /** Public application repository; the photo-processing engine is in /core. */
  github: "https://github.com/s4meer-git/social9",
};

export const mailto = (to: string, subject?: string) => `mailto:${to}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
