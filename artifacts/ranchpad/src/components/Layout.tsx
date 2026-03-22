import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, PawPrint, Bell, LogOut, Settings, Menu, LogIn, UserPlus } from "lucide-react";
import { HoofIcon } from "@/components/HoofIcon";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/animals", icon: PawPrint, label: "Animals" },
  { href: "/alerts", icon: Bell, label: "Alerts" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, isAuthenticated } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card z-10">
        <Link href="/" className="px-5 py-5 flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <HoofIcon className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-foreground">RanchPad</span>
        </Link>

        <nav className="flex-1 px-3 pb-4 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", isActive(item.href) ? "text-primary" : "text-muted-foreground")} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={openSignup}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" /> Sign Up Free
              </button>
              <button
                onClick={openLogin}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" /> Log In
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Slide-Out Menu ───────────────────────────────────────── */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-64 p-0 flex flex-col bg-card">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <HoofIcon className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-foreground">RanchPad</span>
          </div>

          <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-4 h-4 shrink-0", isActive(item.href) ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="px-3 py-4 border-t border-border">
            {isAuthenticated ? (
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="flex items-center gap-2.5 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setMenuOpen(false); openSignup(); }}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Sign Up Free
                </button>
                <button
                  onClick={() => { setMenuOpen(false); openLogin(); }}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" /> Log In
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col max-w-[100vw] overflow-x-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-2 px-3 h-12 bg-card border-b border-border sticky top-0 z-20">
          <button
            onClick={() => setMenuOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
            <HoofIcon className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-base text-foreground">RanchPad</span>
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
