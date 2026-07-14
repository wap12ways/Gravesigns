import { cn } from "@/lib/utils";

/**
 * GraveSigns brand mark — a gold infinity carrying a seated fairy, with a
 * radiant guiding star and scattered sparkles. This is a hand-built SVG so the
 * app always renders a crisp mark at any size. To use the exact supplied
 * artwork instead, drop it at /public/logo.png and swap <GraveSignsMark /> for
 * a <Image src="/logo.png" ... /> where the mark is used.
 */
export function GraveSignsMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 200"
      className={cn("select-none", className)}
      role="img"
      aria-label="GraveSigns"
      fill="none"
    >
      <defs>
        <linearGradient id="gs-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7e3a1" />
          <stop offset="45%" stopColor="#e9c46a" />
          <stop offset="100%" stopColor="#b8901f" />
        </linearGradient>
        <radialGradient id="gs-star" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff3cf" />
          <stop offset="60%" stopColor="#f0c95a" />
          <stop offset="100%" stopColor="#e9c46a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Infinity ribbon */}
      <path
        d="M120 150
           C 92 150, 74 132, 56 132
           C 30 132, 18 150, 18 162
           C 18 176, 34 190, 56 190
           C 84 190, 100 168, 120 150
           C 140 132, 156 110, 184 110
           C 206 110, 222 124, 222 138
           C 222 150, 210 168, 184 168
           C 166 168, 148 150, 120 150 Z"
        fill="url(#gs-gold)"
        opacity="0.96"
      />
      <path
        d="M120 150
           C 92 150, 74 132, 56 132
           C 30 132, 18 150, 18 162
           C 18 176, 34 190, 56 190
           C 84 190, 100 168, 120 150
           C 140 132, 156 110, 184 110
           C 206 110, 222 124, 222 138
           C 222 150, 210 168, 184 168
           C 166 168, 148 150, 120 150 Z"
        stroke="#fff3cf"
        strokeOpacity="0.5"
        strokeWidth="1.2"
      />

      {/* Seated fairy silhouette */}
      <g fill="#3a3d4a">
        {/* wing */}
        <path
          d="M70 96
             C 48 70, 44 44, 58 36
             C 70 30, 82 52, 84 78
             C 86 96, 80 108, 70 96 Z"
          fill="#454857"
        />
        <path
          d="M70 100
             C 54 86, 50 66, 60 58
             C 70 52, 80 70, 82 90
             C 84 104, 78 112, 70 100 Z"
          fill="#3a3d4a"
        />
        {/* head */}
        <circle cx="104" cy="42" r="9" />
        {/* body / torso leaning forward */}
        <path
          d="M104 50
             C 112 52, 116 62, 112 74
             C 108 86, 98 92, 90 98
             L 96 108
             C 108 100, 122 92, 124 76
             C 126 60, 118 48, 104 50 Z"
        />
        {/* legs draped over the ribbon */}
        <path
          d="M96 104
             C 106 108, 118 116, 126 128
             L 118 134
             C 110 122, 100 114, 90 110 Z"
        />
        <path
          d="M104 108
             C 118 112, 132 122, 140 138
             L 132 142
             C 124 128, 112 118, 100 114 Z"
        />
        {/* reaching arm */}
        <path
          d="M112 66
             C 124 62, 138 58, 150 60
             L 149 66
             C 137 66, 124 70, 114 74 Z"
        />
      </g>

      {/* Guiding star */}
      <g transform="translate(168 46)">
        <circle r="26" fill="url(#gs-star)" opacity="0.7" />
        <path
          d="M0 -30 L5 -6 L30 0 L5 6 L0 30 L-5 6 L-30 0 L-5 -6 Z"
          fill="url(#gs-gold)"
        />
        <path
          d="M0 -14 L3 -3 L14 0 L3 3 L0 14 L-3 3 L-14 0 L-3 -3 Z"
          fill="#fff6da"
        />
      </g>

      {/* Sparkles */}
      <g fill="#f0c95a">
        <path d="M206 20 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z" />
        <path d="M214 68 l1.8 4.5 4.5 1.8 -4.5 1.8 -1.8 4.5 -1.8 -4.5 -4.5 -1.8 4.5 -1.8 Z" opacity="0.85" />
        <path d="M146 108 l1.5 3.8 3.8 1.5 -3.8 1.5 -1.5 3.8 -1.5 -3.8 -3.8 -1.5 3.8 -1.5 Z" opacity="0.8" />
      </g>
    </svg>
  );
}
