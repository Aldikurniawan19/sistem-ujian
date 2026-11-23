import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const academicYear = "2026/2027";

  // 1. Classrooms (SMP & SMA)
  const kelasIXA = await prisma.classroom.upsert({
    where: { name_academicYear: { name: "IX-A", academicYear } },
    update: {},
    create: {
      name: "IX-A",
      level: "SMP",
      grade: 9,
      academicYear,
    },
  });

  const kelasXIPA1 = await prisma.classroom.upsert({
    where: { name_academicYear: { name: "XI-IPA-1", academicYear } },
    update: {},
    create: {
      name: "XI-IPA-1",
      level: "SMA",
      grade: 11,
      academicYear,
    },
  });

  const kelasXIPS1 = await prisma.classroom.upsert({
    where: { name_academicYear: { name: "X-IPS-1", academicYear } },
    update: {},
    create: {
      name: "X-IPS-1",
      level: "SMA",
      grade: 10,
      academicYear,
    },
  });

  // 2. Users (Admin, Teachers, Students)
  const adminPass = hashPassword("admin123");
  const guruPass = hashPassword("guru123");
  const siswaPass = hashPassword("siswa123");

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      name: "Raka Pratama (Operator)",
      role: "ADMIN",
      passwordHash: adminPass,
    },
  });

  const guruMath = await prisma.user.upsert({
    where: { username: "198705142015031002" },
    update: {},
    create: {
      username: "198705142015031002",
      name: "Budi Santoso, M.Pd.",
      role: "TEACHER",
      passwordHash: guruPass,
    },
  });

  const guruIndo = await prisma.user.upsert({
    where: { username: "199008212018022004" },
    update: {},
    create: {
      username: "199008212018022004",
      name: "Siti Rahmawati, S.Pd.",
      role: "TEACHER",
      passwordHash: guruPass,
    },
  });

  const students = [
    { username: "0091234501", name: "Nadia Kusuma", classroomId: kelasIXA.id },
    { username: "0091234502", name: "Dimas Mahendra", classroomId: kelasIXA.id },
    { username: "0091234503", name: "Alya Putri Azzahra", classroomId: kelasIXA.id },
    { username: "0078912301", name: "Fajar Nugroho", classroomId: kelasXIPA1.id },
    { username: "0078912302", name: "Citra Dewi Lestari", classroomId: kelasXIPA1.id },
    { username: "0078912303", name: "Bagas Arya Wijaya", classroomId: kelasXIPS1.id },
  ];

  for (const s of students) {
    await prisma.user.upsert({
      where: { username: s.username },
      update: { classroomId: s.classroomId },
      create: {
        username: s.username,
        name: s.name,
        role: "STUDENT",
        passwordHash: siswaPass,
        classroomId: s.classroomId,
      },
    });
  }

  // 3. Subjects
  const subjMat = await prisma.subject.upsert({
    where: { code: "MAT-SMA" },
    update: {},
    create: { code: "MAT-SMA", name: "Matematika Lanjut", level: "SMA" },
  });

  const subjBin = await prisma.subject.upsert({
    where: { code: "BIN-SMP" },
    update: {},
    create: { code: "BIN-SMP", name: "Bahasa Indonesia & Literasi", level: "SMP" },
  });

  await prisma.subject.upsert({
    where: { code: "IPA-SMP" },
    update: {},
    create: { code: "IPA-SMP", name: "Ilmu Pengetahuan Alam", level: "SMP" },
  });

  await prisma.subject.upsert({
    where: { code: "FIS-SMA" },
    update: {},
    create: { code: "FIS-SMA", name: "Fisika", level: "SMA" },
  });

  // 4. Questions (only seed if empty to keep idempotency)
  const existingQuestions = await prisma.question.count();
  if (existingQuestions === 0) {
    // SMP Bahasa Indonesia & Literasi (4 options + PGK + True/False + Short Answer + Essay)
    const qBin1 = await prisma.question.create({
      data: {
        subjectId: subjBin.id,
        authorId: guruIndo.id,
        type: "SINGLE_CHOICE",
        difficulty: "MEDIUM",
        competencyTag: "Literasi Informasi — Gagasan Utama",
        stimulus:
          "Perpustakaan sekolah kini tidak lagi sekadar ruang penyimpanan buku cetak. Di berbagai SMP di Indonesia, perpustakaan bertransformasi menjadi ruang belajar kolaboratif yang memadukan koleksi cetak, katalog digital, dan pojok diskusi.\n\nMenurut data survei literasi internal tahun 2025, siswa yang rutin berkunjung minimal dua kali sepekan menunjukkan peningkatan kemampuan memahami teks argumentatif sebesar 28% dibandingkan siswa yang jarang berkunjung. Kuncinya bukan hanya ketersediaan buku, melainkan pendampingan diskusi bacaan oleh guru dan pustakawan.",
        prompt: "Berdasarkan wacana di atas, apa faktor utama yang paling menentukan peningkatan pemahaman teks argumentatif siswa?",
        optionsJson: JSON.stringify([
          { id: "a", label: "A", text: "Penambahan jumlah buku cetak setiap awal semester", isCorrect: false },
          { id: "b", label: "B", text: "Pendampingan diskusi bacaan oleh guru dan pustakawan", isCorrect: true },
          { id: "c", label: "C", text: "Penggantian seluruh buku cetak menjadi katalog digital", isCorrect: false },
          { id: "d", label: "D", text: "Kewajiban meminjam minimal lima buku setiap bulan", isCorrect: false },
        ]),
        points: 20,
      },
    });

    const qBin2 = await prisma.question.create({
      data: {
        subjectId: subjBin.id,
        authorId: guruIndo.id,
        type: "MULTIPLE_CHOICE",
        difficulty: "MEDIUM",
        competencyTag: "AKM Literasi — Pernyataan Sesuai Teks",
        stimulus:
          "Gerakan 'Sekolah Bebas Plastik Sekali Pakai' di SMP Nusantara mewajibkan warga sekolah membawa botol minum isi ulang dan wadah makan sendiri. Dalam tiga bulan pertama, volume sampah plastik kantin turun 64%. Dana penghematan pengelolaan sampah kemudian dialokasikan untuk membeli tempat sampah pilah organik-anorganik di setiap lorong kelas.",
        prompt: "Pilih DUA pernyataan yang sesuai dengan informasi pada wacana tersebut.",
        optionsJson: JSON.stringify([
          { id: "a", label: "A", text: "Volume sampah plastik kantin berkurang lebih dari setengah dalam tiga bulan", isCorrect: true },
          { id: "b", label: "B", text: "Kantin sekolah ditutup sementara selama program berlangsung", isCorrect: false },
          { id: "c", label: "C", text: "Penghematan dana dimanfaatkan untuk pengadaan tempat sampah pilah", isCorrect: true },
          { id: "d", label: "D", text: "Program hanya berlaku bagi siswa kelas IX", isCorrect: false },
        ]),
        points: 20,
      },
    });

    const qBin3 = await prisma.question.create({
      data: {
        subjectId: subjBin.id,
        authorId: guruIndo.id,
        type: "TRUE_FALSE",
        difficulty: "EASY",
        competencyTag: "Kaidah Kebahasaan — Kalimat Efektif",
        prompt: "Kalimat 'Para siswa-siswi sekalian dimohon untuk segera masuk ke ruang ujian' merupakan contoh kalimat efektif sesuai kaidah PUEBI/EYD V.",
        optionsJson: JSON.stringify([
          { id: "true", label: "B", text: "Benar", isCorrect: false },
          { id: "false", label: "S", text: "Salah", isCorrect: true },
        ]),
        points: 20,
      },
    });

    const qBin4 = await prisma.question.create({
      data: {
        subjectId: subjBin.id,
        authorId: guruIndo.id,
        type: "SHORT_ANSWER",
        difficulty: "EASY",
        competencyTag: "Struktur Teks Tanggapan",
        prompt: "Bagian teks eksposisi yang berisi pengenalan isu atau pandangan awal penulis disebut ...",
        acceptedAnswersJson: JSON.stringify(["tesis", "pernyataan pendapat", "pernyataan pendapat (tesis)"]),
        points: 20,
      },
    });

    const qBin5 = await prisma.question.create({
      data: {
        subjectId: subjBin.id,
        authorId: guruIndo.id,
        type: "ESSAY",
        difficulty: "HARD",
        competencyTag: "Menulis Teks Argumentatif",
        stimulus:
          "Penggunaan gawai di lingkungan sekolah sering menimbulkan pro dan kontra. Sebagian pihak menilai gawai membantu akses referensi belajar cepat, sementara pihak lain khawatir gawai mengganggu fokus saat pelajaran berlangsung.",
        prompt: "Tuliskan satu paragraf argumentasi (minimal 3 kalimat) yang memuat sikap Anda beserta alasan logis dan satu solusi konkret terkait penggunaan gawai di sekolah.",
        points: 20,
      },
    });

    // SMA Matematika Lanjut (5 options A-E + PGK + Short Answer + Essay)
    const qMat1 = await prisma.question.create({
      data: {
        subjectId: subjMat.id,
        authorId: guruMath.id,
        type: "SINGLE_CHOICE",
        difficulty: "MEDIUM",
        competencyTag: "Kalkulus — Turunan Fungsi Aljabar",
        prompt: "Diketahui fungsi f(x) = 3x³ - 4x² + 5x - 7. Nilai dari turunan pertama f'(2) adalah ...",
        optionsJson: JSON.stringify([
          { id: "a", label: "A", text: "19", isCorrect: false },
          { id: "b", label: "B", text: "25", isCorrect: true },
          { id: "c", label: "C", text: "29", isCorrect: false },
          { id: "d", label: "D", text: "33", isCorrect: false },
          { id: "e", label: "E", text: "41", isCorrect: false },
        ]),
        points: 20,
      },
    });

    const qMat2 = await prisma.question.create({
      data: {
        subjectId: subjMat.id,
        authorId: guruMath.id,
        type: "SINGLE_CHOICE",
        difficulty: "MEDIUM",
        competencyTag: "Matriks — Determinan",
        stimulus:
          "Suatu transformasi linear pada bidang koordinat direpresentasikan oleh matriks A berordo 2×2 dengan entri baris pertama [4, 2] dan baris kedua [3, 5]. Luas bayangan bangun datar setelah transformasi adalah |det(A)| kali luas semula.",
        prompt: "Jika sebuah segitiga memiliki luas awal 12 cm², berapakah luas bayangan segitiga tersebut setelah dikenai transformasi matriks A?",
        optionsJson: JSON.stringify([
          { id: "a", label: "A", text: "84 cm²", isCorrect: false },
          { id: "b", label: "B", text: "120 cm²", isCorrect: false },
          { id: "c", label: "C", text: "168 cm²", isCorrect: true },
          { id: "d", label: "D", text: "240 cm²", isCorrect: false },
          { id: "e", label: "E", text: "312 cm²", isCorrect: false },
        ]),
        points: 20,
      },
    });

    const qMat3 = await prisma.question.create({
      data: {
        subjectId: subjMat.id,
        authorId: guruMath.id,
        type: "MULTIPLE_CHOICE",
        difficulty: "HARD",
        competencyTag: "Polinomial — Teorema Faktor",
        prompt: "Diketahui suku banyak P(x) = x³ - 6x² + 11x - 6. Pilih SEMUA faktor linear dari P(x).",
        optionsJson: JSON.stringify([
          { id: "a", label: "A", text: "(x - 1)", isCorrect: true },
          { id: "b", label: "B", text: "(x + 2)", isCorrect: false },
          { id: "c", label: "C", text: "(x - 2)", isCorrect: true },
          { id: "d", label: "D", text: "(x - 3)", isCorrect: true },
          { id: "e", label: "E", text: "(x + 3)", isCorrect: false },
        ]),
        points: 25,
      },
    });

    const qMat4 = await prisma.question.create({
      data: {
        subjectId: subjMat.id,
        authorId: guruMath.id,
        type: "SHORT_ANSWER",
        difficulty: "EASY",
        competencyTag: "Limit Fungsi Aljabar",
        prompt: "Hitung nilai dari lim (x → 3) untuk fungsi (x² - 9) / (x - 3). Tuliskan hanya angkanya.",
        acceptedAnswersJson: JSON.stringify(["6"]),
        points: 15,
      },
    });

    const qMat5 = await prisma.question.create({
      data: {
        subjectId: subjMat.id,
        authorId: guruMath.id,
        type: "ESSAY",
        difficulty: "HARD",
        competencyTag: "Aplikasi Turunan — Nilai Optimum",
        stimulus:
          "Seorang pengrajin akan membuat kotak terbuka (tanpa tutup) dari selembar karton persegi berukuran 24 cm × 24 cm dengan memotong persegi identik berukuran x cm di keempat sudutnya lalu melipat sisi-sisinya ke atas.",
        prompt: "Tentukan model fungsi volume V(x) dan nilai x agar volume kotak tersebut maksimum. Sertakan langkah perhitungan Anda secara sistematis.",
        points: 20,
      },
    });

    // 5. Published Exams (active window: -1 day to +30 days so demo works immediately)
    const now = new Date();
    const startAt = new Date(now.getTime() - 1000 * 60 * 60 * 24);
    const endAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);

    await prisma.exam.create({
      data: {
        title: "Simulasi ANBK Literasi — Kelas IX",
        description:
          "Asesmen diagnostik literasi membaca, kaidah kebahasaan, dan argumentasi berbasis standar AKM SMP.",
        category: "ANBK",
        subjectId: subjBin.id,
        creatorId: guruIndo.id,
        durationMinutes: 45,
        startAt,
        endAt,
        token: "AKSARA",
        shuffleQuestions: false,
        shuffleOptions: true,
        showResultToStudent: true,
        maxViolations: 3,
        status: "PUBLISHED",
        classrooms: {
          create: [{ classroomId: kelasIXA.id }],
        },
        questions: {
          create: [
            { questionId: qBin1.id, orderIndex: 0 },
            { questionId: qBin2.id, orderIndex: 1 },
            { questionId: qBin3.id, orderIndex: 2 },
            { questionId: qBin4.id, orderIndex: 3 },
            { questionId: qBin5.id, orderIndex: 4 },
          ],
        },
      },
    });

    await prisma.exam.create({
      data: {
        title: "Sumatif Tengah Semester — Matematika Lanjut XI",
        description:
          "Evaluasi kompetensi turunan fungsi aljabar, determinan matriks transformasi, polinomial, dan limit.",
        category: "PTS",
        subjectId: subjMat.id,
        creatorId: guruMath.id,
        durationMinutes: 60,
        startAt,
        endAt,
        token: "MATEMA",
        shuffleQuestions: true,
        shuffleOptions: true,
        showResultToStudent: true,
        maxViolations: 3,
        status: "PUBLISHED",
        classrooms: {
          create: [{ classroomId: kelasXIPA1.id }],
        },
        questions: {
          create: [
            { questionId: qMat1.id, orderIndex: 0 },
            { questionId: qMat2.id, orderIndex: 1 },
            { questionId: qMat3.id, orderIndex: 2 },
            { questionId: qMat4.id, orderIndex: 3 },
            { questionId: qMat5.id, orderIndex: 4 },
          ],
        },
      },
    });
  }

  console.info("Seed Aksara CBT selesai.");
}

main()
  .catch((err) => {
    console.error("Gagal menjalankan seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
