import { Link } from "wouter";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { RanchPadLogo } from "@/components/RanchPadLogo";
import phoneDashboard from "../assets/phone-dashboard.png";
import phoneAnimal from "../assets/phone-animal.png";
import "./Landing.css";

export default function Landing() {
  const { openSignup, openLogin } = useAuthModal();

  return (
    <div className="landing-page">

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <RanchPadLogo size="sm" variant="dark" />
        <div className="lp-nav-actions">
          <button className="lp-nav-login" onClick={openLogin}>Log In</button>
          <button className="lp-nav-signup" onClick={openSignup}>Get Started</button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-eyebrow">AI-Powered Livestock Management</div>

        <h1 className="lp-headline">
          All herd records in one place.
        </h1>

        <p className="lp-sub">
          Every document easily accessible for customers, vets, or anyone in seconds.
        </p>

        <div className="lp-cta-row">
          <button className="lp-btn-primary" onClick={openSignup}>
            Start Your Free 2-Week Trial
          </button>
          <p className="lp-cta-sub">$12/month after trial and cancel anytime.</p>
        </div>

        {/* Phone mockups */}
        <div className="lp-phone-wrap">

          <img src={phoneDashboard} alt="RanchPad dashboard showing disease risk alerts" className="lp-phone-screenshot elevated" />
          <img src={phoneAnimal} alt="RanchPad animal profile for Bessie" className="lp-phone-screenshot" />
        </div>

      </section>

      {/* ── DEMO VIDEO ───────────────────────────────────────────────────── */}
      <section className="lp-demo">
        <p className="lp-section-label">See It In Action</p>
        <h2 className="lp-section-headline">From pasture to pocket in seconds</h2>
        <div className="lp-video-wrap">
          <video
            className="lp-video"
            src="/demo.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="lp-features">
        <p className="lp-section-label">Built for Ranchers</p>
        <h2 className="lp-section-headline">
          Every other app tells you what already happened
        </h2>
        <p className="lp-section-sub">
          RanchPad is the only livestock software that uses predictive AI to catch
          disease risk before you see symptoms.
        </p>

        <div className="lp-features-grid">
          <div className="lp-feature-card hero-card">
            <div className="lp-feature-icon amber">⚡</div>
            <h3>Predictive Disease Alerts</h3>
            <p>
              Our AI cross-references each animal's full health history with your
              real-time local weather — humidity, temperature swings, pressure
              changes — to flag individual animals at risk before you lose one.
            </p>
          </div>

          <div className="lp-feature-card">
            <div className="lp-feature-icon green">📋</div>
            <h3>Every Record, Searchable in Seconds</h3>
            <p>
              Health events, medications, and vet records for every animal — right
              from your phone. No more paper binders or guessing what you gave last
              spring.
            </p>
          </div>

          <div className="lp-feature-card">
            <div className="lp-feature-icon green">👥</div>
            <h3>Role-Based Team Access</h3>
            <p>
              Owners, ranch hands, and cattle clients each see exactly what they
              need. Nothing gets missed, nothing gets overshared.
            </p>
          </div>

          <div className="lp-feature-card">
            <div className="lp-feature-icon amber">📄</div>
            <h3>One-Tap Reports</h3>
            <p>
              Export a full herd health report as a PDF in one tap. Ready for the
              vet, the bank, or the buyer.
            </p>
          </div>

          <div className="lp-feature-card">
            <div className="lp-feature-icon green">📍</div>
            <h3>Pasture &amp; Location Tagging</h3>
            <p>
              Know exactly where every animal is and has been. Outbreak
              investigation, grazing rotation, and pen management made simple.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="lp-cta-banner">
        <h2>Stop reacting. Start preventing.</h2>
        <p>Join ranchers across Kansas and beyond who are protecting their herds with RanchPad.</p>
        <button
          className="lp-btn-primary"
          style={{ fontSize: 16, padding: "16px 36px" }}
          onClick={openSignup}
        >
          Try RanchPad Free →
        </button>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <RanchPadLogo size="sm" variant="dark" />
        <div className="lp-footer-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
        <div className="lp-footer-copy">© 2026 RanchPad · Built in Kansas</div>
      </footer>

    </div>
  );
}
