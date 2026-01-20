export function HeroSection() {
  return (
    <section className="text-center pt-32 pb-12 sm:pt-40 sm:pb-16 px-4">
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <span className="neon-text block sm:inline">
          Distance is no longer
        </span>
        <br className="hidden sm:block" />
        <span className="text-white/90 block sm:inline"> a barrier</span>
      </h1>

      <p className="text-lg sm:text-xl md:text-2xl text-white/50 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: "150ms" }}>
        Share the moment with friends.
        <br className="hidden sm:block" />
        <span className="text-white/70">Watch together in perfect sync.</span>
      </p>

      {/* Decorative line */}
      <div className="mt-10 flex justify-center animate-in fade-in duration-1000 fill-mode-both" style={{ animationDelay: "300ms" }}>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-[oklch(0.75_0.15_195_/_50%)] to-transparent" />
      </div>
    </section>
  );
}
