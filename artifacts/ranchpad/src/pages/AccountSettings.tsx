import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Save, User, KeyRound, CreditCard, Loader2, UserCog, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useQuery } from "@tanstack/react-query";
import type { BillingStatus } from "@/hooks/use-billing";

interface UserProfile {
  id: number;
  name: string;
  email: string;
}

export default function AccountSettings() {
  const { toast } = useToast();
  const { isAuthenticated, isViewer, role } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const isOwner = role === "owner";

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingName, setIsSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const [isBillingRedirecting, setIsBillingRedirecting] = useState(false);

  const { data: billing, isLoading: isBillingLoading } = useQuery<BillingStatus>({
    queryKey: ["/api/billing/status"],
    queryFn: async () => {
      const res = await fetch("/api/billing/status");
      if (!res.ok) throw new Error("Failed to fetch billing status");
      return res.json() as Promise<BillingStatus>;
    },
    enabled: isAuthenticated && isOwner,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: false,
  });

  useEffect(() => {
    if (!isAuthenticated) { setIsLoadingProfile(false); return; }
    setIsLoadingProfile(true);
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { message?: string }).message ?? "Could not load account info");
        }
        return res.json() as Promise<UserProfile>;
      })
      .then((data) => {
        setUserProfile(data);
        setDisplayName(data.name ?? "");
      })
      .catch(() => {
        toast({ title: "Could not load account info", variant: "destructive" });
      })
      .finally(() => setIsLoadingProfile(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-black text-foreground whitespace-nowrap">Account Settings</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
            <UserCog className="w-10 h-10 text-primary/50" />
          </div>
          <h2 className="font-bold text-xl text-foreground mb-2">Manage your account</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-8 leading-relaxed">
            Create a free account to manage your display name, email, password, and subscription.
          </p>
          <div className="flex gap-3">
            <button onClick={openSignup} className="inline-flex items-center justify-center h-9 px-5 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Create Free Account
            </button>
            <button onClick={openLogin} className="inline-flex items-center justify-center h-9 px-5 rounded-lg font-medium border border-border text-foreground hover:bg-muted transition-colors">
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setIsSavingName(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Save failed");
      }
      const updated: UserProfile = await res.json();
      setUserProfile(updated);
      setDisplayName(updated.name);
      toast({ title: "Name updated", description: "Your display name has been saved." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setIsChangingEmail(true);
    try {
      const res = await fetch("/api/auth/me/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim(), currentPassword: emailPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        setEmailError(err.message ?? "Could not update email");
        return;
      }
      const updated: UserProfile = await res.json();
      setUserProfile(updated);
      setNewEmail("");
      setEmailPassword("");
      toast({ title: "Email updated", description: `Your email is now ${updated.email}.` });
    } catch {
      setEmailError("Something went wrong. Try again.");
    } finally {
      setIsChangingEmail(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/auth/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Password change failed");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated", description: "Your new password is active." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast({ title: "Password change failed", description: message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleSubscribe() {
    setIsBillingRedirecting(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Checkout failed", description: data.message ?? "Please try again.", variant: "destructive" });
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      toast({ title: "Checkout failed", description: "Network error. Try again.", variant: "destructive" });
    } finally {
      setIsBillingRedirecting(false);
    }
  }

  async function handleManageBilling() {
    setIsBillingRedirecting(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Portal error", description: data.message ?? "Please try again.", variant: "destructive" });
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      toast({ title: "Portal error", description: "Network error. Try again.", variant: "destructive" });
    } finally {
      setIsBillingRedirecting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-black font-display text-foreground whitespace-nowrap">Account Settings</h1>
        <p className="text-muted-foreground font-medium mt-1">Manage your personal account details.</p>
      </div>

      {/* Your Account */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <User className="w-5 h-5 text-primary" />
            Your Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingProfile ? (
            <p className="text-sm text-muted-foreground animate-pulse font-medium">Loading account info...</p>
          ) : (
            <>
              <form onSubmit={handleSaveName} className="space-y-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <div className="flex gap-2">
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      variant="secondary"
                      isLoading={isSavingName}
                      disabled={isSavingName || displayName.trim() === (userProfile?.name ?? "")}
                      className="shrink-0"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t border-border">
                  <Label>Current Email</Label>
                  <p className="text-sm font-medium text-foreground">{userProfile?.email ?? "—"}</p>
                </div>
              </form>

              <form onSubmit={handleChangeEmail} className="space-y-3 pt-5 border-t border-border mt-5">
                <p className="text-sm font-semibold text-foreground">Change Email</p>
                <div className="space-y-2">
                  <Label>New Email Address</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={e => { setNewEmail(e.target.value); setEmailError(null); }}
                    placeholder="new@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm with Current Password</Label>
                  <Input
                    type="password"
                    value={emailPassword}
                    onChange={e => { setEmailPassword(e.target.value); setEmailError(null); }}
                    placeholder="Enter your current password"
                    required
                    autoComplete="current-password"
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-destructive font-medium">{emailError}</p>
                )}
                <Button
                  type="submit"
                  variant="secondary"
                  isLoading={isChangingEmail}
                  disabled={isChangingEmail || !newEmail.trim() || !emailPassword}
                  className="w-full gap-2"
                >
                  <Save className="w-4 h-4" />
                  Update Email
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <KeyRound className="w-5 h-5 text-primary" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                autoComplete="new-password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive font-medium">Passwords do not match.</p>
              )}
            </div>
            <Button
              type="submit"
              variant="secondary"
              isLoading={isChangingPassword}
              disabled={
                isChangingPassword ||
                !currentPassword ||
                newPassword.length < 6 ||
                newPassword !== confirmPassword
              }
              className="w-full gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Subscription — owners only */}
      {isOwner && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <CreditCard className="w-5 h-5 text-primary" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isBillingLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading subscription info...
              </div>
            ) : !billing ? (
              <p className="text-sm text-muted-foreground font-medium">Billing information unavailable.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {billing.status === "active" && !billing.cancelAtPeriodEnd && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                  )}
                  {billing.status === "active" && billing.cancelAtPeriodEnd && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Cancels {billing.currentPeriodEnd ? new Date(billing.currentPeriodEnd).toLocaleDateString() : "soon"}
                    </span>
                  )}
                  {billing.status === "trialing" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {billing.trialDaysLeft != null
                        ? `Trial — ${billing.trialDaysLeft} ${billing.trialDaysLeft === 1 ? "day" : "days"} left`
                        : "Trial"}
                    </span>
                  )}
                  {(billing.status === "canceled" || billing.status === "past_due" || billing.status === "none") && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground">
                      {billing.status === "past_due" ? "Past Due" : billing.status === "canceled" ? "Canceled" : "No Plan"}
                    </span>
                  )}
                </div>

                {(billing.status === "active" || billing.status === "trialing") && (
                  <Button
                    variant="secondary"
                    className="gap-2"
                    isLoading={isBillingRedirecting}
                    onClick={handleManageBilling}
                  >
                    <CreditCard className="w-4 h-4" />
                    Manage Subscription
                  </Button>
                )}

                {(billing.status === "canceled" || billing.status === "none" || billing.status === "past_due") && (
                  <Button
                    className="gap-2"
                    isLoading={isBillingRedirecting}
                    onClick={handleSubscribe}
                  >
                    <CreditCard className="w-4 h-4" />
                    {billing.status === "past_due" ? "Reactivate Subscription" : "Subscribe Now"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
