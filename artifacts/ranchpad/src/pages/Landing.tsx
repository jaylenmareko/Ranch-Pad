import React from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Upload, Plus } from "lucide-react";
import { HoofIcon } from "@/components/HoofIcon";
import { useNavigation } from "@/contexts/navigation-context";

const BULLETS = [
  "Simple herd log for animals, treatments, and health.",
  "Get early warnings when local conditions raise disease risk.",
  "Get reminders so you never miss shots or treatments.",
];

export default function Landing() {
  const { markNavigated } = useNavigation();
  const [, navigate] = useLocation();

  function goTo(path: string) {
    markNavigated();
    navigate(path);
  }

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center relative"
      style={{
        backgroundImage: "url('/pasture-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Subtle dark overlay so text stays legible */}
      <div className="absolute inset-0 bg-black/25" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
            <HoofIcon className="w-7 h-7 text-white" />
          </div>
          <span className="font-display font-bold text-4xl text-white drop-shadow tracking-tight">
            RanchPad
          </span>
        </div>

        {/* Tagline */}
        <p className="text-base font-semibold text-white/90 mb-8 drop-shadow tracking-wide uppercase">
          Livestock Management
        </p>

        {/* Bullets */}
        <ul className="flex flex-col gap-3 mb-10 text-left w-full">
          {BULLETS.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5 drop-shadow" />
              <span className="text-white/90 font-medium text-sm leading-relaxed drop-shadow">
                {point}
              </span>
            </li>
          ))}
        </ul>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => goTo("/animals")}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-semibold text-sm bg-white/15 backdrop-blur-sm border border-white/40 text-white hover:bg-white/25 transition-colors shadow-md"
          >
            <Upload className="w-4 h-4 shrink-0" />
            Upload your herd from a csv file here
          </button>

          <button
            onClick={() => goTo("/animals/new")}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-semibold text-sm bg-white text-green-800 hover:bg-white/90 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Add Animal
          </button>
        </div>
      </div>
    </div>
  );
}
