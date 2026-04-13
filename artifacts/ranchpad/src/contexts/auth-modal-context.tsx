import React, { createContext, useContext, useState, useCallback } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AuthForm } from "@/components/AuthForm";
import { RanchPadLogo } from "@/components/RanchPadLogo";

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

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            style={{
              position: "fixed", inset: 0, zIndex: 50,
              background: "rgba(10,20,14,0.65)",
              backdropFilter: "blur(2px)",
            }}
          />
          <DialogPrimitive.Content
            style={{
              position: "fixed",
              left: "50%", top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 51,
              width: "calc(100% - 32px)",
              maxWidth: 420,
              maxHeight: "90dvh",
              background: "#F5F1EA",
              borderRadius: 20,
              boxShadow: "0 24px 80px rgba(10,20,14,0.35)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header band */}
            <div style={{
              background: "#1A3628",
              padding: "16px 20px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <RanchPadLogo size="sm" variant="dark" />
              <DialogPrimitive.Close
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.7)",
                  flexShrink: 0,
                }}
              >
                <X size={14} />
              </DialogPrimitive.Close>
            </div>

            {/* Form body */}
            <div style={{ padding: "24px 24px 28px", overflowY: "auto", flex: 1 }}>
              {open && (
                <AuthForm
                  initialView={initialView}
                  onDone={() => setOpen(false)}
                />
              )}
            </div>

            <DialogPrimitive.Title style={{ display: "none" }}>RanchPad</DialogPrimitive.Title>
            <DialogPrimitive.Description style={{ display: "none" }}>Sign in or create an account</DialogPrimitive.Description>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </AuthModalContext.Provider>
  );
}
