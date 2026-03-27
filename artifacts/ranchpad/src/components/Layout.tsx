import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Home, Bell, LogOut, Settings, Menu, LogIn, UserPlus, Warehouse, Users,
  ChevronRight, Plus, MapPin, CheckCircle2, XCircle, Tractor, UserCog
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useRanch, type RanchInfo } from "@/contexts/ranch-context";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useNavigation } from "@/contexts/navigation-context";
import { SimpleDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

function CowIcon({ className }: { className?: string }) {
  return <span className={className} style={{ fontSize: "1rem", lineHeight: 1, display: "inline-flex", alignItems: "center" }}>🐄</span>;
}

// ── Nav item definition ────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

function getOwnerRanchItems(): NavItem[] {
  return [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/animals", icon: CowIcon, label: "Animals" },
    { href: "/alerts", icon: Bell, label: "Alerts" },
  ];
}

function getViewerItems(): NavItem[] {
  return [
    { href: "/animals", icon: CowIcon, label: "Animals" },
    { href: "/alerts", icon: Bell, label: "Alerts" },
  ];
}

function getPersonalRanchItems(pendingDeleteRequests: number): NavItem[] {
  return [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/animals", icon: CowIcon, label: "Animals" },
    { href: "/alerts", icon: Bell, label: "Alerts" },
    { href: "/settings", icon: Settings, label: "Ranch Settings" },
    { href: "/team", icon: Users, label: "Team", badge: pendingDeleteRequests },
  ];
}

// Flat nav items for solo owners
function getFlatNavItems(pendingDeleteRequests: number): NavItem[] {
  return [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/animals", icon: CowIcon, label: "Animals" },
    { href: "/alerts", icon: Bell, label: "Alerts" },
    { href: "/settings", icon: Settings, label: "Ranch Settings" },
    { href: "/account", icon: UserCog, label: "Account Settings" },
    { href: "/team", icon: Users, label: "Team", badge: pendingDeleteRequests },
  ];
}

// ── Single nav link ────────────────────────────────────────────────────────────

function NavLink({
  href, icon: Icon, label, active, badge, onClick, indent,
}: {
  href: string; icon: React.ElementType; label: string; active: boolean; badge?: number; onClick?: () => void; indent?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
        indent ? "px-3 pl-7" : "px-3",
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
      {badge != null && badge > 0 && (
        <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-background text-xs font-bold leading-none">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

// ── Expandable ranch folder ────────────────────────────────────────────────────

function RanchFolder({
  ranch,
  items,
  isOpen,
  onToggle,
  activeRanchId,
  currentPath,
  onNavClick,
  noPersonalRanchCta,
}: {
  ranch: RanchInfo;
  items: NavItem[];
  isOpen: boolean;
  onToggle: () => void;
  activeRanchId: number | null;
  currentPath: string;
  onNavClick: (ranchId: number) => void;
  noPersonalRanchCta?: () => void;
}) {
  const isActiveRanch = activeRanchId === ranch.id;
  const folderLabel = ranch.isPersonal ? "My Ranch" : `${ranch.ownerName ?? "Owner"}'s Ranch`;

  return (
    <div className="mb-0.5">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
          isActiveRanch
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
        )}
      >
        <ChevronRight
          className={cn(
            "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
            isOpen ? "rotate-90" : ""
          )}
        />
        <Warehouse className="w-3.5 h-3.5 shrink-0 opacity-70" />
        <span className="truncate flex-1 text-left">{folderLabel}</span>
        {isActiveRanch && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="mt-0.5 ml-1 flex flex-col gap-0.5">
          {noPersonalRanchCta ? (
            <button
              onClick={noPersonalRanchCta}
              className="flex items-center gap-2 px-3 pl-7 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Set up My Ranch
            </button>
          ) : (
            items.map((item) => {
              const isActive =
                isActiveRanch &&
                (item.href === "/" ? currentPath === "/" : currentPath.startsWith(item.href));
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={isActive}
                  badge={item.badge}
                  indent
                  onClick={() => onNavClick(ranch.id)}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── My Ranch Setup Dialog ──────────────────────────────────────────────────────

function MyRanchSetupDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (ranch: RanchInfo) => void;
}) {
  const { createPersonalRanch } = useRanch();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Address geocoding state (same pattern as signup)
  const [address, setAddress] = useState("");
  const [geocodedLat, setGeocodedLat] = useState<number | null>(null);
  const [geocodedLon, setGeocodedLon] = useState<number | null>(null);
  const [geocodeLabel, setGeocodeLabel] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleAddressChange(value: string) {
    setAddress(value);
    if (geocodedLat !== null) { setGeocodedLat(null); setGeocodedLon(null); setGeocodeLabel(null); }
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (value.trim().length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        const results: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
        setSuggestions(results ?? []);
        setShowSuggestions((results ?? []).length > 0);
      } catch { setSuggestions([]); setShowSuggestions(false); }
    }, 350);
  }

  function selectSuggestion(s: { display_name: string; lat: string; lon: string }) {
    setAddress(s.display_name);
    setGeocodedLat(parseFloat(parseFloat(s.lat).toFixed(6)));
    setGeocodedLon(parseFloat(parseFloat(s.lon).toFixed(6)));
    setGeocodeLabel(s.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function resetForm() {
    setName("");
    setAddress("");
    setGeocodedLat(null);
    setGeocodedLon(null);
    setGeocodeLabel(null);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (geocodedLat === null || geocodedLon === null) {
      toast({ title: "Location required", description: "Enter your ranch address and select a suggestion.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const ranch = await createPersonalRanch({ name, lat: geocodedLat, lon: geocodedLon });
      toast({ title: "Ranch created!", description: `${name} is ready.` });
      onCreated(ranch);
      onOpenChange(false);
      resetForm();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create ranch", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SimpleDialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }} title="Set Up My Ranch">
      <p className="text-sm text-muted-foreground mb-4">
        Create your own personal ranch to track your own livestock, separate from the ranches you work on.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Ranch Name</Label>
          <Input required placeholder="e.g. Sunrise Acres" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="space-y-1.5 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 pt-2 mb-1">
            <Tractor className="w-4 h-4 text-primary" />
            <Label className="text-primary font-semibold text-xs uppercase tracking-wide">Ranch Location</Label>
          </div>
          <div className="relative">
            <Input
              placeholder="Start typing your address…"
              value={address}
              onChange={e => handleAddressChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/40 last:border-b-0"
                    onMouseDown={() => selectSuggestion(s)}
                  >
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-foreground/85 leading-snug line-clamp-2">{s.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {geocodedLat !== null && geocodedLon !== null && (
            <div className="rounded-lg border bg-green-50/60 border-green-200 p-2.5">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  {geocodeLabel && <p className="text-xs text-muted-foreground truncate mb-0.5">{geocodeLabel}</p>}
                  <p className="text-xs font-mono text-foreground">{geocodedLat.toFixed(6)}, {geocodedLon.toFixed(6)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setGeocodedLat(null); setGeocodedLon(null); setGeocodeLabel(null); setAddress(""); setSuggestions([]); }}
                  className="p-0.5 rounded hover:bg-muted text-muted-foreground shrink-0"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" isLoading={isSaving}>
          <MapPin className="w-4 h-4 mr-2" /> Create My Ranch
        </Button>
      </form>
    </SimpleDialog>
  );
}

// ── Profile box ────────────────────────────────────────────────────────────────

function ProfileBox({ userName }: { userName: string | null }) {
  const initials = userName
    ? userName.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="px-3 py-3 border-t border-border/60">
      <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{userName ?? "..."}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Layout ────────────────────────────────────────────────────────────────

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, isAuthenticated, role, isViewer, pendingDeleteRequests, userName } = useAuth();
  const { ranches, activeRanchId, activeRanch, hasPersonalRanch, setActiveRanch, refreshRanches } = useRanch();
  const { openLogin, openSignup } = useAuthModal();
  const { hasNavigated, markNavigated, resetNavigation } = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  // Determine sidebar mode
  const hasInvitedRanches = ranches.some(r => !r.isPersonal);
  const showFolderSidebar = isAuthenticated && (hasInvitedRanches || role === "owner");

  // Invited (non-personal) ranches
  const invitedRanches = ranches.filter(r => !r.isPersonal);
  const personalRanch = ranches.find(r => r.isPersonal) ?? null;

  // Track open folders; default to the folder containing the active ranch
  const [openFolders, setOpenFolders] = useState<Set<number>>(() => {
    const set = new Set<number>();
    const saved = localStorage.getItem("ranchpad_active_ranch");
    if (saved) set.add(parseInt(saved, 10));
    return set;
  });

  // When active ranch changes, open its folder
  useEffect(() => {
    if (activeRanchId) {
      setOpenFolders(prev => new Set([...prev, activeRanchId]));
    }
  }, [activeRanchId]);

  const toggleFolder = (ranchId: number) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      if (next.has(ranchId)) next.delete(ranchId);
      else next.add(ranchId);
      return next;
    });
  };

  const handleNavClick = (ranchId: number) => {
    if (ranchId !== activeRanchId) setActiveRanch(ranchId);
    markNavigated();
  };


  const isLanding = !hasNavigated && !isAuthenticated && location === "/";
  const isOwner = role === "owner";

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  // ── Flat nav renderer (solo owners) ─────────────────────────────────────────
  const renderFlatNav = (onItemClick?: () => void) => {
    const items = getFlatNavItems(pendingDeleteRequests);
    return items.map((item) => {
      if (item.href === "/" && isViewer) return null;
      if ((item.href === "/settings" || item.href === "/team") && !isOwner) return null;
      return (
        <NavLink
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={item.label}
          active={isActive(item.href)}
          badge={item.badge}
          onClick={() => { markNavigated(); onItemClick?.(); }}
        />
      );
    });
  };

  // ── Folder nav renderer (multi-ranch) ────────────────────────────────────────
  const renderFolderNav = (onItemClick?: () => void) => (
    <>
      {invitedRanches.map((ranch) => (
        <RanchFolder
          key={ranch.id}
          ranch={ranch}
          items={ranch.role === "viewer" ? getViewerItems() : getOwnerRanchItems()}
          isOpen={openFolders.has(ranch.id)}
          onToggle={() => toggleFolder(ranch.id)}
          activeRanchId={activeRanchId}
          currentPath={location}
          onNavClick={(id) => { handleNavClick(id); onItemClick?.(); }}
        />
      ))}

      <div className="border-t border-border/40 mt-1 pt-1 flex flex-col gap-0.5">
        <NavLink
          href="/account"
          icon={UserCog}
          label="Account Settings"
          active={isActive("/account")}
          onClick={() => { markNavigated(); onItemClick?.(); }}
        />

        {hasPersonalRanch && personalRanch ? (
          <RanchFolder
            ranch={personalRanch}
            items={getPersonalRanchItems(pendingDeleteRequests)}
            isOpen={openFolders.has(personalRanch.id)}
            onToggle={() => toggleFolder(personalRanch.id)}
            activeRanchId={activeRanchId}
            currentPath={location}
            onNavClick={(id) => { handleNavClick(id); onItemClick?.(); }}
          />
        ) : (
          <RanchFolder
            ranch={{ id: -1, name: "My Ranch", role: "none", ownerName: null, isPersonal: true }}
            items={[]}
            isOpen={openFolders.has(-1)}
            onToggle={() => toggleFolder(-1)}
            activeRanchId={activeRanchId}
            currentPath={location}
            onNavClick={() => {}}
            noPersonalRanchCta={() => { setSetupOpen(true); onItemClick?.(); }}
          />
        )}
      </div>
    </>
  );

  const sidebarBottom = (
    <div className="border-t border-border">
      {isAuthenticated ? (
        <>
          <ProfileBox userName={userName} />
          <div className="px-3 pb-3">
            <button
              onClick={() => { resetNavigation(); logout(); }}
              className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </>
      ) : (
        <div className="px-3 py-4 flex flex-col gap-2">
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
  );

  const mobileSidebarBottom = (
    <div className="border-t border-border">
      {isAuthenticated ? (
        <>
          <ProfileBox userName={userName} />
          <div className="px-3 pb-3">
            <button
              onClick={() => { setMenuOpen(false); resetNavigation(); logout(); }}
              className="flex items-center gap-2.5 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </>
      ) : (
        <div className="px-3 py-4 flex flex-col gap-2">
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
  );

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col md:flex-row">

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex w-56 shrink-0 flex-col border-r border-border z-10 h-full"
        style={{ background: "hsl(var(--sidebar))" }}
      >
        <Link href="/" className="px-5 py-5 flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <Warehouse className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-foreground">RanchPad</span>
        </Link>

        <nav className="flex-1 px-3 pb-4 flex flex-col gap-0.5 overflow-y-auto">
          {showFolderSidebar ? renderFolderNav() : renderFlatNav()}
        </nav>

        {sidebarBottom}
      </aside>

      {/* ── Mobile Slide-Out Menu ─────────────────────────────────────────── */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 flex flex-col border-r border-border"
          style={{ background: "hsl(var(--sidebar))" }}
        >
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <div className="px-5 py-5 border-b border-border flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Warehouse className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-foreground">RanchPad</span>
          </div>

          <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
            {showFolderSidebar
              ? renderFolderNav(() => setMenuOpen(false))
              : renderFlatNav(() => setMenuOpen(false))}
          </nav>

          {mobileSidebarBottom}
        </SheetContent>
      </Sheet>

      {/* ── My Ranch Setup Dialog ─────────────────────────────────────────── */}
      <MyRanchSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onCreated={(ranch) => {
          setActiveRanch(ranch.id);
          refreshRanches();
        }}
      />

      {/* ── Main Content ──────────────────────────────────────────────────── */}
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
