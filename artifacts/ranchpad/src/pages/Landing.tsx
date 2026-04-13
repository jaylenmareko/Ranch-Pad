import { Link } from "wouter";
import { useAuthModal } from "@/contexts/auth-modal-context";
import "./Landing.css";

export default function Landing() {
  const { openSignup, openLogin } = useAuthModal();

  const scrollToHow = () => {
    document.getElementById("lp-how")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing-page">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-eyebrow">AI-Powered Livestock Management</div>

        <h1 className="lp-headline">
          Know before<br /><em>it happens.</em>
        </h1>

        <p className="lp-sub">
          RanchPad cross-references your animal's health history with real-time
          local weather to warn you about disease risk before symptoms show up.
        </p>

        <div className="lp-cta-row">
          <button className="lp-btn-primary" onClick={openSignup}>
            Start Free 14-Day Trial
          </button>
          <button className="lp-btn-ghost" onClick={scrollToHow}>
            See How It Works →
          </button>
        </div>

        {/* Phone mockups */}
        <div className="lp-phone-wrap">

          {/* Phone 1 — Dashboard */}
          <div className="lp-phone-frame elevated">
            <div className="lp-phone-notch" />
            <div className="lp-phone-screen">
              <div className="lp-mini-dash">
                <div className="lp-mini-top-bar">
                  <div className="lp-mini-ranch-name">Lathom Ranch 🌤️</div>
                  <div className="lp-mini-bell">🔔</div>
                </div>
                <div className="lp-mini-weather">
                  <div>
                    <div style={{ fontSize: 9, opacity: 0.7 }}>Lathom, KS</div>
                    <div className="lp-mini-weather-temp">63°F</div>
                    <div style={{ fontSize: 8, opacity: 0.55 }}>Partly cloudy · Humidity 79%</div>
                  </div>
                  <div style={{ fontSize: 22 }}>🌤️</div>
                </div>
                <div className="lp-mini-alert-card">
                  <div className="lp-mini-alert-top">
                    <div className="lp-mini-alert-tag">Tag #101 · Calf</div>
                    <div className="lp-mini-severity">HIGH</div>
                  </div>
                  <div className="lp-mini-alert-text">
                    High humidity + prior scours history — pneumonia risk elevated
                  </div>
                </div>
                <div className="lp-mini-alert-card warn">
                  <div className="lp-mini-alert-top">
                    <div className="lp-mini-alert-tag">Tag #103 · Cow</div>
                    <div className="lp-mini-severity">MED</div>
                  </div>
                  <div className="lp-mini-alert-text">
                    Recent pinkeye treatment — dusty winds today increase risk
                  </div>
                </div>
                <div className="lp-mini-stat-row">
                  <div className="lp-mini-stat">
                    <div className="lp-mini-stat-num">7</div>
                    <div className="lp-mini-stat-label">Animals</div>
                  </div>
                  <div className="lp-mini-stat">
                    <div className="lp-mini-stat-num" style={{ color: "#c0392b" }}>2</div>
                    <div className="lp-mini-stat-label">Alerts</div>
                  </div>
                  <div className="lp-mini-stat">
                    <div className="lp-mini-stat-num">5</div>
                    <div className="lp-mini-stat-label">Healthy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phone 2 — Alerts list */}
          <div className="lp-phone-frame">
            <div className="lp-phone-notch" />
            <div className="lp-phone-screen">
              <div style={{ background: "#1A3628", padding: 12 }}>
                <div style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 10,
                }}>
                  Herd Alerts{" "}
                  <span style={{
                    background: "#C97D20", color: "#fff",
                    fontSize: 8, padding: "2px 6px",
                    borderRadius: 10, marginLeft: 4,
                  }}>3</span>
                </div>

                <div style={{
                  background: "rgba(255,255,255,0.08)", borderRadius: 7,
                  padding: "7px 9px", marginBottom: 7,
                  fontSize: 8, color: "rgba(255,255,255,0.55)",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{
                    width: 6, height: 6,
                    background: "#F0A845", borderRadius: "50%",
                    flexShrink: 0, display: "inline-block",
                  }} />
                  AI analyzing 7 animals against live weather data
                </div>

                <div style={{
                  background: "rgba(192,57,43,0.2)",
                  border: "1px solid rgba(192,57,43,0.3)",
                  borderRadius: 7, padding: "8px 9px", marginBottom: 6,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#ff7e72" }}>
                      #101 · Angus Calf
                    </span>
                    <span style={{
                      fontSize: 8, background: "#c0392b",
                      color: "#fff", padding: "1px 5px", borderRadius: 3,
                    }}>HIGH</span>
                  </div>
                  <div style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 10, color: "#fff", marginBottom: 3,
                  }}>Pneumonia Risk</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
                    79% humidity + prior scours history flagged
                  </div>
                </div>

                <div style={{
                  background: "rgba(212,172,13,0.15)",
                  border: "1px solid rgba(212,172,13,0.25)",
                  borderRadius: 7, padding: "8px 9px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#D4AC0D" }}>
                      #103 · Angus Cow
                    </span>
                    <span style={{
                      fontSize: 8, background: "#D4AC0D",
                      color: "#0F1C15", padding: "1px 5px", borderRadius: 3,
                    }}>MED</span>
                  </div>
                  <div style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 10, color: "#fff", marginBottom: 3,
                  }}>Pinkeye Watch</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
                    High winds today + recent eye treatment on file
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="lp-trust-bar">
          <div className="lp-trust-item"><strong>14-day</strong> free trial</div>
          <div className="lp-trust-item"><strong>No card</strong> required</div>
          <div className="lp-trust-item"><strong>$12/mo</strong> after trial</div>
          <div className="lp-trust-item"><strong>Cancel</strong> anytime</div>
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

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="lp-how" id="lp-how">
        <p className="lp-section-label">How It Works</p>
        <h2 className="lp-section-headline">
          Set up in minutes. Runs in the background.
        </h2>
        <p className="lp-section-sub">
          No training. No complicated onboarding. Just add your animals and
          RanchPad gets to work.
        </p>

        <div className="lp-steps-row">
          <div className="lp-step">
            <div className="lp-step-num">1</div>
            <h4>Add Your Herd</h4>
            <p>Enter your animals with basic info — species, tag, age. Import via CSV or add one by one.</p>
          </div>
          <div className="lp-step">
            <div className="lp-step-num">2</div>
            <h4>Log Health Events</h4>
            <p>Record treatments, vet visits, and notes as they happen. Photos and field notes included.</p>
          </div>
          <div className="lp-step">
            <div className="lp-step-num">3</div>
            <h4>AI Monitors Constantly</h4>
            <p>RanchPad cross-references your animals' histories with live local weather 24/7 and alerts you to risk.</p>
          </div>
          <div className="lp-step">
            <div className="lp-step-num">4</div>
            <h4>Act Before It's a Problem</h4>
            <p>Get actionable, individual-animal alerts ranked by severity — so you know exactly who to check first.</p>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section className="lp-pricing">
        <p className="lp-section-label">Simple Pricing</p>
        <h2 className="lp-section-headline">One plan. Everything included.</h2>
        <p className="lp-section-sub">
          No tiers, no confusing add-ons. If you raise livestock, this is built
          for you.
        </p>

        <div className="lp-pricing-card">
          <div className="lp-price-amount"><sup>$</sup>12</div>
          <div className="lp-price-period">per month · billed monthly</div>

          <ul className="lp-price-features">
            <li>Unlimited animals across all species</li>
            <li>AI-powered predictive disease alerts</li>
            <li>Real-time local weather integration</li>
            <li>Full health record history</li>
            <li>Role-based team access</li>
            <li>One-tap PDF export</li>
            <li>CSV import &amp; export</li>
            <li>Pasture &amp; location tagging</li>
            <li>Photo uploads on health records</li>
            <li>FAMACHA auto-alerts</li>
          </ul>

          <button className="lp-btn-green" onClick={openSignup}>
            Start Free 14-Day Trial
          </button>
          <p className="lp-price-trial">No credit card required. Cancel anytime.</p>
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
        <div className="lp-footer-logo">Ranch<span>Pad</span></div>
        <div className="lp-footer-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
        <div className="lp-footer-copy">© 2026 RanchPad · Built in Kansas</div>
      </footer>

    </div>
  );
}
