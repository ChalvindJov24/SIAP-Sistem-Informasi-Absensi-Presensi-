export default function AuthSignaturePanel() {
  return (
    <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden bg-block-sage p-8 md:min-h-screen md:p-12">
      {/* Motif garis presensi halus */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
      >
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-block-sage-ink/10"
            style={{ top: `${(i + 1) * 7}%` }}
          />
        ))}
      </div>

      <div className="relative">
        <p className="font-mono text-[13px] font-medium uppercase tracking-[0.06em] text-block-sage-ink/70">
          SIAK
        </p>
      </div>

      <div className="relative max-w-md">
        <h1 className="text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-block-sage-ink">
          Presensi dan kas kelas, satu tempat yang rapi.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-block-sage-ink/80">
          Catat kehadiran, kelola iuran kas, dan pantau semuanya dari satu
          halaman — tanpa tumpukan kertas.
        </p>
      </div>

      <div className="relative">
        <p className="font-mono text-[13px] font-medium uppercase tracking-[0.06em] text-block-sage-ink/50">
          Sistem Informasi Administrasi Kelas
        </p>
      </div>
    </div>
  );
}