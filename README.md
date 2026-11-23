# Aksara CBT — Sistem Asesmen Digital SMP & SMA

**Aksara CBT** adalah sistem ujian berbasis komputer (*Computer-Based Test*) modern yang dirancang khusus untuk kebutuhan evaluasi pembelajaran di jenjang **SMP (Kelas 7–9)** dan **SMA (Kelas 10–12)**. Sistem ini mendukung pelaksanaan Penilaian Harian (PH), Sumatif Tengah Semester (STS/PTS), Sumatif Akhir Semester (SAS/PAS), Tryout, hingga Simulasi ANBK berbasis standar AKM dalam satu ruang kerja yang tenang, terukur, dan berintegritas.

---

## Latar Belakang & Tujuan Sistem

Pelaksanaan asesmen digital di sekolah sering dihadapkan pada dua tantangan utama: tampilan lembar ujian yang melelahkan mata saat dibaca dalam durasi panjang, serta keterbatasan pengawasan dan analisis hasil secara cepat. **Aksara CBT** hadir untuk menjawab keduanya melalui:

- **Kenyamanan Membaca Jangka Panjang:** Menggunakan antarmuka bergaya editorial berkonsep *Warm Paper & Deep Petrol* dengan kontras tinggi (WCAG AA), minim distraksi visual, serta tata letak adaptif untuk soal berwacana panjang.
- **Standar Asesmen Modern:** Mendukung lima ragam bentuk soal sesuai Kurikulum Merdeka dan format ANBK/AKM, termasuk pilihan 4 opsi untuk SMP maupun 5 opsi untuk SMA.
- **Transparansi & Integritas Ujian:** Menggabungkan pengacakan soal/opsi independen, token sesi 6 karakter, sinkronisasi waktu berbasis server, serta pencatatan aktivitas pengawasan secara *real-time*.

---

## Peran Pengguna & Hak Akses

Sistem membagi akses secara terpisah untuk tiga kelompok pengguna utama:

### 1. Admin / Operator Sekolah
Bertanggung jawab atas pengelolaan data pokok sekolah dan akses pengguna:
- **Ringkasan Operasional:** Memantau statistik peserta aktif, jumlah rombongan belajar SMP/SMA, koleksi bank soal, dan sesi ujian yang sedang berlangsung.
- **Manajemen Kelas SMP & SMA:** Mengelola rombel per jenjang (SMP tingkat 7–9, SMA tingkat 10–12) dan tahun ajaran.
- **Manajemen Mata Pelajaran:** Mengatur daftar mata pelajaran beserta kode dan peruntukan jenjangnya.
- **Manajemen Pengguna & Peserta:** Mendaftarkan akun siswa (berbasis NISN), guru/pengawas (berbasis NIP), dan operator; mengatur status aktif akun; serta melakukan pengaturan ulang kata sandi.

### 2. Guru / Pembuat Soal & Pengawas
Bertanggung jawab atas penyusunan instrumen asesmen, pelaksanaan sesi, hingga pelaporan nilai:
- **Bank Soal Digital:** Menyusun butir soal lengkap dengan tingkat kesukaran (*Mudah*, *Sedang*, *Sukar*), bobot poin, indikator kompetensi, wacana bacaan (*stimulus*), lampiran gambar, serta fitur impor soal massal melalui format CSV.
- **Penjadwalan Ujian & Token Sesi:** Menentukan kategori ujian, mata pelajaran, target multi-kelas, durasi pengerjaan, jendela waktu buka–tutup, aturan pengacakan, izin tampil nilai, batas pelanggaran, dan pembangkitan **Token 6 Karakter**.
- **Mode Proyektor Token:** Menampilkan kode token 6 karakter dalam ukuran penuh ber kontras tinggi agar mudah dibaca siswa melalui layar LCD di ruang kelas, lengkap dengan tombol salin dan rotasi token.
- **Monitoring Live & Intervensi Pengawas:** Memantau status setiap peserta secara langsung (*Belum Masuk*, *Mengerjakan*, *Selesai*, atau *Terkunci*), progres jumlah soal terjawab, serta detail log pelanggaran. Pengawas dapat membuka kunci sesi peserta atau memaksa penyelesaian sesi bila diperlukan.
- **Koreksi Esai, Analisis Butir & Ekspor Nilai:** Melihat rekap nilai objektif yang terhitung otomatis, menilai jawaban uraian/esai secara manual disertai catatan umpan balik, mengevaluasi tingkat kesukaran empiris tiap butir soal, dan mengunduh rekap nilai dalam format CSV yang siap dibuka di Microsoft Excel maupun e-Rapor.

### 3. Siswa / Peserta Ujian
Memiliki ruang kerja khusus yang sederhana dan bebas gangguan selama asesmen berlangsung:
- **Portal Jadwal & Riwayat:** Melihat daftar ujian yang sedang dibuka untuk kelasnya, status pengerjaan, dan bukti pengumpulan beserta hasil nilai (apabila diizinkan guru).
- **Gerbang Konfirmasi & Input Token:** Memverifikasi identitas diri (Nama, NISN, Kelas), membaca ringkasan tata tertib sesi, dan memasukkan 6 karakter token dari pengawas melalui kotak input tersegmentasi.
- **Ruang Pengerjaan Soal Modern:**
  - **Mode Split-Pane Wacana:** Soal yang memiliki teks bacaan/stimulus otomatis terbagi menjadi dua panel independen di layar desktop (wacana di kiri, pertanyaan dan pilihan jawaban di kanan), dengan opsi beralih ke satu kolom.
  - **Fitur Coret Pengecoh (*Answer Eliminator*):** Memungkinkan peserta mencoret pilihan jawaban yang diyakini salah langsung pada kartu opsi sebagai alat bantu analisis tanpa mengubah jawaban yang dipilih.
  - **Kontrol Keterbacaan & Pintasan Cepat:** Pengatur ukuran huruf (`A-`, `A`, `A+`), mode layar penuh, serta pintasan papan ketik (`Alt+←`, `Alt+→` untuk berpindah soal, `Alt+F` untuk menandai ragu-ragu).
  - **Peta Soal *Dual-Indicator*:** Menampilkan kotak nomor soal dengan filter (*Semua*, *Kosong*, *Ragu*) yang membedakan secara jelas soal sudah dijawab, kosong, ragu-ragu kosong, serta sudah dijawab namun masih ditandai ragu.
  - **Auto-Save & Timer Server:** Setiap jawaban tersimpan otomatis ke server dengan indikator status penyimpanan; waktu hitung mundur mengikuti otoritas server dan berubah warna secara bertahap menjelang habis (netral, peringatan di bawah 10 menit, kritis di bawah 5 menit) sebelum dikumpulkan otomatis pada `00:00`.

---

## Ragam Tipe Soal yang Didukung

| Tipe Soal | Mekanisme Penilaian | Kegunaan Utama |
| :--- | :--- | :--- |
| **Pilihan Ganda (PG)** | Otomatis instan | Evaluasi standar 4 opsi (A–D untuk SMP) atau 5 opsi (A–E untuk SMA). |
| **Pilihan Ganda Kompleks (PGK)** | Otomatis instan (mendukung skor parsial proporsional) | Asesmen AKM/ANBK dengan lebih dari satu pernyataan benar. |
| **Benar / Salah** | Otomatis instan | Pengujian pemahaman konsep dan kaidah kebahasaan secara cepat. |
| **Isian Singkat** | Otomatis instan (normalisasi kapitalisasi & spasi, mendukung sinonim) | Soal hitungan numerasi, istilah baku, atau jawaban faktual ringkas. |
| **Uraian / Esai** | Koreksi manual guru dengan catatan umpan balik | Evaluasi penalaran mendalam, argumentasi tertulis, dan pemecahan masalah bertahap. |

---

## Alur Pelaksanaan Ujian

1. **Persiapan:** Admin memastikan data kelas, mata pelajaran, dan akun peserta terdaftar. Guru menyusun butir soal di Bank Soal lalu menerbitkan jadwal ujian untuk kelas tujuan.
2. **Pembukaan Sesi:** Pengawas membagikan atau memproyeksikan **Token 6 Karakter** kepada peserta di ruangan.
3. **Pelaksanaan:** Siswa memverifikasi identitas, memasukkan token, dan mengerjakan soal. Sistem mengacak urutan soal/opsi secara independen per siswa, menyimpan jawaban otomatis, dan mencatat setiap perpindahan layar.
4. **Pengumpulan & Penilaian:** Saat siswa menekan tombol kumpulkan atau waktu server habis, sistem mengunci sesi dan menghitung nilai soal objektif secara seketika.
5. **Tindak Lanjut:** Guru memeriksa jawaban esai (jika ada), meninjau indeks kesukaran tiap butir soal untuk perbaikan mutu evaluasi berikutnya, dan mengekspor rekap nilai ke CSV.

---

## Integritas & Keamanan Asesmen

- **Isolasi Kunci Jawaban:** Kunci jawaban dan daftar kata kunci tidak pernah dikirimkan ke perangkat peserta selama ujian berlangsung.
- **Otoritas Waktu di Server:** Batas waktu pengerjaan dihitung dan divalidasi sepenuhnya oleh server sehingga tidak terpengaruh oleh perubahan jam pada perangkat peserta.
- **Pengawasan Anti-Kecurangan Transparan:** Perpindahan tab atau meminimalkan jendela dicatat ke log pengawas dan memunculkan peringatan kepada peserta. Jika pelanggaran mencapai batas maksimal yang ditetapkan guru, sesi terkunci otomatis sambil mengamankan jawaban terakhir. Klik kanan dan penyalinan teks soal dinonaktifkan dengan pemberitahuan yang sopan.
- **Kontrol Akses Berlapis:** Setiap tindakan pada sistem memverifikasi identitas sesi, peran pengguna, kesesuaian kelas peserta, serta kepemilikan data ujian secara ketat di sisi server.

---

## Prinsip Desain Antarmuka

- **Ramah Mata & Bebas Distraksi:** Permukaan latar kertas hangat, kartu putih dengan garis pembatas tipis, tanpa gradien dekoratif, efek kilau, maupun emoji yang mengganggu konsentrasi ujian.
- **Tipografi Fungsional:** Perpaduan huruf sans-serif modern untuk keterbacaan naskah soal Bahasa Indonesia dan huruf monospace sejajar (*tabular numerals*) untuk timer, token, NISN/NIP, nomor soal, dan tabel skor.
- **Responsif Lintas Perangkat:** Nyaman digunakan di komputer laboratorium, laptop, maupun layar ponsel mulai lebar 375px tanpa pergeseran horizontal.
