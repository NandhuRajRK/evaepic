interface ModeBannerProps {
  mode: "demo" | "live";
}

export default function ModeBanner({ mode }: ModeBannerProps) {
  const isDemo = mode === "demo";

  return (
    <div className="w-full max-w-4xl rounded-3xl border border-white/40 bg-white/70 px-5 py-4 shadow-lg backdrop-blur-xl">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8B7355]">
            {isDemo ? "Demo Mode" : "Live Mode"}
          </p>
          <p className="mt-1 text-sm text-[#5C4A3A]">
            {isDemo
              ? "The app runs without Clerk or paid AI keys. Extraction and negotiation use realistic local fallbacks."
              : "External services are configured and the app is running in connected mode."}
          </p>
        </div>
        <div className="text-xs text-[#6B5B4F]">
          Best for portfolio use: keep demo mode working even when third-party keys expire.
        </div>
      </div>
    </div>
  );
}
