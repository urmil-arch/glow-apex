export type MenuLink = {
  id: number;
  title: string;
  href: string;
  type: "link";
};

export type MenuGroup = {
  id: number;
  title: string;
  type: "menu";
  items: MenuLink[];
};

export type MenuItem = MenuLink | MenuGroup;

export const youtubeServiceItems: MenuLink[] = [
  {
    id: 31,
    title: "YouTube Views",
    href: "/buy-youtube-views",
    type: "link",
  },
  {
    id: 32,
    title: "YouTube Subscriber",
    href: "/buy-youtube-subscribers",
    type: "link",
  },
  {
    id: 33,
    title: "YouTube Likes",
    href: "/buy-youtube-video-likes",
    type: "link",
  },
  {
    id: 34,
    title: "YouTube Comments",
    href: "/buy-youtube-comments",
    type: "link",
  },
  {
    id: 35,
    title: "YouTube Shorts Likes",
    href: "/buy-youtube-shorts-likes",
    type: "link",
  },
  {
    id: 36,
    title: "YouTube Shorts Views",
    href: "/buy-youtube-shorts-views",
    type: "link",
  },
];

export const getActiveServiceMenuItems = (pathname: string): MenuItem[] => {
  const activeService =
    youtubeServiceItems.find((item) => item.href === pathname) ??
    youtubeServiceItems[0];

  return [
    activeService,
    {
      id: 4,
      title: "Other YouTube Services",
      type: "menu",
      items: youtubeServiceItems.filter((item) => item.href !== activeService.href),
    },
  ];
};

export const menuitems: MenuItem[] = [
  {
    id: 1,
    title: "Home",
    href: "/",
    type: "link",
  },
  ...getActiveServiceMenuItems("/buy-youtube-views"),
  {
    id: 7,
    title: "Blogs",
    href: "/blogs",
    type: "link",
  },
  {
    id: 8,
    title: "Contact",
    href: "/contact-us",
    type: "link",
  },
];
