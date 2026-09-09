# [Cash] Sesi 3 — Transaksi Manual, Ledger, & Riwayat Siswa

## Tujuan

Sesi ini bertujuan untuk menyelesaikan modul Cash dengan fitur-read/write lengkap di luar pembuatan periode dan pembayaran otomatis. Setelah sesi ini, modul Cash akan memiliki:

1. **Fungsi Ledger (`cash_transactions`)** — Bisa membuat transaksi manual (INCOME/EXPENSE) dan melihat ledger lengkap dengan saldo terhitung ulang.
2. **Fungsi Batalkan/Soft-delete** — Admin bisa menghapus transaksi manual (soft-delete) tanpa menghapus data pembayaran otomatis.
3. **Riwayat Kas per Siswa** — SISWA bisa melihat riwayat pembayarannya sendiri (analog dengan `GET /attendance/me`).

Setelah sesi ini selesai, modul Cash dianggap **fungsional sepenuhnya** di backend: bisa membuat periode, merekam pembayaran, melakukan transaksi manual, dan melihat riwayat.

---

## Konteks

### Yang sudah ada

| File | Isi yang relevan |
|---|---|
| `backend/src/db/schema.js` | Tabel `cashPeriods`, `cashPayments`, `cashTransactions` sudah lengkap dengan kolom, FK, constraint, dan index `idx_deleted_at`. |
| `backend/src/services/cashService.js` | Sudah ada helper `formatLocalDate()`, `formatAmount()`, `getTodayYMD()`, `getCurrentBalance()`, dan `listPaymentsForPeriod()`. |
| `backend/src/controllers/cashController.js` | Sudah ada `createCashPeriodController`, `listCashPeriodsController`, `createCashPaymentController`, `getCashPeriodByIdController`, `listPaymentsForPeriodController`, `updateCashPeriodController`. |
| `backend/src/routes/cashRoutes.js` | Sudah ada route: `POST /cash-periods`, `GET /cash-periods`, `GET /cash-periods/:id`, `GET /cash-periods/:id/payments`, `PATCH /cash-periods/:id`. |

### Yang harus dimodifikasi

| File | Perubahan |
|---|---|
| `backend/src/services/cashService.js` | **Tambah** `createCashTransaction()`, `listCashTransactions()`, `softDeleteCashTransaction()` |
| `backend/src/controllers/cashController.js` | **Tambah** `createCashTransactionController`, `listCashTransactionsController`, `softDeleteCashTransactionController` |
| `backend/src/routes/cashRoutes.js` | **Tambah** 3 route baru: `POST /cash-transactions`, `GET /cash-transactions`, `DELETE /cash-transactions/:id` |

### Yang tidak perlu disentuh

- `backend/src/db/schema.js` — skema sudah sesuai.
- `backend/src/server.js` — `cashRoutes` sudah ter-mount.
- Semua file frontend — scope ini sepenuhnya backend.

---

## Struktur File

Tidak ada file baru yang dibuat. Semua perubahan ditambahkan ke file yang sudah ada:

```text
backend/src/
├── services/
│   └── cashService.js          ← MODIFIKASI: tambah createCashTransaction(), listCashTransactions(), softDeleteCashTransaction()
├── controllers/
│   └── cashController.js       ← MODIFIKASI: tambah createCashTransactionController, listCashTransactionsController, softDeleteCashTransactionController
└── routes/
    └── cashRoutes.js           ← MODIFIKASI: tambah POST /cash-transactions, GET /cash-transactions, DELETE /cash-transactions/:id
```

---

## Step-by-Step Implementasi

### Planning #1 — `POST /cash-transactions` — Transaksi Manual INCOME/EXPENSE

**Step 1 — Tambah `createCashTransaction()` di `cashService.js`**

Fungsi ini harus:
- Ambil data dari body: `type` (INCOME/EXPENSE), `amount`, `description`, `createdBy`.
- **Jika `type = EXPENSE`**: hitung saldo saat ini pakai `getCurrentBalance()` — tolak 422 jika `saldo - amount < 0` (saldo tidak boleh negatif).
- **Jika `type = INCOME`**: tidak ada guard saldo (bisa selalu dimasukkan).
- `referencePaymentId` harus `null` (wajib — ini penanda transaksi manual, tidak boleh dikirim dari client).
- `createdBy` diambil dari `req.user.id` (tidak boleh dari body).
- Simpan ke database dan kembalikan data transaksi yang dibuat.

```js
export async function createCashTransaction({ type, amount, description }, createdBy) {
  // Validasi type harus INCOME atau EXPENSE
  if (type !== 'INCOME' && type !== 'EXPENSE') {
    const err = new Error('type wajib INCOME atau EXPENSE');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // Validasi amount harus positif
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    const err = new Error('amount wajib berupa angka positif');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // Jika EXPENSE, guard saldo negatif
  if (type === 'EXPENSE') {
    const currentBalance = await getCurrentBalance();
    if (currentBalance - numericAmount < 0) {
      const err = new Error('Saldo kas tidak mencukupi untuk mengevaluasi EXPENSE ini');
      err.status = 422;
      err.code = 'INSUFFICIENT_BALANCE';
      throw err;
    }
  }

  const [result] = await db
    .insert(cashTransactions)
    .values({
      type,
      amount: numericAmount,
      description,
      createdBy,
      referencePaymentId: null, // transaksi manual selalu null
    });

  return {
    id: result.insertId,
    type,
    amount: formatAmount(numericAmount),
    description,
    createdBy,
    createdAt: new Date(),
  };
}
```

**Step 2 — Tambah `createCashTransactionController` di `cashController.js`**

- Import `createCashTransaction` dari service.
- Validasi payload `req.body`: pastikan `type`, `amount`, `description` ada.
- `type` harus `'INCOME'` atau `'EXPENSE'` — jika tidak, 400.
- `amount` harus angka positif — jika tidak, 400.
- `createdBy` diambil dari `req.user.id`, jangan dipercaya dari body.
- Panggil `createCashTransaction` dan kembalikan respons `201`.

**Step 3 — Registrasi Route `POST /cash-transactions` di `cashRoutes.js`**

- Otorisasi: `['ADMIN', 'BENDAHARA']` (keduanya boleh membuat transaksi manual).
- Route ini harus ditempatkan **setelah** route `PATCH /cash-periods/:id` agar urutan tidak bentrok.

---

### Planning #2 — `GET /cash-transactions` — Ledger + Saldo Saat Ini

**Step 4 — Tambah `listCashTransactions()` di `cashService.js`**

Fungsi ini harus:
- Filter opsional: `?type=INCOME` atau `?type=EXPENSE`, `?startDate`, `?endDate`.
- Selalu filter `WHERE deleted_at IS NULL` — transaksi soft-deleted tidak muncul di list.
- Hitung `currentBalance` di akhir response: `SUM(CASE WHEN type='INCOME' THEN amount ELSE -amount END) WHERE deleted_at IS NULL`.
- Urutkan `DESC by created_at`.
- Return data yang sudah diformat (tanggal, nominal).

```js
export async function listCashTransactions({ type, startDate, endDate } = {}) {
  const conditions = [];
  if (type) conditions.push(eq(cashTransactions.type, type));
  if (startDate) conditions.push(gte(cashTransactions.createdAt, startDate));
  if (endDate) conditions.push(lte(cashTransactions.createdAt, endDate));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: cashTransactions.id,
      type: cashTransactions.type,
      amount: cashTransactions.amount,
      description: cashTransactions.description,
      createdBy: cashTransactions.createdBy,
      createdAt: cashTransactions.createdAt,
    })
    .from(cashTransactions)
    .where(whereClause)
    .orderBy(desc(cashTransactions.createdAt));

  // Hitung saldo akhir
  const balanceRows = await db
    .select({
      total: sql`SUM(CASE WHEN ${cashTransactions.type} = 'INCOME' THEN ${cashTransactions.amount} ELSE -${cashTransactions.amount} END)`,
    })
    .from(cashTransactions)
    .where(isNull(cashTransactions.deletedAt));

  const currentBalance = Number(balanceRows[0]?.total) || 0;

  return {
    data: rows.map((row) => ({
      id: row.id,
      type: row.type,
      amount: formatAmount(row.amount),
      description: row.description,
      createdBy: row.createdBy,
      createdAt: formatLocalDate(row.createdAt),
    })),
    currentBalance: formatAmount(currentBalance),
  };
}
```

**Step 5 — Tambah `listCashTransactionsController` di `cashController.js`**

- Import `listCashTransactions` dari service.
- Extract query params: `type`, `startDate`, `endDate`.
- Validasi format tanggal jika dikirim (YYYY-MM-DD).
- Panggil `listCashTransactions` dan kembalikan respons dengan format `{ success: true, data: ..., currentBalance: ... }`.

**Step 6 — Registrasi Route `GET /cash-transactions` di `cashRoutes.js`**

- Otorisasi: `['ADMIN', 'BENDAHARA']`.
- Route ini ditempatkan setelah `POST /cash-transactions`.

---

### Planning #3 — `DELETE /cash-transactions/:id` — Soft-delete Transaksi Manual

**Step 7 — Tambah `softDeleteCashTransaction()` di `cashService.js`**

Fungsi ini harus:
- Cek transaksi ada, jika tidak return `null`.
- **Jangan izinkan soft-delete jika `referencePaymentId IS NOT NULL`** — transaksi yang tergenerasi dari pembayaran tidak bisa dihapus lewat sini (harus lewat batalkan pembayaran).
- Lakukan `UPDATE cashTransactions SET deleted_at = NOW() WHERE id = ...`.
- Kembalikan data yang sudah soft-deleted (atau `null` jika sukses).

```js
export async function softDeleteCashTransaction(transactionId) {
  // Cek transaksi ada
  const existing = await db
    .select({ id: cashTransactions.id, referencePaymentId: cashTransactions.referencePaymentId })
    .from(cashTransactions)
    .where(eq(cashTransactions.id, transactionId))
    .limit(1);

  if (!existing) return null;

  // Jangan izinkan delete jika ini transaksi yang terhubung ke payment
  if (existing.referencePaymentId !== null) {
    const err = new Error('Tidak bisa menghapus transaksi yang terhubung ke pembayaran otomatis');
    err.status = 409;
    err.code = 'CONFLICT';
    throw err;
  }

  await db
    .update(cashTransactions)
    .set({ deletedAt: new Date() })
    .where(eq(cashTransactions.id, transactionId));

  return { success: true, id: transactionId };
}
```

**Step 8 — Tambah `softDeleteCashTransactionController` di `cashController.js`**

- Import `softDeleteCashTransaction` dari service.
- Extract `transactionId` dari `req.params.id`.
- Validasi ID integer positif.
- Panggil `softDeleteCashTransaction` dan tangani `404` (not found) dan `409` (conflict/tidak boleh dihapus).

**Step 9 — Registrasi Route `DELETE /cash-transactions/:id` di `cashRoutes.js`**

- Otorisasi: `['ADMIN']` (hanya Admin yang boleh soft-delete transaksi manual).
- Route ini ditempatkan setelah `GET /cash-transactions`.

---

### Planning #4 — `GET /students/:id/cash-payments` + `GET /cash/me` — Riwayat Kas per Siswa

**Step 10 — Tambah `getStudentCashPayments()` di `cashService.js`**

Fungsi ini mirip dengan `listPaymentsForPeriod` tapi per-siswa:
- Ambil `studentId` dari parameter.
- Query `cashPayments` WHERE `studentId = ...`.
- Return riwayat pembayaran per periode dengan detail periode (startDate, endDate, amount).

**Step 11 — Tambah `getStudentCashPaymentsController` di `cashController.js`**

- Pakai middleware `enforceOwnStudentOrElevatedRole` agar SISWA hanya bisa akses data milik sendiri.
- Validasi dan return data riwayat.

**Step 12 — Registrasi Route `GET /students/:id/cash-payments` di `cashRoutes.js`**

- Route ini baru, perlu pastikan middleware `enforceOwnStudentOrElevatedRole` sudah terintegrasi dengan baik dari modul auth/attendance.

**Step 13 — Tambah `getCashMeController` di `cashController.js`**

- Resolve `students` record dari `req.user.id`.
- Panggil service yang sama dengan endpoint siswa tapi pake `user_id` bukan `student_id` eksplisit.
- Return data riwayat kas milik user yang login.

**Step 14 — Registrasi Route `GET /cash/me` di `cashRoutes.js`**

- Otorisasi: Any authenticated user (graceful seperti `GET /auth/me`).
- Route ini sebenarnya bisa share logika dengan `GET /students/:id/cash-payments` tapi resolve dari session.

---

## Kontrak Response

### `POST /cash-transactions`

**Success `201` (INCOME):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "type": "INCOME",
    "amount": "50000.00",
    "description": "Saldo awal",
    "createdBy": 1,
    "createdAt": "2026-09-09T00:00:00.000Z"
  }
}
```

**Success `201` (EXPENSE):**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "type": "EXPENSE",
    "amount": "15000.00",
    "description": "Pengeluaran operasional",
    "createdBy": 1,
    "createdAt": "2026-09-09T00:00:00.000Z"
  }
}
```

**Validation Error `400` (type salah):**
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "type wajib INCOME atau EXPENSE" } }
```

**Insufficient Balance `422`:**
```json
{ "success": false, "error": { "code": "INSUFFICIENT_BALANCE", "message": "Saldo kas tidak mencukupi..." } }
```

### `GET /cash-transactions`

**Success `200`:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "type": "INCOME", "amount": "50000.00", "description": "Saldo awal", "createdAt": "2026-09-01" },
    { "id": 2, "type": "EXPENSE", "amount": "15000.00", "description": "Makan siang", "createdAt": "2026-09-02" }
  ],
  "currentBalance": "35000.00"
}
```

### `DELETE /cash-transactions/:id`

**Success `200`:**
```json
{ "success": true, "data": { "id": 1, "success": true } }
```

**Not found `404`:**
```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Transaksi tidak ditemukan" } }
```

**Cannot delete `409` (referencePaymentId ada):**
```json
{ "success": false, "error": { "code": "CONFLICT", "message": "Tidak bisa menghapus transaksi yang terhubung ke pembayaran otomatis" } }
```

---

## Batasan — Jangan Dilakukan (WAJIB DIPATUHI OLEH AI)

- **Jangan buat file baru.** Semua perubahan masuk ke file yang sudah ada (`cashService.js`, `cashController.js`, `cashRoutes.js`).
- **Jangan sentuh `schema.js`.** Tidak ada migrasi baru di sesi ini.
- **Jangan sentuh `server.js`.** `cashRoutes` sudah ter-mount.
- **Jangan implementasi fitur lain** di luar scope Sesi 3 (misal: import data lama, ekspor PDF, dll.).
- **Jangan ubah endpoint yang sudah ada** (`POST /cash-periods`, `GET /cash-periods`, `GET /cash-periods/:id`, dll.).
- **Jangan lupa guard saldo** di `POST /cash-transactions` saat `type = EXPENSE` — ini esensial sesuai prinsip "Total kas TIDAK PERNAH disimpan sebagai kolom".
- **Jangan izinkan soft-delete** (`DELETE /cash-transactions/:id`) jika `referencePaymentId IS NOT NULL` — transaksi manual bisa diedit/hapus, tapi auto-generated dari payment tidak.
- **Jangan lupa `referencePaymentId: null`** saat insert transaksi manual — ini penanda distinguisher antara transaksi manual vs auto-generated.
- **Jangan lupa filter `WHERE deleted_at IS NULL`** di `GET /cash-transactions` — transaksi yang sudah soft-delete harus hilang dari list.
- **Jangan tulis frontend** — sesi ini murni backend.
- **Jangan tulis test file** — `backend/src/__tests__/` dibiarkan kosong untuk sesi ini.
- **Jangan gunakan nama kolom `saldo` di schema** — saldo harus selalu dihitung ulang (`SUM(INCOME) - SUM(EXPENSE) WHERE deleted_at IS NULL`), tidak boleh ada kolom `balance` di tabel transaksi.