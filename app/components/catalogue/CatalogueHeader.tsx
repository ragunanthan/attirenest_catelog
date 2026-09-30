type Props = {
  onOpenCart: () => void;
};

export function CatalogueHeader({ onOpenCart }: Props) {
  void onOpenCart; // used by parent nav — kept for API consistency
  return (
    <header className="relative">
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-32 w-[420px] h-[420px] rounded-full blur-[90px] opacity-40" style={{ background: 'var(--blush)' }} />
        <div className="absolute top-20 -left-40 w-[360px] h-[360px] rounded-full blur-[80px] opacity-30" style={{ background: 'var(--sage)' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full blur-[70px] opacity-25" style={{ background: 'var(--lav)' }} />
      </div>

      <div className="max-w-6xl mx-auto px-5 pt-12 pb-8 md:pt-20 md:pb-12">
        <div className="flex justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpg"
            alt="AttireNest by Kani logo"
            width={140}
            height={140}
            style={{ borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 30px rgba(90,122,86,.2)' }}
          />
        </div>

        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-xl border border-[#A8C3A5]/30 shadow-sm text-[11px] md:text-xs tracking-wider font-medium uppercase">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--sage)' }} aria-hidden="true" />
            2026 Trends: Organic · Gender-Neutral · Pastel · Comfort-First
          </div>
        </div>

        <h1 className="text-center text-[56px] md:text-[88px] leading-[0.9] tracking-tight font-semibold">
          <span style={{ background: 'linear-gradient(92deg,#5A7A56 0%, #A8C3A5 35%, #F7C8D0 75%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            Attirenest
          </span>
        </h1>
        <p className="text-center mt-3 text-lg md:text-xl text-[#5a6d57] font-medium tracking-wide">Cute. Comfy. Cool.
        </p>

        <div className="max-w-2xl mx-auto mt-6 text-center">
          <div className="flex flex-col gap-3 mb-6">
            {/* <p className="text-xs md:text-sm uppercase tracking-[0.2em] font-semibold text-[#8a4b57]">
              Cute comfy cool
            </p> */}
            <h3 className="text-lg md:text-xl font-semibold text-[#3d5a39]">
              Attirenest - where little hearts bloom
            </h3>
            <p className="text-[15px] md:text-[17px] leading-relaxed text-[#4a4642]">
              soft muslin & cotton outfits, ages 0–10. Designed by mom, made with sustainable, kid-friendly fabrics.
            </p>
          </div>
          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            <a
              href="https://maps.app.goo.gl/rKDfJe6iQLeg5L966"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E6D9F0]/60 hover:bg-[#E6D9F0] text-xs font-medium text-[#5d4a7a] transition-all hover:scale-105 shadow-xs cursor-pointer group"
              title="View AttireNest store on Google Maps"
            >
              <span>📍 Store Location: Bangalore</span>
              <span className="text-[10px] opacity-70 group-hover:translate-x-0.5 transition-transform">↗</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
