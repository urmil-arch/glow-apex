import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { MobileMenu } from "./common/mobile-menu";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

const currencies: Currency[] = [
  { code: "USD", symbol: "$", name: "USD" },
  { code: "INR", symbol: "₹", name: "INR" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies[0]);

  useEffect(() => {
    const savedCurrency = localStorage.getItem("currency");
    if (savedCurrency) {
      try {
        const parsed = JSON.parse(savedCurrency);
        if (parsed?.code && parsed?.symbol) setSelectedCurrency(parsed);
      } catch {
        setSelectedCurrency(currencies[0]);
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency);
    localStorage.setItem("currency", JSON.stringify(currency));
    window.location.reload();
  };

  const menuitems = [
    { id: 1, title: "Home", href: "/", type: "link" },
    { id: 5209, title: "YouTube Views", href: "/5648/buy-youtube-views", type: "link" },
    {
      id: 3,
      title: "Other YouTube Services",
      type: "menu",
      items: [
        { id: 376, title: "YouTube Subscriber", href: "/376/buy-youtube-subscribers" },
        { id: 2342, title: "YouTube Likes", href: "/2342/buy-youtube-video-likes" },
        { id: 5649, title: "YouTube Comments", href: "/5649/buy-youtube-comments" },
        { id: 242, title: "YouTube Shorts Likes", href: "/2342/buy-youtube-shorts-likes" },
        { id: 232, title: "YouTube Shorts Views", href: "/5648/buy-youtube-shorts-views" },
      ],
    },
    { id: 7, title: "Blogs", href: "/blogs", type: "link" },
  ];

  function renderMenuItems(menuItem: { id: number; title: string; href?: string; type: string; items?: { id: number; title: string; href: string }[] }) {
    if (menuItem.href === "/") return null;

    switch (menuItem.type) {
      case "link":
        return (
          <li key={menuItem.id} className="px-3 py-2.5">
            <Link className="nav-link capitalize !text-base" to={menuItem.href!}>
              {menuItem.title}
            </Link>
          </li>
        );
      case "menu":
        return (
          <li key={menuItem.id}>
            <Menubar className="p-0 shadow-none bg-none">
              <MenubarMenu>
                <MenubarTrigger className="transition-colors flex items-center justify-center text-base">
                  {menuItem.title} <ChevronDown />
                </MenubarTrigger>
                <MenubarContent className="rounded-xl border-none bg-background/10 backdrop-blur-2xl">
                  {menuItem.items!.map((item) => (
                    <MenubarItem
                      key={item.id}
                      onClick={() => navigate(item.href)}
                      className="cursor-pointer"
                    >
                      {item.title}
                    </MenubarItem>
                  ))}
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </li>
        );
      default:
        return null;
    }
  }

  return (
    <>
      <header
        className={`fixed top-0 right-0 left-0 w-full z-40 transition-all duration-300 ease-in-out ${
          isScrolled
            ? "bg-white dark:bg-[#06060650] backdrop-blur-3xl shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between">
          <Link className="py-7" to="/">
            <h1 className="text-xl font-bold">
              <img src="/web-app-manifest-192x192-removebg-preview.png" alt="Logo" width={50} height={50} />
            </h1>
          </Link>

          <div className="flex items-center justify-end gap-4">
            <ul className="xl:flex hidden items-center justify-end">
              {menuitems.map((menuItem) => renderMenuItems(menuItem))}
              <li></li>
            </ul>

            <button
              onClick={() => navigate("/contact-us")}
              className="w-fit flex items-center justify-center py-1 px-3 rounded-full text-white font-medium transition-all bg-emerald-700 cursor-pointer text-sm"
            >
              Contact
            </button>

            <Menubar>
              <MenubarMenu>
                <MenubarTrigger className="transition-colors flex items-center justify-center bg-emerald-700 text-white rounded-full gap-2 py-1 px-3 text-sm">
                  {selectedCurrency.symbol} {selectedCurrency.name}
                </MenubarTrigger>
                <MenubarContent className="rounded-xl border-none bg-background/10 backdrop-blur-2xl text-sm">
                  {currencies.map((currency) => (
                    <MenubarItem
                      key={currency.code}
                      onClick={() => handleCurrencyChange(currency)}
                      className={`cursor-pointer ${
                        selectedCurrency.code === currency.code
                          ? "bg-emerald-50 text-emerald-600 font-medium"
                          : ""
                      }`}
                    >
                      {currency.symbol} ({currency.name})
                    </MenubarItem>
                  ))}
                </MenubarContent>
              </MenubarMenu>
            </Menubar>

            <div>
              {user ? (
                <Menubar className="p-0 border-none shadow-none bg-transparent">
                  <MenubarMenu>
                    <MenubarTrigger className="p-0 rounded-full cursor-pointer focus:bg-transparent data-[state=open]:bg-transparent">
                      <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>
                          {user.full_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </MenubarTrigger>
                    <MenubarContent className="rounded-xl border-none bg-white/90 backdrop-blur-2xl shadow-lg min-w-[160px]">
                      <MenubarItem
                        onClick={() => navigate("/dashboard")}
                        className="cursor-pointer gap-2 py-2.5"
                      >
                        <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                        Dashboard
                      </MenubarItem>
                      <MenubarItem
                        onClick={logout}
                        className="cursor-pointer gap-2 py-2.5 text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </MenubarItem>
                    </MenubarContent>
                  </MenubarMenu>
                </Menubar>
              ) : (
                <button
                  onClick={() => navigate("/sign-in")}
                  className="w-fit flex items-center justify-center py-1 px-3 rounded-full text-white font-medium transition-all bg-emerald-700 cursor-pointer text-sm"
                >
                  Sign in
                </button>
              )}
            </div>

            <MobileMenu />
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
