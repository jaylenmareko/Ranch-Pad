import { Router, type IRouter, type Request, type Response } from "express";
import Stripe from "stripe";
import { db, ranchesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

function getAppBaseUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  return `${proto}://${host}`;
}

// ─── GET /api/billing/status ──────────────────────────────────────────────────

export interface BillingStatus {
  status: "trialing" | "active" | "past_due" | "canceled" | "expired";
  trialDaysLeft: number | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasAccess: boolean;
}

router.get("/billing/status", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const ranchId = req.user!.ranchId;

  const [ranch] = await db
    .select()
    .from(ranchesTable)
    .where(eq(ranchesTable.id, ranchId))
    .limit(1);

  if (!ranch) {
    res.status(404).json({ error: true, message: "Ranch not found" });
    return;
  }

  const now = new Date();

  // Active Stripe subscription — verify with Stripe and detect cancellations
  if (ranch.subscriptionStatus === "active") {
    let currentPeriodEnd: string | null = null;
    let cancelAtPeriodEnd = false;

    if (ranch.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = getStripe();
        const sub = await stripe.subscriptions.retrieve(ranch.stripeSubscriptionId);

        const periodEnd = (sub as unknown as { current_period_end: number }).current_period_end;
        if (typeof periodEnd === "number") {
          currentPeriodEnd = new Date(periodEnd * 1000).toISOString();
        }

        cancelAtPeriodEnd = !!(sub as unknown as { cancel_at_period_end: boolean }).cancel_at_period_end;

        // If Stripe says the subscription is actually canceled/past_due, sync the DB
        // (handles the case where webhooks weren't delivered)
        if (sub.status === "canceled" || sub.status === "past_due") {
          await db.update(ranchesTable)
            .set({ subscriptionStatus: sub.status })
            .where(eq(ranchesTable.id, ranchId));

          const billingStatus: BillingStatus = {
            status: sub.status,
            trialDaysLeft: null,
            trialEndsAt: null,
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
            hasAccess: false,
          };
          res.json(billingStatus);
          return;
        }
      } catch (e) {
        console.error("[billing/status] Stripe retrieve error:", e);
      }
    }

    const billingStatus: BillingStatus = {
      status: "active",
      trialDaysLeft: null,
      trialEndsAt: null,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      hasAccess: true,
    };
    res.json(billingStatus);
    return;
  }

  // Past-due or canceled subscription — no access
  if (ranch.subscriptionStatus === "past_due" || ranch.subscriptionStatus === "canceled") {
    let currentPeriodEnd: string | null = null;
    if (ranch.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = getStripe();
        const sub = await stripe.subscriptions.retrieve(ranch.stripeSubscriptionId);
        const periodEnd = (sub as unknown as { current_period_end: number }).current_period_end;
        if (typeof periodEnd === "number") {
          currentPeriodEnd = new Date(periodEnd * 1000).toISOString();
        }
      } catch {
        // Non-fatal — just won't show expiry date
      }
    }
    const billingStatus: BillingStatus = {
      status: ranch.subscriptionStatus as "past_due" | "canceled",
      trialDaysLeft: null,
      trialEndsAt: null,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      hasAccess: false,
    };
    res.json(billingStatus);
    return;
  }

  // No subscription yet — check trial
  if (ranch.trialEndsAt && ranch.trialEndsAt > now) {
    const msLeft = ranch.trialEndsAt.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    const billingStatus: BillingStatus = {
      status: "trialing",
      trialDaysLeft: daysLeft,
      trialEndsAt: ranch.trialEndsAt.toISOString(),
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      hasAccess: true,
    };
    res.json(billingStatus);
    return;
  }

  // Trial expired, no subscription
  const billingStatus: BillingStatus = {
    status: "expired",
    trialDaysLeft: 0,
    trialEndsAt: ranch.trialEndsAt?.toISOString() ?? null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    hasAccess: false,
  };
  res.json(billingStatus);
});

// ─── POST /api/billing/checkout ───────────────────────────────────────────────

router.post("/billing/checkout", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    res.status(503).json({ error: true, message: "Billing is not configured. Please contact support." });
    return;
  }

  const stripe = getStripe();
  const ranchId = req.user!.ranchId;
  const userEmail = req.user!.email;

  const [ranch] = await db
    .select()
    .from(ranchesTable)
    .where(eq(ranchesTable.id, ranchId))
    .limit(1);

  if (!ranch) {
    res.status(404).json({ error: true, message: "Ranch not found" });
    return;
  }

  const base = getAppBaseUrl(req);
  const successUrl = `${base}/?billing=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${base}/settings`;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { ranchId: String(ranchId) },
    allow_promotion_codes: true,
  };

  if (ranch.stripeCustomerId) {
    sessionParams.customer = ranch.stripeCustomerId;
  } else {
    sessionParams.customer_email = userEmail;
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    res.status(500).json({ error: true, message });
  }
});

// ─── POST /api/billing/portal ─────────────────────────────────────────────────

router.post("/billing/portal", requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(503).json({ error: true, message: "Billing is not configured. Please contact support." });
    return;
  }
  const stripe = getStripe();
  const ranchId = req.user!.ranchId;

  const [ranch] = await db
    .select()
    .from(ranchesTable)
    .where(eq(ranchesTable.id, ranchId))
    .limit(1);

  if (!ranch?.stripeCustomerId) {
    res.status(400).json({ error: true, message: "No active subscription found" });
    return;
  }

  const base = getAppBaseUrl(req);

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: ranch.stripeCustomerId,
      return_url: `${base}/settings`,
    });
    res.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    res.status(500).json({ error: true, message });
  }
});

// ─── POST /api/billing/verify-session ─────────────────────────────────────────
// Called by the frontend immediately after Stripe checkout redirects back.
// Verifies the session directly with Stripe and activates the subscription in DB.
// This makes payment activation instant without relying solely on webhooks.

router.post("/billing/verify-session", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId) {
    res.status(400).json({ error: true, message: "Missing sessionId" });
    return;
  }

  const stripe = getStripe();
  const ranchId = req.user!.ranchId;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to retrieve session";
    console.error("[billing/verify-session] Stripe error:", message);
    res.status(400).json({ error: true, message });
    return;
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    res.status(400).json({ error: true, message: "Session not completed" });
    return;
  }

  // Confirm ranchId from metadata matches the authenticated user's ranch
  const metaRanchId = session.metadata?.ranchId ? parseInt(session.metadata.ranchId, 10) : null;
  if (metaRanchId !== ranchId) {
    res.status(403).json({ error: true, message: "Session does not belong to this account" });
    return;
  }

  const customerId = typeof session.customer === "string" ? session.customer : (session.customer as Stripe.Customer | null)?.id ?? null;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : (session.subscription as Stripe.Subscription | null)?.id ?? null;

  await db.update(ranchesTable)
    .set({
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: "active",
    })
    .where(eq(ranchesTable.id, ranchId));

  console.log(`[billing/verify-session] Activated subscription for ranch ${ranchId}`);
  res.json({ success: true, status: "active" });
});

// ─── POST /api/billing/webhook ────────────────────────────────────────────────

router.post("/billing/webhook", async (req: Request, res: Response): Promise<void> => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    res.status(503).json({ error: true, message: "Webhook not configured" });
    return;
  }

  const stripe = getStripe();
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).json({ error: true, message: "Missing stripe-signature header" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig as string, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    console.error("[billing/webhook] Verification failed:", message);
    res.status(400).json({ error: true, message });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const ranchId = session.metadata?.ranchId ? parseInt(session.metadata.ranchId, 10) : null;
        if (!ranchId) break;

        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;

        await db.update(ranchesTable)
          .set({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: "active",
          })
          .where(eq(ranchesTable.id, ranchId));
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

        const [ranch] = await db
          .select({ id: ranchesTable.id })
          .from(ranchesTable)
          .where(eq(ranchesTable.stripeCustomerId, customerId ?? ""))
          .limit(1);

        if (ranch) {
          const allowed = ["trialing", "active", "past_due", "canceled"];
          const normalized = allowed.includes(sub.status) ? sub.status : "canceled";
          await db.update(ranchesTable)
            .set({
              stripeSubscriptionId: sub.id,
              subscriptionStatus: normalized,
            })
            .where(eq(ranchesTable.id, ranch.id));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

        const [ranch] = await db
          .select({ id: ranchesTable.id })
          .from(ranchesTable)
          .where(eq(ranchesTable.stripeCustomerId, customerId ?? ""))
          .limit(1);

        if (ranch) {
          await db.update(ranchesTable)
            .set({ subscriptionStatus: "canceled" })
            .where(eq(ranchesTable.id, ranch.id));
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[billing/webhook] Handler error:", err);
  }

  res.json({ received: true });
});

export default router;
