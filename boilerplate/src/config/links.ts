export interface SocialLink {
  handle?: string;
  iconify: string;
  name: string;
  url: string;
}

export const socials: SocialLink[] = [
  {
    name: "Email",
    url: "mailto:hello.youzhang@gmail.com",
    iconify: "mdi:email",
    handle: "hello.youzhang@gmail.com",
  },
  {
    name: "Behance",
    url: "https://www.behance.net/youzhang",
    iconify: "mdi:behance",
    handle: "youzhang",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/atom63_/",
    iconify: "mdi:instagram",
    handle: "@atom63_",
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/in/you-zhang/",
    iconify: "mdi:linkedin",
    handle: "you-zhang",
  },
  {
    name: "Twitter",
    url: "https://twitter.com/yz_atom63",
    iconify: "mdi:twitter",
    handle: "@yz_atom63",
  },
  {
    name: "GitHub",
    url: "https://github.com/atom63",
    iconify: "mdi:github",
    handle: "atom63",
  },
  {
    name: "GitHub Repo",
    url: "https://github.com/atom63/cipher-boilerplate",
    iconify: "mdi:github",
    handle: "cipher-boilerplate",
  }
];

export const socialsByName = socials.reduce(
  (acc, social) => {
    acc[social.name.toLowerCase()] = social;
    return acc;
  },
  {} as Record<string, SocialLink>
);

export const primarySocials = socials;
