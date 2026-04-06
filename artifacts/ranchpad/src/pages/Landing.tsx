import { CheckCircle2 } from "lucide-react";
import { HoofIcon } from "@/components/HoofIcon";
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
      className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center relative"
      style={{
        backgroundImage: "url('/landing-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Base darkening overlay */}
      <div className="absolute inset-0 bg-black/20" />
      {/* Radial scrim — extra darkness centred on the text block */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 65% at 50% 48%, rgba(0,0,0,0.28) 0%, transparent 100%)" }} />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
            <HoofIcon className="w-7 h-7 text-white" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))" }} />
          </div>
          <span className="font-display font-bold text-4xl text-white tracking-tight" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.85)" }}>
            RanchPad
          </span>
        </div>

        {/* Tagline */}
        <div className="mb-8">
          <p className="text-base font-semibold text-white tracking-wide uppercase whitespace-nowrap" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.85)" }}>
            Know before your animals get sick.
          </p>
          <p className="text-xs font-medium text-white/75 tracking-wide uppercase mt-1.5" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.85)" }}>
            Every record. Right in your pocket.
          </p>
        </div>

        {/* Bullets */}
        <ul className="flex flex-col gap-3 mb-10 text-left w-full">
          {BULLETS.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))" }} />
              <span className="text-white font-medium text-sm leading-relaxed" style={{ textShadow: "0 1px 5px rgba(0,0,0,0.85)" }}>
                {point}
              </span>
            </li>
          ))}
        </ul>

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
