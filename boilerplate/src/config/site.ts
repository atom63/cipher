import { socialsByName } from "./links";

export const siteConfig = {
  name: "Cipher",
  description:
    "Design tokens from Figma to production CSS in one click. Generate, preview, and export a complete token system — colors, typography, spacing, and more.",
  url: "https://usecipher.dev",
  ogImage: "/og.jpg",
  favicon: "/favicons/favicon.ico",
  author: {
    name: "You Zhang (ATOM63)",
    email: socialsByName.email?.url.replace("mailto:", "") ?? "",
    twitter: socialsByName.twitter?.handle ?? "",
  },
  keywords: [
    "design tokens",
    "figma plugin",
    "css variables",
    "design system",
    "color palette",
    "typography scale",
    "tailwind css",
    "design to code",
  ],
  links: {
    twitter: socialsByName.twitter?.url ?? "",
    github: socialsByName.github?.url ?? "",
    linkedin: socialsByName.linkedin?.url ?? "",
    email: socialsByName.email?.url ?? "",
  },
  navigation: {
    main: [
      {
        title: "Home",
        href: "/",
      },
    ],
  },
} as const;
