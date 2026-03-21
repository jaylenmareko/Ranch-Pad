import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, PawPrint, Bell, LogOut, Settings, Menu, LogIn, UserPlus } from "lucide-react";
import { HoofIcon } from "@/components/HoofIcon";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/animals", icon: PawPrint, label: "Animals" },
  { href: "/alerts", icon: Bell, label: "Alerts" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card shadow-sm z-10">
        <Link href="/" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-inner">
            <HoofIcon className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-primary">RanchPad</span>
        </Link>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive(item.href) ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link href="/login?signup=1" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <UserPlus className="w-4 h-4" /> Sign Up Free
              </Link>
              <Link href="/login" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-border text-muted-foreground hover:bg-muted transition-colors">
                <LogIn className="w-4 h-4" /> Log In
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Slide-Out Menu ───────────────────────────────────────── */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-inner">
              <HoofIcon className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-primary">RanchPad</span>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-4 py-5 flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive(item.href) ? "text-primary-foreground" : "text-muted-foreground")} />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Bottom auth section */}
          <div className="p-4 border-t border-border">
            {isAuthenticated ? (
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login?signup=1" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <UserPlus className="w-4 h-4" /> Sign Up Free
                </Link>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium border border-border text-foreground hover:bg-muted transition-colors">
                  <LogIn className="w-4 h-4" /> Log In
                </Link>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col max-w-[100vw] overflow-x-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 p-4 bg-card border-b border-border sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center text-foreground"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
            <span className="text-[10px] font-semibold leading-none tracking-wide">Menu</span>
          </button>

          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity ml-1">
            <HoofIcon className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-xl text-primary">RanchPad</span>
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
