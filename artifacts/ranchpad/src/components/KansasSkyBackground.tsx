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
        {/* Sky — deep blue zenith → golden amber horizon */}
        <linearGradient id="ks-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0c1c35" />
          <stop offset="18%"  stopColor="#16386a" />
          <stop offset="38%"  stopColor="#2b6098" />
          <stop offset="56%"  stopColor="#5494bc" />
          <stop offset="68%"  stopColor="#9ec0d4" />
          <stop offset="76%"  stopColor="#d8bc80" />
          <stop offset="84%"  stopColor="#e88a38" />
          <stop offset="91%"  stopColor="#c84e18" />
          <stop offset="100%" stopColor="#7a2808" />
        </linearGradient>

        {/* Sun glow radial — centered just right of horizon center */}
        <radialGradient id="ks-sun-glow" cx="56%" cy="60%" r="45%">
          <stop offset="0%"   stopColor="#ffe070" stopOpacity="0.95" />
          <stop offset="18%"  stopColor="#f4a040" stopOpacity="0.55" />
          <stop offset="45%"  stopColor="#e06020" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#e06020" stopOpacity="0"   />
        </radialGradient>

        {/* Ground darkening vignette */}
        <linearGradient id="ks-vignette" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#080e04" stopOpacity="0"   />
          <stop offset="100%" stopColor="#080e04" stopOpacity="0.65" />
        </linearGradient>

        {/* Left/right edge darkening */}
        <linearGradient id="ks-edge-l" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#050c02" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#050c02" stopOpacity="0"  />
        </linearGradient>
        <linearGradient id="ks-edge-r" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#050c02" stopOpacity="0"   />
          <stop offset="100%" stopColor="#050c02" stopOpacity="0.35" />
        </linearGradient>

        {/* Cloud blur — heavy, volumetric */}
        <filter id="ks-cloud-vol" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        {/* Cloud blur — medium */}
        <filter id="ks-cloud-med" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        {/* Cloud blur — soft/wispy */}
        <filter id="ks-cloud-wisp" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        {/* Sun glow blur */}
        <filter id="ks-sun-blur" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
        {/* Horizon haze */}
        <filter id="ks-haze" x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      {/* ── BASE SKY ─────────────────────────────────────────────── */}
      <rect width="1440" height="900" fill="url(#ks-sky)" />

      {/* Sun radial glow across full canvas */}
      <rect width="1440" height="900" fill="url(#ks-sun-glow)" />

      {/* Bright sun disk on horizon */}
      <ellipse cx="808" cy="542" rx="80" ry="22"
               fill="#ffe898" opacity="0.85" filter="url(#ks-sun-blur)" />
      <ellipse cx="808" cy="542" rx="28" ry="10"
               fill="#fff5c0" opacity="0.95" filter="url(#ks-sun-blur)" />

      {/* ── CLOUDS ───────────────────────────────────────────────── */}

      {/* Far-back high clouds — cool blue-white (upper left) */}
      <g filter="url(#ks-cloud-vol)" opacity="0.52">
        <ellipse cx="200"  cy="148" rx="240" ry="78"  fill="#bcd4e8" />
        <ellipse cx="155"  cy="130" rx="160" ry="60"  fill="#cce0f0" />
        <ellipse cx="280"  cy="162" rx="190" ry="68"  fill="#b4cce4" />
        <ellipse cx="190"  cy="108" rx="120" ry="48"  fill="#d8ecf8" />
      </g>

      {/* Far-back high clouds — upper right */}
      <g filter="url(#ks-cloud-vol)" opacity="0.60">
        <ellipse cx="1240" cy="118" rx="210" ry="68"  fill="#c4d8ec" />
        <ellipse cx="1190" cy="100" rx="155" ry="55"  fill="#d4e4f4" />
        <ellipse cx="1310" cy="132" rx="175" ry="62"  fill="#bcd0e8" />
        <ellipse cx="1250" cy="82"  rx="130" ry="48"  fill="#e0eef8" />
      </g>

      {/* Mid-sky cirrus wisp — subtle horizontal streaks */}
      <g filter="url(#ks-cloud-wisp)" opacity="0.38">
        <ellipse cx="620"  cy="240" rx="210" ry="30"  fill="#c0d4e4" />
        <ellipse cx="700"  cy="226" rx="130" ry="22"  fill="#ccdde8" />
        <ellipse cx="520"  cy="258" rx="110" ry="20"  fill="#b8cce0" />
      </g>

      {/* Large dramatic cumulus — left of center, cream-white top, golden belly */}
      <g filter="url(#ks-cloud-vol)" opacity="0.76">
        <ellipse cx="390"  cy="195" rx="295" ry="105" fill="#e8dcc8" />
        <ellipse cx="330"  cy="172" rx="210" ry="85"  fill="#f4ece0" />
        <ellipse cx="460"  cy="215" rx="240" ry="95"  fill="#e0d4bc" />
        <ellipse cx="360"  cy="142" rx="165" ry="68"  fill="#faf4ec" />
        <ellipse cx="440"  cy="158" rx="140" ry="58"  fill="#f0e8d8" />
        {/* Warm amber lit belly */}
        <ellipse cx="400"  cy="275" rx="210" ry="52"  fill="#d8a860" />
        <ellipse cx="350"  cy="265" rx="145" ry="40"  fill="#c89848" />
      </g>

      {/* Large cumulus — right of center, warm-toned */}
      <g filter="url(#ks-cloud-vol)" opacity="0.70">
        <ellipse cx="1060" cy="178" rx="270" ry="90"  fill="#ddd0b8" />
        <ellipse cx="1000" cy="158" rx="195" ry="75"  fill="#ece4d0" />
        <ellipse cx="1125" cy="198" rx="220" ry="82"  fill="#d4c8b0" />
        <ellipse cx="1050" cy="128" rx="155" ry="62"  fill="#f0e8d8" />
        {/* Golden belly */}
        <ellipse cx="1070" cy="255" rx="195" ry="48"  fill="#c89848" />
        <ellipse cx="1030" cy="245" rx="140" ry="36"  fill="#b88838" />
      </g>

      {/* Floating mid-sky warm cloud bank near horizon */}
      <g filter="url(#ks-cloud-med)" opacity="0.58">
        <ellipse cx="700"  cy="380" rx="280" ry="62"  fill="#e0b870" />
        <ellipse cx="650"  cy="364" rx="195" ry="50"  fill="#ecc880" />
        <ellipse cx="760"  cy="395" rx="220" ry="55"  fill="#d8a860" />
        <ellipse cx="680"  cy="345" rx="160" ry="42"  fill="#f0d48c" />
      </g>

      {/* Small scattered warm puffs near horizon */}
      <g filter="url(#ks-cloud-wisp)" opacity="0.45">
        <ellipse cx="200"  cy="420" rx="140" ry="32"  fill="#d8a050" />
        <ellipse cx="230"  cy="408" rx="95"  ry="25"  fill="#e4b060" />
        <ellipse cx="1250" cy="405" rx="155" ry="34"  fill="#c89040" />
        <ellipse cx="1220" cy="392" rx="105" ry="26"  fill="#d8a050" />
      </g>

      {/* ── HORIZON ATMOSPHERIC HAZE ─────────────────────────────── */}
      <ellipse cx="720" cy="545" rx="720" ry="90"
               fill="#f4c058" opacity="0.14" filter="url(#ks-haze)" />

      {/* ── EARTH ────────────────────────────────────────────────── */}

      {/* Far prairie base — warm ochre, very flat */}
      <path d="M 0 540 C 480 534 960 538 1440 535 L 1440 900 L 0 900 Z"
            fill="#72622e" />

      {/* ── HORIZON SILHOUETTES ───────────────────────────────────── */}

      {/* Treeline — left quarter of horizon */}
      <path d="
        M 0 542
        C 18 528 30 518 50 525
        C 63 520 74 510 90 518
        C 104 513 116 503 134 511
        C 148 506 160 496 178 504
        C 193 499 205 508 224 512
        C 240 507 253 498 272 506
        C 287 501 300 511 320 514
        C 336 510 355 518 382 522
        L 382 542 Z
      " fill="#16240e" opacity="0.90" />

      {/* Treeline — right quarter of horizon */}
      <path d="
        M 1058 542
        C 1080 532 1100 524 1122 530
        C 1138 526 1152 517 1172 524
        C 1187 519 1200 510 1218 518
        C 1233 513 1248 522 1268 526
        C 1285 521 1300 514 1320 521
        C 1338 517 1358 525 1385 529
        C 1408 524 1428 531 1440 530
        L 1440 542 Z
      " fill="#16240e" opacity="0.90" />

      {/* ── GRAIN ELEVATOR COMPLEX ──────────────────────────────── */}
      {/* Positioned right of center on the open horizon */}
      <g fill="#111c09" opacity="0.84">
        {/* Main silo towers (tallest first) */}
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

        {/* Low horizontal dryer house */}
        <rect x="845" y="525" width="110" height="17" />

        {/* Smaller left structure */}
        <rect x="828" y="532" width="18" height="10" />

        {/* Leg / chute structure */}
        <rect x="840" y="514" width="7"  height="26" />
        <rect x="882" y="520" width="5"  height="22" />
        <rect x="920" y="526" width="5"  height="16" />

        {/* Catwalk rail along tops */}
        <rect x="857" y="473" width="83" height="3" />

        {/* Conveyor leg to ground */}
        <path d="M 848 542 L 860 514 L 866 514 L 854 542 Z" />
      </g>

      {/* Open-sky crop fields between treelines — distant field bands */}
      <path d="M 382 536 C 600 532 820 534 858 532"
            stroke="#7a8c38" strokeWidth="2" fill="none" opacity="0.40" />
      <path d="M 382 538 C 600 534 820 536 858 534"
            stroke="#5a7228" strokeWidth="1.5" fill="none" opacity="0.28" />
      <path d="M 958 533 C 1000 531 1030 532 1058 531"
            stroke="#7a8c38" strokeWidth="1.5" fill="none" opacity="0.35" />

      {/* Field rectangles in far distance — wheat/crop rows */}
      <rect x="430" y="537" width="250" height="5" fill="#8a9440" opacity="0.22" />
      <rect x="620" y="537" width="160" height="4" fill="#7a8830" opacity="0.18" />

      {/* ── MID GROUND ────────────────────────────────────────────── */}

      {/* Prairie mid-layer, olive-green */}
      <path d="M 0 580 C 180 570 400 577 620 572 C 840 567 1060 574 1280 569 C 1360 567 1410 572 1440 570 L 1440 900 L 0 900 Z"
            fill="#506e28" opacity="0.88" />

      {/* Warm sun highlight band on mid-ground */}
      <path d="M 400 571 C 580 567 760 570 960 567 C 1040 565 1120 568 1200 566"
            stroke="#c0a030" strokeWidth="4" fill="none" opacity="0.20" />

      {/* ── FOREGROUND GRASS ─────────────────────────────────────── */}

      {/* Grass wave 1 — dark olive */}
      <path d="M 0 645 C 110 632 240 645 390 636 C 540 627 670 641 820 631 C 970 621 1110 636 1270 626 C 1360 620 1410 630 1440 624 L 1440 900 L 0 900 Z"
            fill="#405c20" opacity="0.93" />

      {/* Grass wave 2 — richer green, closer */}
      <path d="M 0 705 C 90 692 210 706 350 697 C 490 688 610 702 760 692 C 910 682 1040 698 1190 688 C 1300 681 1380 694 1440 688 L 1440 900 L 0 900 Z"
            fill="#344e18" opacity="0.96" />

      {/* Thin amber highlight seam at wave crests */}
      <path d="M 0 705 C 90 692 210 706 350 697 C 490 688 610 702 760 692 C 910 682 1040 698 1190 688 C 1300 681 1380 694 1440 688"
            stroke="#9ab038" strokeWidth="2" fill="none" opacity="0.18" />

      {/* Sun catchlight on near-ground */}
      <path d="M 550 632 C 680 626 810 632 940 626 L 940 658 C 810 656 680 660 550 660 Z"
            fill="#b8c050" opacity="0.08" />

      {/* ── GRASS BLADES (foreground detail) ───────────────────── */}
      <g opacity="0.55">
        {/* Left cluster */}
        <path d="M 28 820 Q 22 786 34 762 Q 39 786 37 820 Z" fill="#2c4410" />
        <path d="M 48 828 Q 43 794 54 770 Q 60 794 57 828 Z" fill="#344c14" />
        <path d="M 68 818 Q 64 784 74 760 Q 80 784 77 818 Z" fill="#2c4410" />
        <path d="M 92 824 Q 88 790 98 766 Q 104 790 100 824 Z" fill="#3a5218" />
        <path d="M 115 816 Q 112 782 121 758 Q 127 782 124 816 Z" fill="#2c4410" />
        {/* Second cluster */}
        <path d="M 200 822 Q 195 788 206 764 Q 211 788 208 822 Z" fill="#344c14" />
        <path d="M 224 814 Q 220 780 230 756 Q 236 780 232 814 Z" fill="#2c4410" />
        <path d="M 248 826 Q 244 792 254 768 Q 260 792 256 826 Z" fill="#3a5218" />
        {/* Third */}
        <path d="M 380 820 Q 375 786 386 762 Q 391 786 388 820 Z" fill="#2c4410" />
        <path d="M 404 826 Q 400 792 410 768 Q 416 792 412 826 Z" fill="#344c14" />
        <path d="M 428 818 Q 424 784 434 760 Q 440 784 436 818 Z" fill="#2c4410" />
        {/* Center */}
        <path d="M 580 824 Q 575 790 586 766 Q 591 790 588 824 Z" fill="#344c14" />
        <path d="M 604 816 Q 600 782 610 758 Q 616 782 612 816 Z" fill="#2c4410" />
        <path d="M 628 822 Q 624 788 634 764 Q 640 788 636 822 Z" fill="#3a5218" />
        {/* Right of center */}
        <path d="M 760 820 Q 755 786 766 762 Q 771 786 768 820 Z" fill="#2c4410" />
        <path d="M 784 828 Q 780 794 790 770 Q 796 794 792 828 Z" fill="#344c14" />
        <path d="M 808 818 Q 804 784 814 760 Q 820 784 816 818 Z" fill="#2c4410" />
        {/* Far right */}
        <path d="M 960 822 Q 955 788 966 764 Q 971 788 968 822 Z" fill="#344c14" />
        <path d="M 984 816 Q 980 782 990 758 Q 996 782 992 816 Z" fill="#2c4410" />
        <path d="M 1080 824 Q 1075 790 1086 766 Q 1091 790 1088 824 Z" fill="#3a5218" />
        <path d="M 1104 818 Q 1100 784 1110 760 Q 1116 784 1112 818 Z" fill="#2c4410" />
        <path d="M 1240 820 Q 1235 786 1246 762 Q 1251 786 1248 820 Z" fill="#344c14" />
        <path d="M 1264 826 Q 1260 792 1270 768 Q 1276 792 1272 826 Z" fill="#2c4410" />
        <path d="M 1380 822 Q 1375 788 1386 764 Q 1391 788 1388 822 Z" fill="#3a5218" />
        <path d="M 1408 816 Q 1404 782 1414 758 Q 1420 782 1416 816 Z" fill="#2c4410" />
      </g>

      {/* ── ATMOSPHERE & DEPTH ─────────────────────────────────────── */}

      {/* Bottom vignette — pulls eye upward */}
      <rect y="680" width="1440" height="220" fill="url(#ks-vignette)" />

      {/* Side edge darkening — cinematic letter-box feel */}
      <rect width="160" height="900" fill="url(#ks-edge-l)" />
      <rect x="1280" width="160" height="900" fill="url(#ks-edge-r)" />

      {/* Subtle warm atmosphere haze band at horizon */}
      <rect x="0" y="510" width="1440" height="60" fill="#f0b840" opacity="0.05" />
    </svg>
  );
}
