export function CatalogueFooter() {
  return (
    <footer className="mt-16 border-t border-[#A8C3A5]/20 bg-white/60 backdrop-blur">
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="text-[24px] font-semibold" style={{ fontFamily: "'Fraunces',serif" }}>Attirenest</div>
            <p className="text-sm text-[#6b6762] mt-1">Salem, Tamil Nadu • Small-batch organic kidswear</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <a href="https://instagram.com/attirenest.kids" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full bg-[#2E2A27] text-white font-medium hover:opacity-90 transition">
              Instagram @attirenest.kids
            </a>
          </div>
        </div>
        <div className="text-center text-[12px] text-[#9a938c] mt-8">
          © 2026 Attirenest. GOTS-certified organic cotton.
        </div>
      </div>
    </footer>
  );
}
