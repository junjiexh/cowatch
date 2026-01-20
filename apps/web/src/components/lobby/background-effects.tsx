export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Deep dark base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.15 0.05 280 / 50%), transparent),
            radial-gradient(ellipse 60% 40% at 100% 100%, oklch(0.12 0.08 320 / 30%), transparent),
            linear-gradient(to bottom, oklch(0.06 0.02 280), oklch(0.04 0.01 260))
          `,
        }}
      />

      {/* Animated cyan orb - top left */}
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full animate-pulse"
        style={{
          background: `radial-gradient(circle, oklch(0.75 0.15 195 / 15%), transparent 70%)`,
          filter: "blur(60px)",
          animationDuration: "4s",
        }}
      />

      {/* Animated pink orb - bottom right */}
      <div
        className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full animate-pulse"
        style={{
          background: `radial-gradient(circle, oklch(0.7 0.2 320 / 12%), transparent 70%)`,
          filter: "blur(80px)",
          animationDuration: "5s",
          animationDelay: "1s",
        }}
      />

      {/* Secondary cyan orb - center right */}
      <div
        className="absolute top-1/3 -right-20 w-[300px] h-[300px] rounded-full animate-pulse"
        style={{
          background: `radial-gradient(circle, oklch(0.75 0.15 195 / 10%), transparent 70%)`,
          filter: "blur(50px)",
          animationDuration: "6s",
          animationDelay: "2s",
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(oklch(1 0 0 / 10%) 1px, transparent 1px),
            linear-gradient(90deg, oklch(1 0 0 / 10%) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette effect */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, oklch(0 0 0 / 40%) 100%)`,
        }}
      />
    </div>
  );
}
