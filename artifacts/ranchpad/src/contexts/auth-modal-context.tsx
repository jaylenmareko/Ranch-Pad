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

  const openLogin = useCallback(() => { setInitialView("login"); setOpen(true); }, []);
  const openSignup = useCallback(() => { setInitialView("signup"); setOpen(true); }, []);

  React.useEffect(() => {
    window.addEventListener("open-login-modal", openLogin);
    return () => window.removeEventListener("open-login-modal", openLogin);
  }, [openLogin]);

  return (
    <AuthModalContext.Provider value={{ openLogin, openSignup }}>
      {children}

      <SimpleDialog open={open} onOpenChange={setOpen} title="RanchPad" hideTitle>
        {open && (
          <AuthForm
            initialView={initialView}
            onDone={() => setOpen(false)}
          />
        )}
      </SimpleDialog>
    </AuthModalContext.Provider>
  );
}
