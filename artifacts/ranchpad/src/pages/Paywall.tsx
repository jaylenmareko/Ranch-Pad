import React, { useState } from "react";
import { CheckCircle2, Loader2, LogOut } from "lucide-react";
import { BarnIcon } from "@/components/BarnIcon";
import { useAuth } from "@/hooks/use-auth";
import type { BillingStatus } from "@/hooks/use-billing";

interface PaywallProps {
  billingStatus: BillingStatus | null;
}

export default function Paywall({ billingStatus }: PaywallProps) {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Could not start checkout. Please try again.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const isExpired = billingStatus?.status === "expired";
  const isCanceled = billingStatus?.status === "canceled";
  const isPastDue = billingStatus?.status === "past_due";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <BarnIcon className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-3xl text-primary tracking-tight">RanchPad</span>
        </div>

        {/* Status message */}
        {isExpired && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl px-5 py-3.5 mb-6 text-center">
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Your 14-day free trial has ended.</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">Subscribe to continue managing your herd.</p>
          </div>
        )}
        {isCanceled && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl px-5 py-3.5 mb-6 text-center">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Your subscription has been canceled.</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1">Re-subscribe to regain full access.</p>
          </div>
        )}
        {isPastDue && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl px-5 py-3.5 mb-6 text-center">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Your payment is past due.</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1">Update your payment method to restore access.</p>
          </div>
        )}

        {/* Pricing card */}
        <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-primary px-6 py-6 text-center">
            <p className="text-primary-foreground/80 text-sm font-semibold uppercase tracking-widest mb-1">RanchPad Pro</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-black text-primary-foreground">$12</span>
              <span className="text-primary-foreground/70 font-medium">/month</span>
            </div>
            <p className="text-primary-foreground/70 text-sm mt-1">Cancel anytime</p>
          </div>

          <div className="px-6 py-6 space-y-3">
            {[
              "Unlimited animals & herd records",
              "Health events & medication tracking",
              "AI-powered health alerts",
              "Daily weather-based advisories",
              "FAMACHA scoring & trends",
              "CSV import for bulk onboarding",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-sm font-medium text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <div className="px-6 pb-6 space-y-3">
            {error && (
              <p className="text-xs text-destructive font-medium text-center bg-destructive/10 rounded-xl px-4 py-2">{error}</p>
            )}
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:-translate-y-0.5 active:translate-y-0 transition-transform shadow-lg shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting to checkout…</>
              ) : (
                "Subscribe for $12/month"
              )}
            </button>
            <p className="text-center text-xs text-muted-foreground">Powered by Stripe · Secure checkout · Cancel anytime</p>
          </div>
        </div>

        {/* Sign out */}
        <div className="mt-6 text-center">
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
