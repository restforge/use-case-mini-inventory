# Mini Inventory — Use Case RESTForge

## Ikhtisar (Overview)

Use-case aplikasi inventory sederhana yang dibangun dengan RESTForge. Mencakup tiga bagian:
**database** (schema dan seed), **backend** (generate endpoint dan dashboard, lalu serve API),
serta **frontend** (generate halaman aplikasi dari payload).

Pola data yang dipakai adalah Master-Detail untuk master data (category, warehouse, supplier,
customer, item-product) dan transaksi stock (inbound dan outbound).

## Struktur Project (Project Structure)

```
04-mini-inventory/
├── backend/        # Payload endpoint/dashboard + script generate & serve
├── frontend/       # Payload halaman + script generate UI
└── database/       # Schema dan seed (postgres, mysql, oracle)
```

## Prasyarat (Prerequisites)

- Node.js (untuk `npx restforge`)
- PostgreSQL client (`psql`) untuk script database
- License RESTForge yang valid pada `backend/config/db-connection.env`
- `restforge-designer` tersedia di PATH (untuk generate frontend)

## Konfigurasi (Configuration)

Sebelum menjalankan backend, isi `LICENSE` pada file `backend/config/db-connection.env`.
Pada repository ini nilainya sengaja ditulis sebagai placeholder (`XXXX-XXXX-XXXX-XXXX`)
dan harus diganti dengan license asli secara lokal. License asli tidak boleh di-commit.

Default koneksi: PostgreSQL `127.0.0.1:5432`, database `dbinv`, server backend port `3032`,
base URL API `http://localhost:3032/api/mini-inventory`.

## Perintah yang Tersedia (Available Commands)

Urutan eksekusi: **database → backend → frontend**.

### Database

Dijalankan dari folder `database/schemas/<platform>/` dan `database/seeds/<platform>/`
(contoh untuk PostgreSQL):

| Perintah | Fungsi |
|----------|--------|
| `database\schemas\postgres\schema-init.bat` | Membuat database `dbinv` dan seluruh tabel schema |
| `database\seeds\postgres\seed-init.bat` | Memuat seed data (master + transaksi stock) |

Tersedia juga varian `mysql` dan `oracle` pada folder yang sama.

### Backend

Dijalankan dari folder `backend/`:

| Perintah | Fungsi |
|----------|--------|
| `server-create.bat` | Generate 7 endpoint: category, warehouse, supplier, customer, item-product, stock-inbound, stock-outbound |
| `dashboard-create.bat` | Generate 2 dashboard: dash-inbound, dash-outbound |
| `server-start.bat` | Menjalankan API server dengan mode `--watch` pada port 3032 |

Perintah inti yang dibungkus oleh script di atas:

```bash
npx restforge endpoint create --project=mini-inventory --name=<nama> --payload=<file>.json --config=db-connection.env
npx restforge dashboard create --project=mini-inventory --name=<nama> --payload=<file>.json
npx restforge serve --project=mini-inventory --config=db-connection.env --watch
```

### Frontend

Dijalankan dari folder `frontend/`:

| Perintah | Fungsi |
|----------|--------|
| `create-all.bat` | Generate seluruh halaman sekaligus dari `payload/all-pages.json` (scope `app`) |
| `generate.bat` | Menu interaktif: init project, generate per halaman, atau validate payload |

Menu pada `generate.bat` mencakup pilihan: Init Project, master data (category, warehouse,
supplier, customer, item-product), transaksi (stock-inbound, stock-outbound), dashboard,
generate semua, dan validate semua payload.

Menjalankan hasil generate frontend (memakai `app-start.bat` bawaan hasil generate,
serve pada port 8000):

```bash
cd mini-inventory
app-start.bat
```

## Catatan (Notes)

- Folder `backend/node_modules`, `backend/src`, dan hasil generate `frontend/mini-inventory`
  tidak di-commit (lihat `.gitignore`).
- Detail schema database dan strategi seed tersedia pada `database/README.md`.
