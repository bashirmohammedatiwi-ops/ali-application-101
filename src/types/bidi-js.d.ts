declare module "bidi-js" {
  type EmbeddingLevels = {
    levels: Uint8Array;
  };

  type Bidi = {
    getEmbeddingLevels: (string: string, baseDirection?: "ltr" | "rtl" | "auto") => EmbeddingLevels;
    getReorderedString: (string: string, embedLevelsResult: EmbeddingLevels) => string;
  };

  export default function bidiFactory(): Bidi;
}
