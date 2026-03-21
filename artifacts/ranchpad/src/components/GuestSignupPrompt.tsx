import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { SimpleDialog } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";

export function GuestSignupPrompt() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      if (!isAuthenticated) setOpen(true);
    };
    window.addEventListener("guest-save", handler);
    return () => window.removeEventListener("guest-save", handler);
  }, [isAuthenticated]);

  if (isAuthenticated) return null;

  return (
    <SimpleDialog open={open} onOpenChange={setOpen} title="Save your herd">
      <div className="flex flex-col items-center text-center gap-5 py-2">
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          Create a free account to keep your data safe, access it on any device, and unlock weather alerts and health reminders.
        </p>

        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          <Link
            href="/login?signup=1"
            onClick={() => setOpen(false)}
            className="w-full inline-flex items-center justify-center h-11 px-6 rounded-xl font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-transform"
          >
            Create Free Account
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="w-full inline-flex items-center justify-center h-11 px-6 rounded-xl font-semibold border border-border text-foreground hover:bg-muted transition-colors"
          >
            Log In
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Continue without saving
          </button>
        </div>
      </div>
    </SimpleDialog>
  );
}
