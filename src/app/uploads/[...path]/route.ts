import { readFile, stat } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const MIME: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filename = segments.join("/");

  if (!filename || filename.includes("..")) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const filePath = path.resolve(UPLOAD_DIR, filename);
  if (!filePath.startsWith(path.resolve(UPLOAD_DIR))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    await stat(filePath);
    const data = await readFile(filePath);
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    return new NextResponse(data, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
