export function BarnIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 11 L3 21 L21 21 L21 11" />
      <polyline points="1,11 12,2 23,11" />
      <line x1="3" y1="11" x2="21" y2="11" />
      <path d="M9 21 L9 16 Q12 13 15 16 L15 21" />
    </svg>
  );
}
