PRD ini menggantikan struktur app yang ada. Karena scope-nya besar (3 sistem + skema baru), saya pecah jadi 4 fase agar tiap fase bisa diuji sebelum lanjut. Semua halaman dibuat responsif (mobile-first untuk pelanggan & owner; tablet landscape untuk kasir tetap, tapi tetap bisa dibuka di device lain).

## Fase 1 — Skema Data (fondasi)

Migrasi DB untuk menyamakan struktur dengan Bagian B PRD. **Catatan:** data lama akan dimigrasikan/di-drop di tabel yang berubah berat (orders, products) — bisnis belum live, jadi seharusnya aman.

Tabel baru / diubah:
- `filter_chips` — id, nama, urutan; seed 11 chip awal (Semua, Rekomendasi, Daya Tahan Tubuh, Pencernaan Nyaman, Pegal & Capek, Tenang & Tidur, dst sesuai PRD I.2.1).
- `ingredients` — library bahan, 5 kategori (rimpang segar, rempah kering, daun & bunga, asam & sitrus, pemanis).
- `products` — tambah/normalisasi: `status_menu` (aktif|nonaktif), `status_stok` (tersedia|habis_hari_ini), `filter_chip_unggulan_id`, `deskripsi_kontekstual` (jsonb map chip→teks). Tabel pivot `product_filter_chips` & `product_ingredients`.
- `orders` — tambah `tipe_order` (dine_in|take_away), `nomor_tampilan` (jsonb `{tipe, nilai}`), `nama_pemesan`, `whatsapp`, `metode_bayar`, `status` enum baru (`menunggu_bayar|diterima|diracik|siap_diambil|selesai`), `idempotency_key` unique.
- `order_status_history` — `order_id`, `status`, `timestamp` (permanen, untuk laporan owner).
- `order_items` — pastikan `harga_snapshot` & `nama_produk_snapshot` ada.
- `shift_notes` — `kategori` (pengeluaran|selisih_kas_kurang|selisih_kas_lebih|catatan_kas|lainnya), `nominal` nullable, `keterangan`, `timestamp`.
- `app_config` — single-row: `threshold_urgensi_menit`, `toko_status` (buka|tutup), `nomor_antrian_counter`.
- Drop tabel lama yang tidak terpakai (`tables`, `loyalty_points` jika diperlukan — saya konfirmasi sebelum drop).
- RLS + GRANT untuk semua tabel baru sesuai aturan (anon read untuk products/filter_chips/ingredients/app_config; authenticated read/write untuk orders sesuai kebutuhan; staff-only untuk shift_notes & app_config write via role check).

## Fase 2 — Halaman Pelanggan (Bagian I)

- Beranda `/menu`: 11 chip horizontal sticky (auto-hide chip dengan 0 produk), grid produk, badge stok habis, dukung scan QR `/menu?meja=5` atau `/menu?takeaway=1`.
- Detail produk: bottom sheet (sudah ada — sesuaikan dengan field baru: deskripsi kontekstual per chip, komposisi collapsible, tingkat manis default terpilih).
- Keranjang `/cart`: cart bar mengambang kondisional, item dimmed jika stok habis.
- Checkout `/checkout`: nama (opsional, take-away), WhatsApp (wajib + validasi), catatan, metode bayar (tunai/QRIS). Idempotency key di submit.
- Halaman status `/order/$id`: URL permanen, polling status, banner "Tunjukkan ke Kasir" untuk tunai menunggu bayar, treatment Turmeric Gold.
- Cross-page: badge pesanan aktif (pill bottom-fixed), panel "Tentang Majamu" (brand story, kontak, riwayat).
- Riwayat pesanan: localStorage per-device, maks 30 entri, caption transparansi.
- State kosong & error semua halaman sesuai I.9.

## Fase 3 — Dashboard Kasir & Peracik (Bagian II)

- `/cashier`: tablet landscape, kolom status (Menunggu Bayar / Diterima / Diracik / Siap Diambil), kartu order dengan timer urgensi (warna berubah sesuai `threshold_urgensi_menit`).
- Aksi konfirmasi pembayaran tunai → status berubah ke "Diterima" (baru saat ini racik dimulai).
- Tombol "Buka Toko" (reset nomor antrian counter, set toko_status=buka).
- Toggle "Tandai Stok Habis" per produk.
- Form Catatan Shift (5 kategori, nominal opsional untuk 2 kategori).
- Single shared login per device (sudah ada via role `cashier`).

## Fase 4 — Dashboard Owner (Bagian III)

Mobile-first, bottom tab nav: Beranda, Laporan, Kas, Menu & Filter, + ikon Pengaturan.
- **Beranda**: omzet hari ini, delta vs kemarin & rata-rata 7 hari (dengan disclaimer "data pembanding belum cukup" jika histori <7 hari), jumlah order, AOV, top 3 produk, status toko, order aktif.
- **Laporan**: selector periode (Hari Ini/Minggu/Bulan/Custom), grafik omzet (recharts), performa produk Terlaris/Kurang Laku, drill-down per produk. Hitung dari `harga_snapshot` & `status_history`.
- **Kas**: rekap shift_notes per kategori, indikator frekuensi, list kronologis.
- **Menu & Filter**: edit filter chip (rename, reorder naik/turun, bulk mapping), CRUD produk (foto, harga, deskripsi utama, mapping chip + unggulan, deskripsi kontekstual per chip, status_menu aktif/nonaktif).
- **Pengaturan**: edit `threshold_urgensi_menit`.

## Detail Teknis

- Server functions baru di `src/lib/`: `orders.functions.ts`, `cashier.functions.ts`, `owner-reports.functions.ts`, `shift-notes.functions.ts`, `config.functions.ts`, `menu-admin.functions.ts`.
- Polling status di halaman pelanggan: `setInterval` 5s + cleanup.
- localStorage helper untuk riwayat pesanan: `src/lib/order-history.ts`.
- Idempotency: client generate UUID per submit, server `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`.
- Sesuai jawaban Anda, semua halaman harus responsif: kasir & owner pakai layout adaptif (bukan strict device gate).

## Apa yang Saya Mulai Sekarang

Saya akan mulai dari **Fase 1 (migrasi skema)** karena semua kode berikutnya bergantung padanya. Setelah migrasi disetujui & dijalankan, saya lanjut Fase 2.

## Risiko & Asumsi

- **Data lama**: produk & order existing akan disesuaikan (mungkin di-truncate untuk orders karena enum status berubah). Konfirmasi sebelum saya hapus.
- **Midtrans/QRIS**: PRD menyebut Midtrans untuk struk WA & pembayaran non-tunai. Saat ini integrasi belum ada — saya akan stub dulu (tombol QRIS = simulasi sukses), integrasi Midtrans asli jadi item terpisah.
- **Bahan/komposisi**: PRD bilang field bahan final di sesi terpisah. Saya buat tabel `ingredients` minimal (id, nama, kategori) dan UI manage di owner Fase 4; isi datanya nanti.
- **Brand story / Tentang Majamu**: copy belum ada — saya isi placeholder dan minta Anda revisi.

Boleh saya mulai Fase 1 (migrasi)?
