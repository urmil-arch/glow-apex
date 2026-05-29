import { Link } from "react-router-dom";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { Bell, ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";
import NotificationPanel, { type NotifItem } from "./common/notification-panel";

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

  // ── Notifications ──────────────────────────────────────────────────────────
  const [notifications, setNotifications]       = useState<NotifItem[]>([]);
  const [acknowledgedIds, setAcknowledgedIds]   = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpen]               = useState(false);
  const notifRef                                 = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !acknowledgedIds.has(n.id)).length;

  const handleOpenPanel = () => {
    setPanelOpen(prev => {
      if (!prev) {
        setAcknowledgedIds(ids => new Set([...ids, ...notifications.map(n => n.id)]));
      }
      return !prev;
    });
  };

  const pollNotifications = useCallback(async () => {
    if (!user) return;
    try {
      if (user.is_admin) {
        const [ticketsRes, msgsRes] = await Promise.all([
          api.get<{ tickets: { id: string; user_username: string; subject: string; updated_at: string; admin_has_unread: boolean }[] }>(
            API_ENDPOINTS.ADMIN_SUPPORT_TICKETS, { params: { page_size: 50 } }
          ),
          api.get<{ messages: { id: string; name: string; subject: string; created_at: string; is_read: boolean }[] }>(
            API_ENDPOINTS.ADMIN_SUPPORT_MESSAGES
          ),
        ]);

        const ticketNotifs: NotifItem[] = (ticketsRes.data.tickets ?? [])
          .filter(t => t.admin_has_unread)
          .map(t => ({
            id: t.id,
            type: 'new_ticket' as const,
            title: `New ticket from ${t.user_username}`,
            body: t.subject,
            href: '/admin/support',
            created_at: t.updated_at,
          }));

        const msgNotifs: NotifItem[] = (msgsRes.data.messages ?? [])
          .filter(m => !m.is_read)
          .map(m => ({
            id: `msg-${m.id}`,
            type: 'new_message' as const,
            title: `New message from ${m.name}`,
            body: m.subject,
            href: '/admin/support',
            created_at: m.created_at,
          }));

        setNotifications([...ticketNotifs, ...msgNotifs]);
      } else {
        const res = await api.get<{ tickets: { id: string; subject: string; updated_at: string; user_has_unread: boolean }[] }>(
          API_ENDPOINTS.TICKETS
        );
        const tickets = res.data.tickets ?? [];
        const unread = tickets.filter(t => t.user_has_unread);
        setNotifications(unread.map(t => ({
          id: t.id,
          type: 'ticket_reply' as const,
          title: 'Admin replied to your ticket',
          body: t.subject,
          href: `/dashboard/tickets/${t.id}`,
          created_at: t.updated_at,
        })));
      }
    } catch { /* silent — non-critical */ }
  }, [user]);

  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    pollNotifications();
    const interval = setInterval(pollNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, pollNotifications]);

  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen]);

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
    // { id: 2, title: "Services", href: "/services", type: "link" },
    { id: 3, title: "YouTube Views", href: "/buy-youtube-views", type: "link" },
    {
      id: 4,
      title: "Other YouTube Services",
      type: "menu",
      items: [
        { id: 41, title: "YouTube Subscriber", href: "/buy-youtube-subscribers" },
        { id: 42, title: "YouTube Likes", href: "/buy-youtube-video-likes" },
        { id: 43, title: "YouTube Comments", href: "/buy-youtube-comments" },
        { id: 44, title: "YouTube Shorts Likes", href: "/buy-youtube-shorts-likes" },
        { id: 45, title: "YouTube Shorts Views", href: "/buy-youtube-shorts-views" },
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
        <div className="w-full px-4 sm:px-8 flex items-center justify-between">
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

            {/* Notification bell */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={handleOpenPanel}
                  className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </button>
                {panelOpen && (
                  <NotificationPanel
                    items={notifications}
                    onClose={() => setPanelOpen(false)}
                    onClearAll={() => { setNotifications([]); setPanelOpen(false); }}
                    onRemove={id => setNotifications(prev => prev.filter(n => n.id !== id))}
                  />
                )}
              </div>
            )}

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
