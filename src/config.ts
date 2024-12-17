import type { Site, SocialObjects } from "./types.ts";

export const SITE: Site = {
  website: "https://ian-quinn.github.io/", // replace this with your deployed domain
  author: "Yikun Yang",
  profile: "",
  desc: "Pensive for dumping memories",
  title: "Garlic",
  ogImage: "Garlic-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 10,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: false,
  showSearch: false,
  editPost: {
    url: "https://github.com/ian-quinn/ian-quinn.github.io/",
    text: "",
    appendFilePath: true,
  },
};

export const LOCALE = {
  lang: "en", // html lang code. Set this empty and default will be "en"
  langTag: ["en-EN"], // BCP 47 Language Tags. Set this empty [] to use the environment default
} as const;

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/ian-quinn/",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "Instagram",
    href: "",
    linkTitle: `${SITE.title} on Instagram`,
    active: true,
  },
];
