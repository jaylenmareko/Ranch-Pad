import React, { createContext, useContext, useState } from "react";
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

  const openLogin = () => { setInitialView("login"); setOpen(true); };
  const openSignup = () => { setInitialView("signup"); setOpen(true); };

  // Listen for auth-expired event from use-auth
  React.useEffect(() => {
    const handler = () => openLogin();
    window.addEventListener("open-login-modal", handler);
    return () => window.removeEventListener("open-login-modal", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthModalContext.Provider value={{ openLogin, openSignup }}>
      {children}

      <SimpleDialog open={open} onOpenChange={setOpen} title="RanchPad" hideTitle>
        {open && (
          <AuthForm initialView={initialView} onDone={() => setOpen(false)} />
        )}
      </SimpleDialog>
    </AuthModalContext.Provider>
  );
}
