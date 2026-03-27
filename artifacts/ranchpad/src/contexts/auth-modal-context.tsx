import React, { createContext, useContext, useState, useCallback } from "react";
import { SimpleDialog } from "@/components/ui/dialog";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/hooks/use-auth";

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
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const { login: setAuthContext } = useAuth();

  const openLogin = useCallback(() => { setInitialView("login"); setOpen(true); }, []);
  const openSignup = useCallback(() => { setInitialView("signup"); setOpen(true); }, []);

  // Listen for auth-expired event from use-auth
  React.useEffect(() => {
    window.addEventListener("open-login-modal", openLogin);
    return () => window.removeEventListener("open-login-modal", openLogin);
  }, [openLogin]);

  function handleOpenChange(val: boolean) {
    if (!val && pendingToken) {
      // Account is already created — log them in even if they close the dialog early
      setAuthContext(pendingToken);
      setPendingToken(null);
    }
    setOpen(val);
  }

  return (
    <AuthModalContext.Provider value={{ openLogin, openSignup }}>
      {children}

      <SimpleDialog open={open} onOpenChange={handleOpenChange} title="RanchPad" hideTitle>
        {open && (
          <AuthForm
            initialView={initialView}
            onDone={() => { setPendingToken(null); setOpen(false); }}
            onTokenReady={setPendingToken}
          />
        )}
      </SimpleDialog>
    </AuthModalContext.Provider>
  );
}
