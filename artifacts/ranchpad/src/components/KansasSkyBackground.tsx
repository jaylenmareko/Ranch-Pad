export function KansasSkyBackground() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        {/* Sky gradient — deep blue zenith to amber horizon */}
        <linearGradient id="ks-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0c1c35" />
          <stop offset="20%"  stopColor="#16386a" />
          <stop offset="42%"  stopColor="#2b6098" />
          <stop offset="58%"  stopColor="#5494bc" />
          <stop offset="70%"  stopColor="#9ec0d4" />
          <stop offset="78%"  stopColor="#d8bc80" />
          <stop offset="86%"  stopColor="#e88a38" />
          <stop offset="93%"  stopColor="#c84e18" />
          <stop offset="100%" stopColor="#7a2808" />
        </linearGradient>

        {/* Sun glow — wide radial from right-of-center horizon */}
        <radialGradient id="ks-sun-glow" cx="56%" cy="60%" r="44%">
          <stop offset="0%"   stopColor="#ffe070" stopOpacity="0.88" />
          <stop offset="20%"  stopColor="#f4a040" stopOpacity="0.50" />
          <stop offset="50%"  stopColor="#e06020" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#e06020" stopOpacity="0"   />
        </radialGradient>

        {/* Bottom vignette */}
        <linearGradient id="ks-vignette" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#080e04" stopOpacity="0"   />
          <stop offset="100%" stopColor="#080e04" stopOpacity="0.60" />
        </linearGradient>

        {/* Edge darkening — left */}
        <linearGradient id="ks-edge-l" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#050c02" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#050c02" stopOpacity="0"   />
        </linearGradient>
        {/* Edge darkening — right */}
        <linearGradient id="ks-edge-r" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#050c02" stopOpacity="0"   />
          <stop offset="100%" stopColor="#050c02" stopOpacity="0.30" />
        </linearGradient>

        {/* Single light cloud blur — just enough softness, not blobby */}
        <filter id="ks-cloud" x="-15%" y="-25%" width="130%" height="150%">
          <feGaussianBlur stdDeviation="5" />
        </filter>

        {/* Very soft blur for far/wispy clouds */}
        <filter id="ks-cloud-far" x="-10%" y="-15%" width="120%" height="130%">
          <feGaussianBlur stdDeviation="3" />
        </filter>

        {/* Sun disk glow */}
        <filter id="ks-sun" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>

      {/* ── SKY ─────────────────────────────────────────── */}
      <rect width="1440" height="900" fill="url(#ks-sky)" />
      <rect width="1440" height="900" fill="url(#ks-sun-glow)" />

      {/* Sun disk */}
      <ellipse cx="808" cy="541" rx="72" ry="20" fill="#ffe898" opacity="0.80" filter="url(#ks-sun)" />
      <ellipse cx="808" cy="541" rx="24" ry="9"  fill="#fff5c0" opacity="0.92" filter="url(#ks-sun)" />

      {/* ── CLOUDS ─────────────────────────────────────── */}

      {/*
        Strategy: 3 distinct cloud formations, each built from a handful of
        overlapping ellipses at light blur — looks illustrated/painted, not blobby.
      */}

      {/* Cloud A — large anvil, upper-left */}
      <g filter="url(#ks-cloud)" opacity="0.82">
        {/* Top dome — bright white/cream */}
        <ellipse cx="310" cy="140" rx="195" ry="72" fill="#f4efe6" />
        <ellipse cx="265" cy="128" rx="135" ry="58" fill="#faf7f0" />
        <ellipse cx="370" cy="152" rx="155" ry="62" fill="#ede8dc" />
        <ellipse cx="300" cy="108" rx="110" ry="48" fill="#fff8f0" />
        {/* Base — warm amber lit underside */}
        <ellipse cx="315" cy="198" rx="175" ry="38" fill="#c8a050" opacity="0.70" />
        <ellipse cx="280" cy="190" rx="125" ry="28" fill="#b89040" opacity="0.55" />
      </g>

      {/* Cloud B — mid-right, tall cumulus */}
      <g filter="url(#ks-cloud)" opacity="0.78">
        <ellipse cx="1090" cy="130" rx="180" ry="65" fill="#eee8d8" />
        <ellipse cx="1040" cy="115" rx="130" ry="55" fill="#f8f4ec" />
        <ellipse cx="1150" cy="145" rx="145" ry="60" fill="#e8e0cc" />
        <ellipse cx="1080" cy="90"  rx="105" ry="44" fill="#fdf8f2" />
        {/* Amber belly */}
        <ellipse cx="1090" cy="182" rx="158" ry="34" fill="#c09848" opacity="0.65" />
      </g>

      {/* Cloud C — small, high altitude, upper-center pushed above text zone */}
      <g filter="url(#ks-cloud-far)" opacity="0.44">
        <ellipse cx="720" cy="95" rx="130" ry="36" fill="#d8e8f2" />
        <ellipse cx="692" cy="85" rx="90"  ry="28" fill="#e4f0f8" />
        <ellipse cx="768" cy="100" rx="100" ry="32" fill="#cce0ee" />
      </g>

      {/* Distant high cirrus streaks — purely horizontal, very faint */}
      <g filter="url(#ks-cloud-far)" opacity="0.30">
        <ellipse cx="200"  cy="290" rx="140" ry="18" fill="#c0d4e4" />
        <ellipse cx="1250" cy="268" rx="120" ry="15" fill="#b8cce0" />
        <ellipse cx="860"  cy="310" rx="100" ry="14" fill="#c8d8e8" />
      </g>

      {/* ── HORIZON ─────────────────────────────────────── */}

      {/* Far prairie base */}
      <path d="M 0 540 C 480 534 960 538 1440 535 L 1440 900 L 0 900 Z"
            fill="#72622e" />

      {/* Treeline — left */}
      <path d="
        M 0 542
        C 18 528 30 518 50 525 C 63 520 74 510 90 518
        C 104 513 116 503 134 511 C 148 506 160 496 178 504
        C 193 499 205 508 224 512 C 240 507 253 498 272 506
        C 287 501 300 511 320 514 C 336 510 355 518 382 522
        L 382 542 Z
      " fill="#16240e" opacity="0.92" />

      {/* Treeline — right */}
      <path d="
        M 1058 542
        C 1080 532 1100 524 1122 530 C 1138 526 1152 517 1172 524
        C 1187 519 1200 510 1218 518 C 1233 513 1248 522 1268 526
        C 1285 521 1300 514 1320 521 C 1338 517 1358 525 1385 529
        C 1408 524 1428 531 1440 530 L 1440 542 Z
      " fill="#16240e" opacity="0.92" />

      {/* Grain elevator complex */}
      <g fill="#111c09" opacity="0.86">
        <rect x="858" y="476" width="22" height="66" rx="1" />
        <ellipse cx="869" cy="476" rx="11" ry="5" />
        <rect x="882" y="485" width="18" height="57" rx="1" />
        <ellipse cx="891" cy="485" rx="9"  ry="4" />
        <rect x="902" y="492" width="16" height="50" rx="1" />
        <ellipse cx="910" cy="492" rx="8"  ry="3.5" />
        <rect x="920" y="498" width="14" height="44" rx="1" />
        <ellipse cx="927" cy="498" rx="7"  ry="3" />
        <rect x="936" y="504" width="12" height="38" rx="1" />
        <ellipse cx="942" cy="504" rx="6"  ry="2.5" />
        <rect x="845" y="525" width="110" height="17" />
        <rect x="828" y="532" width="18" height="10" />
        <rect x="840" y="514" width="7"  height="26" />
        <rect x="882" y="520" width="5"  height="22" />
        <rect x="920" y="526" width="5"  height="16" />
        <rect x="857" y="473" width="83" height="3" />
        <path d="M 848 542 L 860 514 L 866 514 L 854 542 Z" />
      </g>

      {/* Distant crop field bands */}
      <rect x="383" y="536" width="474" height="4" fill="#8a9440" opacity="0.30" />
      <rect x="959" y="535" width="98"  height="3" fill="#8a9440" opacity="0.25" />

      {/* Mid-ground prairie */}
      <path d="M 0 578 C 180 570 400 576 620 571 C 840 566 1060 573 1280 568 C 1360 566 1410 571 1440 569 L 1440 900 L 0 900 Z"
            fill="#506e28" opacity="0.90" />

      {/* Foreground grass wave 1 */}
      <path d="M 0 642 C 110 630 240 643 390 634 C 540 625 670 639 820 629 C 970 619 1110 634 1270 624 C 1360 618 1410 628 1440 622 L 1440 900 L 0 900 Z"
            fill="#405c20" opacity="0.94" />

      {/* Foreground grass wave 2 */}
      <path d="M 0 702 C 90 690 210 704 350 695 C 490 686 610 700 760 690 C 910 680 1040 696 1190 686 C 1300 679 1380 692 1440 686 L 1440 900 L 0 900 Z"
            fill="#344e18" opacity="0.97" />

      {/* Subtle amber crest highlight on nearest grass wave */}
      <path d="M 0 702 C 90 690 210 704 350 695 C 490 686 610 700 760 690 C 910 680 1040 696 1190 686 C 1300 679 1380 692 1440 686"
            stroke="#9ab038" strokeWidth="2" fill="none" opacity="0.16" />

      {/* Grass blades */}
      <g opacity="0.50" fill="#2c4410">
        <path d="M 28 820 Q 22 786 34 762 Q 39 786 37 820 Z" />
        <path d="M 50 828 Q 45 794 56 770 Q 61 794 58 828 Z" />
        <path d="M 76 818 Q 72 784 82 760 Q 87 784 85 818 Z" />
        <path d="M 200 824 Q 196 790 207 766 Q 212 790 209 824 Z" />
        <path d="M 226 816 Q 222 782 232 758 Q 237 782 234 816 Z" />
        <path d="M 384 820 Q 380 786 390 762 Q 395 786 393 820 Z" />
        <path d="M 408 828 Q 404 794 414 770 Q 419 794 417 828 Z" />
        <path d="M 582 822 Q 578 788 589 764 Q 594 788 591 822 Z" />
        <path d="M 606 816 Q 602 782 612 758 Q 617 782 615 816 Z" />
        <path d="M 762 820 Q 758 786 769 762 Q 774 786 771 820 Z" />
        <path d="M 788 826 Q 784 792 794 768 Q 799 792 797 826 Z" />
        <path d="M 962 820 Q 958 786 968 762 Q 973 786 971 820 Z" />
        <path d="M 988 816 Q 984 782 994 758 Q 999 782 997 816 Z" />
        <path d="M 1082 824 Q 1078 790 1088 766 Q 1093 790 1091 824 Z" />
        <path d="M 1242 820 Q 1238 786 1248 762 Q 1253 786 1251 820 Z" />
        <path d="M 1268 828 Q 1264 794 1274 770 Q 1279 794 1277 828 Z" />
        <path d="M 1382 822 Q 1378 788 1388 764 Q 1393 788 1391 822 Z" />
      </g>

      {/* ── DEPTH & ATMOSPHERE ──────────────────────────── */}
      <rect y="680" width="1440" height="220" fill="url(#ks-vignette)" />
      <rect width="160" height="900" fill="url(#ks-edge-l)" />
      <rect x="1280" width="160" height="900" fill="url(#ks-edge-r)" />

      {/* Very faint warm haze band at horizon */}
      <rect x="0" y="512" width="1440" height="50" fill="#f0b840" opacity="0.04" />
    </svg>
  );
}
