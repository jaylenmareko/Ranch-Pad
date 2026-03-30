import { useLocation } from "wouter";
import { CheckCircle2 } from "lucide-react";
import { HoofIcon } from "@/components/HoofIcon";
import { useNavigation } from "@/contexts/navigation-context";

const BULLETS = [
  "Your whole team sees the same live records — from the field, the office, or across the state.",
  "Your herd's health forecast, not just the weather — know which animals are at risk before symptoms show up.",
  "AI spots patterns in your herd you'd never catch flipping through a notebook.",
  "Snap a photo of your paper records and AI converts them instantly.",
  "Your records don't just sit there — AI flags problems, spots patterns, and warns you before things go wrong.",
];

export default function Landing() {
  const { markNavigated } = useNavigation();
  const [, navigate] = useLocation();

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
        <p className="text-base font-semibold text-white mb-8 tracking-wide uppercase" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.85)" }}>
          Livestock Management
        </p>

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

        {/* Action button */}
        <div className="flex justify-center w-full">
          <button
            onClick={() => { markNavigated(); navigate("/"); }}
            className="inline-flex items-center justify-center h-12 px-10 rounded-xl font-bold text-base bg-white text-green-800 hover:bg-white/90 transition-colors shadow-md"
          >
            Build Your Ranch
          </button>
        </div>
      </div>
    </div>
  );
}
