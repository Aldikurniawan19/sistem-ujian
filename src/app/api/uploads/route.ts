import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireActionRole } from "@/lib/auth";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function matchesMagicBytes(buffer: Buffer, mime: string): boolean {
  if (buffer.length < 12) {
    return false;
  }
  if (mime === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (mime === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mime === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

export async function POST(request: Request): Promise<NextResponse> {
  const actor = await requireActionRole(["ADMIN", "TEACHER"]);
  if (!actor) {
    return NextResponse.json(
      { error: "Akses ditolak. Hanya guru atau admin yang dapat mengunggah gambar." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Berkas gambar tidak ditemukan." },
      { status: 400 }
    );
  }

  const ext = ALLOWED_MIME[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Format gambar harus PNG, JPG, atau WEBP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Ukuran gambar maksimal 2 MB." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!matchesMagicBytes(buffer, file.type)) {
    return NextResponse.json(
      { error: "Isi berkas tidak sesuai dengan format gambar yang valid." },
      { status: 400 }
    );
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const fileName = `${randomUUID()}.${ext}`;
  const fullPath = path.join(uploadsDir, fileName);
  await writeFile(fullPath, buffer);

  return NextResponse.json({ url: `/uploads/${fileName}` }, { status: 201 });
}
