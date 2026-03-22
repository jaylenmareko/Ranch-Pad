import React from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Upload, Plus } from "lucide-react";
import { HoofIcon } from "@/components/HoofIcon";
import { useNavigation } from "@/contexts/navigation-context";

const BULLETS = [
  "Track animals, health events, and medications",
  "Get weather-aware alerts for your herd",
  "Import your existing records in seconds",
  "Access your data on any device",
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
      className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center"
      style={{
        background:
          "linear-gradient(180deg, #6BAED6 0%, #9ECAE1 15%, #A8D5A2 38%, #52A447 62%, #2D6B1F 100%)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
          <HoofIcon className="w-7 h-7 text-white" />
        </div>
        <span className="font-display font-bold text-4xl text-white drop-shadow-sm tracking-tight">
          RanchPad
        </span>
      </div>

      {/* Tagline */}
      <p className="text-lg font-semibold text-white/90 mb-10 max-w-sm leading-snug drop-shadow-sm">
        Smart livestock management for every ranch.
      </p>

      {/* Bullets */}
      <ul className="flex flex-col gap-3 mb-10 text-left max-w-xs w-full">
        {BULLETS.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5 drop-shadow-sm" />
            <span className="text-white/90 font-medium text-sm leading-relaxed drop-shadow-sm">
              {point}
            </span>
          </li>
        ))}
      </ul>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
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
  );
}
