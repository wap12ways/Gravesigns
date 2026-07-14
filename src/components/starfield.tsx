/**
 * A quiet, deterministic starfield rendered behind the hero. Positions are
 * generated from a fixed seed so server and client markup match (no hydration
 * mismatch) and the layout never jumps between renders.
 */
function seededStars(count: number) {
  const stars: { x: number; y: number; r: number; delay: number }[] = [];
  let seed = 20240514;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand() * 100,
      y: rand() * 100,
      r: rand() * 1.3 + 0.3,
      delay: rand() * 6,
    });
  }
  return stars;
}

export function Starfield() {
  const stars = seededStars(90);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg className="h-full w-full" preserveAspectRatio="none">
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={`${s.x}%`}
            cy={`${s.y}%`}
            r={s.r}
            fill="#f4d98c"
            className="animate-twinkle"
            style={{ animationDelay: `${s.delay}s` }}
            opacity={0.5}
          />
        ))}
      </svg>
    </div>
  );
}
