import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, PawPrint, Bell, LogOut, Settings, Menu, LogIn, UserPlus, Warehouse } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useNavigation } from "@/contexts/navigation-context";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/animals", icon: PawPrint, label: "Animals" },
  { href: "/alerts", icon: Bell, label: "Alerts" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function NavLink({
  href, icon: Icon, label, active, onClick,
}: {
  href: string; icon: React.ElementType; label: string; active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary" />
      )}
      <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
      {label}
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, isAuthenticated } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const { hasNavigated, markNavigated, resetNavigation } = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isLanding = !hasNavigated && !isAuthenticated && location === "/";

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col md:flex-row">

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex w-56 shrink-0 flex-col border-r border-border z-10 h-full"
        style={{ background: "hsl(var(--sidebar))" }}
      >
        {/* Brand */}
        <Link href="/" className="px-5 py-5 flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <Warehouse className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-foreground">RanchPad</span>
        </Link>

        <nav className="flex-1 px-3 pb-4 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
              onClick={markNavigated}
            />
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          {isAuthenticated ? (
            <button
              onClick={() => { resetNavigation(); logout(); }}
              className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={openSignup}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md shadow-primary/30"
              >
                <UserPlus className="w-3.5 h-3.5" /> Sign Up Free
              </button>
              <button
                onClick={openLogin}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-white/5 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" /> Log In
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Slide-Out Menu ───────────────────────────────────────── */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 flex flex-col border-r border-border"
          style={{ background: "hsl(var(--sidebar))" }}
        >
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Warehouse className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-foreground">RanchPad</span>
          </div>

          <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href)}
                onClick={() => { markNavigated(); setMenuOpen(false); }}
              />
            ))}
          </nav>

          <div className="px-3 py-4 border-t border-border">
            {isAuthenticated ? (
              <button
                onClick={() => { setMenuOpen(false); resetNavigation(); logout(); }}
                className="flex items-center gap-2.5 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setMenuOpen(false); openSignup(); }}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md shadow-primary/30"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Sign Up Free
                </button>
                <button
                  onClick={() => { setMenuOpen(false); openLogin(); }}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-white/5 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" /> Log In
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-2 px-3 h-12 border-b border-border sticky top-0 z-20" style={{ background: "hsl(var(--sidebar))" }}>
          <button
            onClick={() => setMenuOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
            <Warehouse className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-base text-foreground">RanchPad</span>
          </Link>
        </header>

        <div className={cn("flex-1 overflow-y-auto", isLanding ? "flex flex-col" : "p-5 md:p-8")}>
          <div className={cn("w-full", isLanding ? "flex-1 flex flex-col" : "max-w-5xl mx-auto")}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
