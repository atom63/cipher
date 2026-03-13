/**
 * Social media links and contact information
 */

export interface SocialLink {
  handle?: string;
  name: string;
  url: string;
}

export const socials: SocialLink[] = [
  {
    name: "Twitter",
    handle: "",
    url: "",
  },
  {
    name: "GitHub",
    handle: "youzhang",
    url: "https://github.com/youzhang",
  },
  {
    name: "LinkedIn",
    handle: "",
    url: "",
  },
  {
    name: "Email",
    url: "",
  },
];

/**
 * Socials lookup by name for easy access
 */
export const socialsByName = {
  twitter: socials[0],
  github: socials[1],
  linkedin: socials[2],
  email: socials[3],
} as const;
