import { socialsByName } from "./socials";

export const siteConfig = {
  name: "New Project",
  description: "A sandbox playground for experimenting with ideas.",
  url: "http://localhost:5173",
  ogImage: "/og.jpg",
  favicon: "/favicons/favicon.ico",
  author: {
    name: "You Zhang",
    email: socialsByName.email?.url.replace("mailto:", "") ?? "",
    twitter: socialsByName.twitter?.handle ?? "",
  },
  keywords: ["sandbox", "playground", "experiments"],
  links: {
    twitter: socialsByName.twitter?.url ?? "",
    github: socialsByName.github?.url ?? "https://github.com/youzhang",
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
