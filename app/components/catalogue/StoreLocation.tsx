export function StoreLocation() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-8 md:py-12" id="store-location">
      <div className="rounded-[32px] p-6 md:p-10 relative overflow-hidden bg-gradient-to-br from-white via-[#FCF9F6] to-[#F5ECE8] border border-[#A8C3A5]/30 shadow-[0_12px_40px_-20px_rgba(90,122,86,0.16)]">
        {/* Soft decorative background glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[80px] bg-[#F7C8D0]/30 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-[80px] bg-[#A8C3A5]/25 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#A8C3A5]/40 text-xs font-semibold text-[#3d5a39] mb-4 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#5A7A56] animate-pulse" />
              Visit Our Experience Store
            </div>

            <h2 className="text-[28px] md:text-[38px] font-semibold tracking-tight text-[#2E2A27] leading-tight">
              Experience Attirenest in Bangalore
            </h2>

            <p className="text-[15px] md:text-[16px] text-[#554e48] mt-3 leading-relaxed">
              Step into our store to discover our super-soft muslin and breathable cotton outfits in person. Feel the fabric, check the fits, and pick the perfect pieces for your little ones.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-[#4a4642]">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-[#E6D9F0]/80 flex items-center justify-center text-base shrink-0">📍</span>
                <div>
                  <div className="font-semibold text-[#2E2A27]">AttireNest</div>
                  <div className="text-xs text-[#6b6762]">Bengaluru, Karnataka</div>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-[#A8C3A5]/30" />

              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-[#F7C8D0]/40 flex items-center justify-center text-base shrink-0">✨</span>
                <div>
                  <div className="font-semibold text-[#2E2A27]">Ages 0–10</div>
                  <div className="text-xs text-[#6b6762]">Muslin & Cotton Essentials</div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <a
              href="https://maps.app.goo.gl/rKDfJe6iQLeg5L966"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#5A7A56] hover:bg-[#486345] text-white font-medium text-sm transition-all hover:shadow-lg active:scale-[0.98] shadow-sm"
            >
              <span>🗺️ Open in Google Maps</span>
              <span className="text-xs font-bold">↗</span>
            </a>

            <a
              href="https://maps.app.goo.gl/rKDfJe6iQLeg5L966"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/80 hover:bg-white text-[#2E2A27] font-medium text-sm border border-[#A8C3A5]/40 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <span>Get Driving Directions</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
