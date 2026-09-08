# [Cash] Sesi 1 — Audit Fondasi & `GET /cash-periods/:id`

## Tujuan

Sesi ini bertujuan untuk:
1. Memastikan fondasi modul Cash sudah solid sebelum endpoint baru ditambahkan — termasuk menambah helper `getCurrentBalance()` yang akan dipakai oleh sesi-sesi berikutnya.
2. Membangun endpoint `GET /cash-periods/:id` sebagai endpoint read pertama di modul Cash, yang mengembalikan detail satu periode beserta summary status pembayaran siswa.

Setelah sesi ini selesai, ADMIN dan BENDAHARA sudah bisa melihat detail satu periode kas beserta ringkasan berapa siswa yang sudah dan belum bayar — dan fondasi kalkulasi saldo sudah siap dipakai di sesi berikutnya.

---

## Konteks

### Yang sudah ada

| File | Isi yang relevan |
|---|---|
| `backend/src/db/schema.js` | Tabel `cashPeriods`, `cashPayments`, `cashTransactions` sudah lengkap dengan semua kolom, FK, index `idx_deleted_at`, dan constraint `UNIQUE(student_id, period_id)` |
| `backend/src/services/cashService.js` | Helper `formatLocalDate()`, `formatAmount()`, `getTodayYMD()` sudah ada. Service `createCashPeriod`, `listCashPeriods`, `createCashPayment` sudah ada. |
| `backend/src/controllers/cashController.js` | Controller untuk `POST /cash-periods`, `GET /cash-periods`, `POST /cash-payments` sudah ada. |
| `backend/src/routes/cashRoutes.js` | Route untuk 3 endpoint di atas sudah terdaftar dan terhubung ke `server.js`. |
| `backend/src/server.js` | `cashRoutes` sudah di-mount, tidak perlu disentuh. |
| `backend/src/middlewares/authenticate.js` | Sudah ada, dipakai via middleware chain. |
| `backend/src/middlewares/authorize.js` | Sudah ada, dipakai via middleware chain. |

### Yang harus dimodifikasi

| File | Perubahan |
|---|---|
| `backend/src/services/cashService.js` | **Tambah** fungsi `getCurrentBalance()` dan `getCashPeriodById()` |
| `backend/src/controllers/cashController.js` | **Tambah** fungsi `getCashPeriodByIdController` |
| `backend/src/routes/cashRoutes.js` | **Tambah** 1 route baru: `GET /cash-periods/:id` |

### Yang tidak perlu disentuh

- `backend/src/db/schema.js` — skema sudah sesuai, tidak ada migrasi baru
- `backend/src/server.js` — `cashRoutes` sudah ter-mount
- `backend/src/middlewares/` — semua middleware sudah cukup
- Semua file di luar `backend/` — frontend bukan scope sesi ini

---

## Struktur File

Tidak ada file baru yang dibuat. Semua perubahan adalah **tambahan** ke file yang sudah ada.

```
backend/src/
├── services/
│   └── cashService.js          ← MODIFIKASI: tambah getCurrentBalance(), getCashPeriodById()
├── controllers/
│   └── cashController.js       ← MODIFIKASI: tambah getCashPeriodByIdController
└── routes/
    └── cashRoutes.js           ← MODIFIKASI: tambah GET /cash-periods/:id
```

---

## Step-by-Step Implementasi

### Planning #1 — Audit Fondasi & Tambah `getCurrentBalance()`

**Step 1 — Verifikasi skema (READ ONLY, tidak ada perubahan)**

Konfirmasi bahwa di `backend/src/db/schema.js`:
- `cashTransactions` punya kolom `deletedAt` (soft-delete) dan `type` ENUM `['INCOME', 'EXPENSE']`
- `cashPayments` punya constraint `UNIQUE(student_id, period_id)` dan tidak punya `updatedAt` (immutable by design)
- `cashPeriods` punya constraint `UNIQUE(start_date, end_date)`
- Index `idx_deleted_at` pada `cashTransactions` sudah ada

Konfirmasi bahwa di `backend/src/services/cashService.js`:
- `formatLocalDate(value)` — sudah ada
- `formatAmount(value)` — sudah ada
- `getTodayYMD()` — sudah ada

**Step 2 — Tambah `getCurrentBalance()` di `cashService.js`**

Tambahkan fungsi ini di bagian helper (setelah `getTodayYMD`, sebelum `createCashPeriod`):

```js
export async function getCurrentBalance() {
  const rows = await db
    .select({
      type: cashTransactions.type,
      total: sql`SUM(${cashTransactions.amount})`,
    })
    .from(cashTransactions)
    .where(isNull(cashTransactions.deletedAt))
    .groupBy(cashTransactions.type);

  let income = 0;
  let expense = 0;
  for (const row of rows) {
    if (row.type === 'INCOME') income = Number(row.total) || 0;
    if (row.type === 'EXPENSE') expense = Number(row.total) || 0;
  }
  return income - expense;
}
```

Catatan implementasi:
- Import `sql` dari `drizzle-orm` jika belum ada di baris import
- Import `isNull` dari `drizzle-orm` jika belum ada
- Filter `WHERE deleted_at IS NULL` wajib — total kas tidak pernah include soft-deleted rows
- Return tipe `number` (bukan string), karena akan dipakai untuk operasi aritmatika di sesi berikutnya

---

### Planning #2 — `GET /cash-periods/:id`

**Step 3 — Tambah `getCashPeriodById()` di `cashService.js`**

Tambahkan setelah `listCashPeriods`:

```js
export async function getCashPeriodById(periodId) {
  const periodRows = await db
    .select({
      id: cashPeriods.id,
      startDate: cashPeriods.startDate,
      endDate: cashPeriods.endDate,
      amount: cashPeriods.amount,
      dueDate: cashPeriods.dueDate,
    })
    .from(cashPeriods)
    .where(eq(cashPeriods.id, periodId))
    .limit(1);

  if (periodRows.length === 0) return null;

  const period = periodRows[0];

  const studentRows = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.status, 'ACTIVE'));

  const totalSiswaAktif = studentRows.length;

  const paymentRows = await db
    .select({ id: cashPayments.id })
    .from(cashPayments)
    .where(eq(cashPayments.periodId, periodId));

  const sudahBayar = paymentRows.length;
  const belumBayar = totalSiswaAktif - sudahBayar;

  const totalRows = await db
    .select({ total: sql`SUM(${cashPayments.amountPaid})` })
    .from(cashPayments)
    .where(eq(cashPayments.periodId, periodId));

  const totalTerkumpul = Number(totalRows[0]?.total) || 0;

  return {
    id: period.id,
    startDate: formatLocalDate(period.startDate),
    endDate: formatLocalDate(period.endDate),
    amount: formatAmount(period.amount),
    dueDate: formatLocalDate(period.dueDate),
    summary: {
      totalSiswaAktif,
      sudahBayar,
      belumBayar,
      totalTerkumpul: formatAmount(totalTerkumpul),
    },
  };
}
```

Catatan implementasi:
- Import `students` dari `../db/schema.js` jika belum ada di baris import file ini
- `belumBayar` dihitung dari selisih, bukan dari query — karena "belum bayar" bukan status yang disimpan (sesuai prinsip)
- `totalTerkumpul` pakai `SUM(amount_paid)` dari `cash_payments`, bukan dari `cash_transactions` — lebih direct dan tidak terpengaruh soft-delete

**Step 4 — Tambah `getCashPeriodByIdController` di `cashController.js`**

Tambahkan di bagian bawah file, setelah `createCashPaymentController`:

```js
export async function getCashPeriodByIdController(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'id harus berupa integer positif',
        },
      });
    }

    const period = await getCashPeriodById(id);

    if (!period) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Periode kas tidak ditemukan',
        },
      });
    }

    return res.json({ success: true, data: period });
  } catch (error) {
    console.error('Error in getCashPeriodByIdController:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan server',
      },
    });
  }
}
```

Catatan implementasi:
- Import `getCashPeriodById` dari `cashService.js` di baris import atas file controller
- Pattern error handling harus konsisten dengan controller yang sudah ada di file yang sama

**Step 5 — Tambah route di `cashRoutes.js`**

Tambahkan setelah route `GET /cash-periods`:

```js
router.get(
  '/cash-periods/:id',
  authenticate,
  authorize(['ADMIN', 'BENDAHARA']),
  getCashPeriodByIdController
);
```

Catatan implementasi:
- Import `getCashPeriodByIdController` dari `cashController.js` di baris import atas file route
- Role yang diizinkan: `ADMIN` dan `BENDAHARA` — sama dengan `GET /cash-periods`
- Route ini harus didaftarkan **setelah** `GET /cash-periods` agar tidak terjadi ambiguitas path (Express mencocokkan dari atas ke bawah)

---

## Kontrak Response

### `GET /cash-periods/:id`

**Success `200`:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "startDate": "2026-09-01",
    "endDate": "2026-09-07",
    "amount": "20000.00",
    "dueDate": "2026-09-07",
    "summary": {
      "totalSiswaAktif": 30,
      "sudahBayar": 18,
      "belumBayar": 12,
      "totalTerkumpul": "360000.00"
    }
  }
}
```

**Not found `404`:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Periode kas tidak ditemukan"
  }
}
```

**Bad id `400`:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "id harus berupa integer positif"
  }
}
```

---

## Batasan — Jangan Dilakukan

- **Jangan buat file baru.** Semua perubahan masuk ke file yang sudah ada (`cashService.js`, `cashController.js`, `cashRoutes.js`).
- **Jangan sentuh `schema.js`.** Tidak ada migrasi baru di sesi ini.
- **Jangan sentuh `server.js`.** `cashRoutes` sudah ter-mount.
- **Jangan implementasi endpoint lain** di luar `GET /cash-periods/:id`. Endpoint seperti `GET /cash-periods/:id/payments`, `PATCH /cash-periods/:id`, `POST /cash-transactions`, dll. adalah scope sesi berikutnya.
- **Jangan tambah dependency baru** (`package.json` tidak boleh diubah). Semua yang dibutuhkan sudah tersedia: `drizzle-orm`, `mysql2`, `express`.
- **Jangan ubah endpoint yang sudah ada** (`POST /cash-periods`, `GET /cash-periods`, `POST /cash-payments`) — termasuk response shape, validasi, dan role authorization-nya.
- **Jangan tambah komentar** di luar yang benar-benar diperlukan untuk menandai sesuatu yang non-obvious. Kode harus berbicara sendiri.
- **Jangan tulis frontend** — sesi ini murni backend.
- **Jangan tulis test file** — `backend/src/__tests__/` dibiarkan kosong untuk sesi ini.
- **`getCurrentBalance()` jangan langsung dipakai di sesi ini** — fungsi ini hanya ditambahkan sebagai fondasi, penggunaannya baru di Sesi 3 (`POST /cash-transactions` dengan guard saldo negatif).
