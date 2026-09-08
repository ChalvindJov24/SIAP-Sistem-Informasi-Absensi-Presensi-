import { Wallet } from 'lucide-react';

function KasComingSoonPage() {
  const features = [
    'Catat pembayaran kas mingguan',
    'Lihat status bayar siswa (sudah/belum)',
    'Pembukuan pemasukan & pengeluaran kelas',
    'Riwayat transaksi kas',
  ];

  return (
    <div className="max-w-2xl">
      <div className="w-12 h-12 rounded-full bg-block-sage flex items-center justify-center mb-6">
        <Wallet className="w-6 h-6 text-block-sage-ink" strokeWidth={1.5} />
      </div>

      <p className="font-mono text-xs uppercase tracking-wide text-ink/60 mb-2">
        Segera Hadir
      </p>
      <h1 className="font-display text-3xl font-semibold mb-4">
        Modul Kas Sedang Dibangun
      </h1>
      <p className="font-body text-base text-ink/70 mb-8 max-w-md">
        Fitur pembukuan dan pembayaran kas kelas sedang dalam pengembangan. Berikut yang akan hadir:
      </p>

      <div className="border border-hairline rounded-sm p-6">
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-ink flex-shrink-0" />
              <span className="font-body text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default KasComingSoonPage;