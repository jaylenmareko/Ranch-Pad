export function HoofIcon({ className }: { className?: string }) {
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
      {/* Left lobe of cloven hoof */}
      <path d="M 12 4 C 11 4 7 5 5 9 C 3 13 5 19 8 21 C 10 22 12 21 12 19" />
      {/* Right lobe of cloven hoof */}
      <path d="M 12 4 C 13 4 17 5 19 9 C 21 13 19 19 16 21 C 14 22 12 21 12 19" />
    </svg>
  );
}
