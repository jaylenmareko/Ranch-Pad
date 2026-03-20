export function HoofIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      className={className}
    >
      {/*
        Cloven hoof silhouette — two realistic digits (claws).
        Each claw is wider at the top (coronary band) and tapers
        to a rounded tip at the bottom (toe), matching real hoof anatomy.
        The 1-unit gap at x=11.5–12.5 creates the visible cleft.
      */}
      {/* Left claw */}
      <path d="M 10.5 3 C 8 3 5 6.5 5 11.5 C 5 16.5 7 21.5 9.5 22.5 C 10.5 22.9 11.5 22.2 11.5 20 C 11.5 13 11.5 5.5 10.5 3 Z" />
      {/* Right claw (mirror) */}
      <path d="M 13.5 3 C 16 3 19 6.5 19 11.5 C 19 16.5 17 21.5 14.5 22.5 C 13.5 22.9 12.5 22.2 12.5 20 C 12.5 13 12.5 5.5 13.5 3 Z" />
    </svg>
  );
}
