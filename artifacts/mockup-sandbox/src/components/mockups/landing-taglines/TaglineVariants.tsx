const BG = "/__mockup/images/landing-bg.jpg";

const BULLETS = [
  "Warns you of disease risk before symptoms show up — based on your animals' health history and local weather.",
  "Every animal's full records on your phone in seconds — health events, medications, and treatments.",
  "Your ranch hands see only what they need. Your cattle clients see only their animals.",
];

function CheckIcon() {
  return (
    <svg className="w-5 h-5 shrink-0 mt-0.5 drop-shadow" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function RanchPadLogo() {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg text-xl">
        🏡
      </div>
      <span className="font-bold text-3xl text-white tracking-tight" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.85)" }}>
        RanchPad
      </span>
    </div>
  );
}

function HeroVariant({
  label,
  tagline,
  subTagline,
  taglineSize = "text-sm",
  dim = false,
}: {
  label: string;
  tagline: string;
  subTagline?: string;
  taglineSize?: string;
  dim?: boolean;
}) {
  return (
    <div className="flex flex-col items-stretch" style={{ width: 390 }}>
      <div className={`text-center text-xs font-bold uppercase tracking-widest mb-3 ${dim ? "text-gray-400" : "text-gray-200"}`}>
        {label}
      </div>

      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          height: 700,
          borderRadius: 24,
          border: dim ? "2.5px solid rgba(255,255,255,0.12)" : "2.5px solid rgba(255,255,255,0.3)",
          boxShadow: dim ? "0 8px 32px rgba(0,0,0,0.5)" : "0 16px 56px rgba(0,0,0,0.7)",
        }}
      >
        <img
          src={BG}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: dim ? "brightness(0.55) saturate(0.7)" : "brightness(0.65)" }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,0,0,0.22) 0%, transparent 100%)" }} />

        <div className="relative z-10 flex flex-col h-full px-6 pt-10 pb-6">
          <RanchPadLogo />

          <div className="mb-6">
            <p
              className={`font-semibold text-white tracking-wide uppercase ${taglineSize}`}
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.85)" }}
            >
              {tagline}
            </p>
            {subTagline && (
              <p
                className="text-white/80 text-xs font-medium tracking-wide uppercase mt-1.5"
                style={{ textShadow: "0 1px 6px rgba(0,0,0,0.85)" }}
              >
                {subTagline}
              </p>
            )}
          </div>

          <ul className="flex flex-col gap-3 mb-auto">
            {BULLETS.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckIcon />
                <span className="text-white text-xs font-medium leading-relaxed" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                  {b}
                </span>
              </li>
            ))}
          </ul>

          <button
            className="mt-6 w-full h-12 rounded-xl font-bold text-base shadow-md"
            style={{ background: "white", color: "#1a4a35" }}
          >
            Build Your Ranch
          </button>
        </div>
      </div>
    </div>
  );
}

export function TaglineVariants() {
  return (
    <div
      className="min-h-screen flex items-start justify-center gap-10 p-10"
      style={{ background: "#0f1e1b" }}
    >
      <HeroVariant
        label="Current"
        tagline="AI-Powered Livestock Management"
        taglineSize="text-sm"
        dim
      />

      <HeroVariant
        label="Option A — Outcome-led"
        tagline="Know before your animals get sick"
        taglineSize="text-base"
      />

      <HeroVariant
        label="Option B — Plain-spoken"
        tagline="Your whole herd. Every record. Right in your pocket."
        taglineSize="text-sm"
      />

      <HeroVariant
        label="Option C — Combined"
        tagline="Know before your animals get sick."
        subTagline="Every record. Right in your pocket."
        taglineSize="text-base"
      />
    </div>
  );
}
