import React, { useEffect, useState } from "react";
import { SimpleDialog } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";

export function GuestSignupPrompt() {
  const { isAuthenticated } = useAuth();
  const { openSignup, openLogin } = useAuthModal();
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
          You're using RanchPad as a guest. Sign up to sync your herd across devices and unlock alerts and health reminders.
        </p>

        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          <button
            onClick={() => { setOpen(false); openSignup(); }}
            className="w-full inline-flex items-center justify-center h-9 px-6 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Free Account
          </button>
          <button
            onClick={() => { setOpen(false); openLogin(); }}
            className="w-full inline-flex items-center justify-center h-9 px-6 rounded-lg font-semibold border border-border text-foreground hover:bg-muted transition-colors"
          >
            Log In
          </button>
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
