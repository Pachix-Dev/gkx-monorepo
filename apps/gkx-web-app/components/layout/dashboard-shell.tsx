"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/use-auth";
import { DASHBOARD_NAV_ITEMS, DASHBOARD_NAV_SECTIONS } from "@/lib/contracts/dashboard-nav";

type DashboardShellProps = {
  children: React.ReactNode;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const IconMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("gkx_sidebar_collapsed") === "1";
  });

  useEffect(() => {
    window.localStorage.setItem("gkx_sidebar_collapsed", isSidebarCollapsed ? "1" : "0");
  }, [isSidebarCollapsed]);
  
  // Close mobile drawer on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close mobile drawer when resizing to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const visibleNavItems = useMemo(() => {
    if (!user) return [];
    return DASHBOARD_NAV_ITEMS.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(user.role);
    });
  }, [user]);

  const navItemsBySection = useMemo(() => {
    return DASHBOARD_NAV_SECTIONS.map((section) => {
      const items = visibleNavItems.filter((item) => item.section === section.key);
      return { ...section, items };
    }).filter((section) => section.items.length > 0);
  }, [visibleNavItems]);

  const currentPageLabel = useMemo(() => {
    return visibleNavItems.find((item) => pathname === item.href)?.label ?? "Dashboard";
  }, [pathname, visibleNavItems]);

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.replace("/login");
  };

  // Mobile drawer always shows expanded; desktop respects collapse state
  const isCollapsed = isSidebarCollapsed && !isMobileMenuOpen;

  const sidebarInner = (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo + collapse toggle */}
      <div className={`flex shrink-0 items-center p-4 pb-3 ${isCollapsed ? "justify-center" : "justify-between"}`}>
        {isCollapsed ? (
          <span className="text-sm font-bold tracking-widest text-background">GK</span>
        ) : (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-background/40">GKX</p>
            <p className="text-base font-semibold leading-tight text-background">Workspace</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((c) => !c)}
          className="hidden h-7 w-7 items-center justify-center rounded-md text-background/50 transition hover:bg-background/10 hover:text-background lg:flex"
          aria-label={isSidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {isSidebarCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
        </button>
      </div>

      {/* User section */}
      <div className={`mx-3 mb-4 shrink-0 rounded-lg border border-background/10 bg-background/5 p-2.5 ${isCollapsed ? "flex justify-center" : ""}`}>
        {isCollapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {getInitials(user?.fullName ?? "?")}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {getInitials(user?.fullName ?? "?")}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-tight text-background">{user?.fullName}</p>
              <p className="text-[11px] leading-tight text-background/45">{user?.role}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2" aria-label="Navegación principal">
        <div className={isCollapsed ? "space-y-1" : "space-y-4"}>
          {navItemsBySection.map((section) => (
            <div key={section.key}>
              {!isCollapsed && (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-background/35">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href;

                  if (!item.implemented) {
                    return (
                      <div
                        key={item.href}
                        aria-disabled="true"
                        title={item.label}
                        className={`flex items-center rounded-md px-2 py-2 text-sm text-background/25 ${isCollapsed ? "justify-center" : "justify-between"}`}
                      >
                        {isCollapsed ? (
                          <span className="text-xs font-medium">{item.label[0]}</span>
                        ) : (
                          <>
                            <span>{item.label}</span>
                            <span className="text-[9px] font-semibold uppercase tracking-widest text-background/20">Soon</span>
                          </>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                        isCollapsed ? "justify-center" : ""
                      } ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-background/70 hover:bg-background/10 hover:text-background"
                      }`}
                    >
                      {isCollapsed ? (
                        <span className="text-xs font-semibold">{item.label[0]}</span>
                      ) : (
                        <span>{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-background/10 p-2">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Cerrar sesión"
          className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-background/55 transition hover:bg-background/10 hover:text-background disabled:opacity-50 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <IconLogout />
          {!isCollapsed && <span>{isLoggingOut ? "Saliendo..." : "Cerrar sesión"}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted text-foreground">
      {/* ── Mobile top bar ───────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-foreground px-4 lg:hidden">
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-background/70 transition hover:bg-background/10 hover:text-background"
        >
          <IconMenu />
        </button>

        <span className="text-sm font-semibold text-background">{currentPageLabel}</span>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          {getInitials(user?.fullName ?? "?")}
        </div>
      </header>

      {/* ── Mobile backdrop ──────────────────────────────────── */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* ── Page layout ──────────────────────────────────────── */}
      <div
        className={`lg:grid lg:min-h-screen lg:transition-[grid-template-columns] lg:duration-300 ${
          isSidebarCollapsed ? "lg:grid-cols-[84px_1fr]" : "lg:grid-cols-[240px_1fr]"
        }`}
      >
        {/* Sidebar: fixed drawer on mobile, grid item on desktop */}
        <aside
          aria-label="Menú lateral"
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-foreground transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:w-auto lg:translate-x-0 lg:transition-none ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Mobile-only close button */}
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-background/60 transition hover:bg-background/10 hover:text-background lg:hidden"
          >
            <IconX />
          </button>

          {sidebarInner}
        </aside>

        {/* Main content */}
        <main className="flex min-h-screen flex-col gap-4 p-4 pt-18 lg:p-8 lg:pt-8">
          <header className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">GKX Workspace</p>
                <h2 className="text-xl font-semibold text-card-foreground">{currentPageLabel}</h2>
              </div>
              <div className="text-right">
                <p className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                  {user?.role}
                </p>
                <p className="mt-1 text-xs capitalize text-muted-foreground">{todayLabel}</p>
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}