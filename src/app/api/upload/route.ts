import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { compressImageBuffer, IMAGE_UPLOAD } from "@/lib/image-process";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      errors.push(file.name);
      continue;
    }

    if (file.size > IMAGE_UPLOAD.maxInputBytes) {
      errors.push(file.name);
      continue;
    }

    try {
      const raw = Buffer.from(await file.arrayBuffer());
      const compressed = await compressImageBuffer(raw);
      const filename = `${uuidv4()}.webp`;
      await writeFile(path.join(uploadDir, filename), compressed);
      urls.push(`/uploads/${filename}`);
    } catch {
      errors.push(file.name);
    }
  }

  if (!urls.length) {
    return NextResponse.json(
      { error: errors.length ? "Invalid or oversized images" : "No files" },
      { status: 400 }
    );
  }

  return NextResponse.json({ urls, skipped: errors.length || undefined });
}
