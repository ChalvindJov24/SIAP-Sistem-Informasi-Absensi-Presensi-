# SIAP Backend

Sistem Informasi Absensi & Presensi — Backend API.

## Tech Stack

- **Node.js** — Runtime environment
- **Express.js** — Web framework
- **Drizzle ORM** — Object Relational Mapping
- **MySQL** — Database

## Requirements

- Node.js (versi 18+ — disarankan versi terbaru yang mendukung flag `--watch`)
- MySQL Server

## Setup Lokal

### 1. Clone Repository

```bash
git clone https://github.com/ChalvindJov24/SIAP-Sistem-Informasi-Absensi-Presensi-.git
cd "SIAP (Sistem Informasi Absensi & Presensi)"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment Variables

Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Sesuaikan nilai di dalam `.env` dengan konfigurasi MySQL lokal Anda:

```env
# Server
PORT=3000

# Database MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=siap
```

> **Catatan:** Pastikan database `siap` sudah dibuat di MySQL Anda sebelum menjalankan migrasi.

### 4. Generate & Jalankan Migrasi Database

```bash
npm run db:generate
npm run db:migrate
```

### 5. Jalankan Server

Mode development (dengan auto-reload):

```bash
npm run dev
```

Mode production:

```bash
npm start
```

## Verifikasi

Setelah server berjalan, buka endpoint health check di browser atau gunakan `curl`:

```bash
curl http://localhost:3000/health
```

Response yang diharapkan:

```json
{
  "status": "ok",
  "message": "SIAP API is running",
  "timestamp": "2026-08-02T02:00:00.000Z"
}
```

## Scripts

| Script             | Deskripsi                                      |
| ------------------ | ---------------------------------------------- |
| `npm run dev`      | Menjalankan server dengan auto-reload (`--watch`) |
| `npm start`        | Menjalankan server dalam mode production       |
| `npm run db:generate` | Generate migrasi dari skema Drizzle          |
| `npm run db:migrate`  | Menjalankan migrasi database                 |
| `npm run db:push`     | Push skema langsung ke database (tanpa file migrasi) |
| `npm run db:studio`   | Membuka Drizzle Studio untuk mengelola database |

## Struktur Direktori

```
src/
├── config/
│   ├── database.js      # Konfigurasi koneksi MySQL + Drizzle
│   └── env.js           # Environment variables
├── controllers/
│   └── healthController.js  # Controller endpoint health check
├── routes/
│   └── healthRoutes.js      # Route endpoint health check
├── schemas/
│   └── index.js             # Skema Drizzle (contoh tabel users)
└── server.js                 # Entry point aplikasi Express
```

## License


