import sharp from "sharp";

export const IMAGE_UPLOAD = {
  /** Max original file size accepted before processing */
  maxInputBytes: 25 * 1024 * 1024,
  /** Longest edge after resize — enough for zoom/lightbox on mobile */
  maxDimension: 1600,
  /** WebP quality (0–100). ~82 keeps detail while shrinking file size a lot */
  quality: 82,
} as const;

export async function compressImageBuffer(input: Buffer): Promise<Buffer> {
  const image = sharp(input, { failOn: "none" }).rotate();
  const meta = await image.metadata();

  if (!meta.width || !meta.height) {
    throw new Error("INVALID_IMAGE");
  }

  return image
    .resize(IMAGE_UPLOAD.maxDimension, IMAGE_UPLOAD.maxDimension, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: IMAGE_UPLOAD.quality,
      effort: 4,
      smartSubsample: true,
    })
    .toBuffer();
}
