import React from "react";
import { Warehouse } from "lucide-react";
import "./RanchPadLogo.css";

interface RanchPadLogoProps {
  size?: "sm" | "md" | "lg";
}

export function RanchPadLogo({ size = "md" }: RanchPadLogoProps) {
  return (
    <div className={`rp-logo rp-logo--${size}`}>
      <div className="rp-logo-icon">
        <Warehouse className="rp-logo-warehouse" />
      </div>
      <span className="rp-logo-name">RanchPad</span>
    </div>
  );
}
