import React from "react";
import "./RanchPadLogo.css";

interface RanchPadLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
}

export function RanchPadLogo({ size = "md", variant = "light" }: RanchPadLogoProps) {
  return (
    <div className={`rp-logo rp-logo--${size} rp-logo--${variant}`}>
      Ranch<span className="rp-logo-pad">Pad</span>
    </div>
  );
}
