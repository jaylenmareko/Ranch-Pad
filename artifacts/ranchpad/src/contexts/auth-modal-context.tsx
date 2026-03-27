import React, { createContext, useContext, useState, useCallback } from "react";
import { SimpleDialog } from "@/components/ui/dialog";
import { AuthForm } from "@/components/AuthForm";

type ModalView = "login" | "signup";

interface AuthModalContextType {
  openLogin: () => void;
  openSignup: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialView, setInitialView] = useState<ModalView>("login");
  const [locked, setLocked] = useState(false);

  const openLogin = useCallback(() => { setInitialView("login"); setLocked(false); setOpen(true); }, []);
  const openSignup = useCallback(() => { setInitialView("signup"); setLocked(false); setOpen(true); }, []);

  React.useEffect(() => {
    window.addEventListener("open-login-modal", openLogin);
    return () => window.removeEventListener("open-login-modal", openLogin);
  }, [openLogin]);

  function handleOpenChange(val: boolean) {
    if (!val && locked) return; // Pastures step — user must explicitly choose Skip or Enter
    setOpen(val);
  }

  function handleDone() {
    setLocked(false);
    setOpen(false);
  }

  return (
    <AuthModalContext.Provider value={{ openLogin, openSignup }}>
      {children}

      <SimpleDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="RanchPad"
        hideTitle
        hideClose={locked}
      >
        {open && (
          <AuthForm
            initialView={initialView}
            onDone={handleDone}
            onTokenReady={() => setLocked(true)}
          />
        )}
      </SimpleDialog>
    </AuthModalContext.Provider>
  );
}
