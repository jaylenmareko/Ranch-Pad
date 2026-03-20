export function HoofIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Cupola on peak */}
      <rect x="10" y="1" width="4" height="2.5" rx="0.5" />
      {/* Gable roof */}
      <polyline points="1,11 12,2.5 23,11" />
      {/* Barn walls + floor */}
      <path d="M 3 11 L 3 22 L 21 22 L 21 11" />
      {/* Eave line */}
      <line x1="3" y1="11" x2="21" y2="11" />
      {/* X brace on front face */}
      <line x1="3" y1="11" x2="21" y2="22" />
      <line x1="21" y1="11" x2="3" y2="22" />
    </svg>
  );
}
