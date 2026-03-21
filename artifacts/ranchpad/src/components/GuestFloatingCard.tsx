import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { X, Sprout } from "lucide-react";
import { isGuestPromptDismissed, dismissGuestPrompt } from "@/lib/guest-store";
import { useAuth } from "@/hooks/use-auth";

export function GuestFloatingCard() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [dismissed, setDismissed] = useState(() => isGuestPromptDismissed());

  // Don't show on auth pages
  if (isAuthenticated || dismissed || location.startsWith("/login")) return null;

  const handleDismiss = () => {
    dismissGuestPrompt();
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 rounded-2xl border border-border bg-card shadow-xl shadow-black/15 p-4">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full hover:bg-muted"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2.5 mb-3 pr-6">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Sprout className="w-4 h-4 text-primary" />
        </div>
        <p className="font-semibold text-sm text-foreground leading-snug">
          Sign up to save your herd
        </p>
      </div>

      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Your animals are saved locally. Create a free account to keep your data safe and access it anywhere.
      </p>

      <div className="flex gap-2">
        <Link
          href="/login?signup=1"
          className="flex-1 inline-flex items-center justify-center h-9 px-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Sign Up
        </Link>
        <Link
          href="/login"
          className="flex-1 inline-flex items-center justify-center h-9 px-3 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
        >
          Log In
        </Link>
      </div>
    </div>
  );
}
