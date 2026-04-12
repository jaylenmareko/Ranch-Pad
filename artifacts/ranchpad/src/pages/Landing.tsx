import { CheckCircle2 } from "lucide-react";
import { useAuthModal } from "@/contexts/auth-modal-context";

const BULLETS = [
  "Cross-references local weather and each animal's health history to warn you of disease risk before symptoms show up.",
  "Role-based team access — owners, ranch hands, and outside viewers each see exactly what they need and nothing they don't.",
  "Every animal's full history searchable from your phone in seconds — health events, medications, and records.",
  "Free 2-week trial, then $12/month. Cancel anytime.",
];

export default function Landing() {
  const { openSignup, openLogin } = useAuthModal();

  return (
    <div
      className="flex-1 flex flex-col items-center justify-start sm:justify-center px-5 py-10 text-center relative overflow-y-auto"
      style={{
        backgroundImage: "url('/landing-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Base darkening overlay */}
      <div className="absolute inset-0 bg-black/30" />
      {/* Radial scrim */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 70% at 50% 48%, rgba(0,0,0,0.30) 0%, transparent 100%)" }} />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-4">
          <span className="font-display font-bold text-4xl text-white tracking-tight" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.85)" }}>
            RanchPad
          </span>
        </div>

        {/* Tagline */}
        <div className="mb-6">
          <p className="text-base font-semibold text-white tracking-wide uppercase" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.85)" }}>
            All herd records in one place.
          </p>
          <p className="text-xs font-medium text-white/75 tracking-wide uppercase mt-1.5" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.85)" }}>
            Every document easily accessible for customers, vets, or anyone in seconds.
          </p>
        </div>

        {/* Bullet list — frosted card */}
        <div
          className="w-full rounded-2xl mb-6 overflow-hidden"
          style={{
            background: "rgba(10, 30, 26, 0.55)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <ul className="flex flex-col divide-y divide-white/8">
            {BULLETS.map((point, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3">
                <CheckCircle2
                  className="w-4.5 h-4.5 shrink-0 mt-0.5"
                  style={{ color: "#42A96E", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }}
                />
                <span className="text-white/90 text-sm leading-snug text-left" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={openSignup}
            className="inline-flex items-center justify-center h-12 px-10 rounded-xl font-bold text-base bg-white text-green-800 hover:bg-white/90 transition-colors shadow-md w-full"
          >
            Start Your Free 2-Week Trial
          </button>
          <button
            onClick={openLogin}
            className="text-sm font-semibold text-white/85 hover:text-white transition-colors underline underline-offset-2"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
          >
            Already have an account? Log in
          </button>
        </div>
      </div>
    </div>
  );
}
