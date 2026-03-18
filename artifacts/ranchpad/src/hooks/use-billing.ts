export interface BillingStatus {
  status: "trialing" | "active" | "past_due" | "canceled" | "expired";
  trialDaysLeft: number | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  hasAccess: boolean;
}
