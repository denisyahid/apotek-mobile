/**
 * Util gambar sisi klien: kompresi sebelum disimpan sebagai data URL.
 * Prototype menyimpan base64 di LocalStorage — produksi mengunggah file
 * mentah ke Supabase Storage (ganti di LocalPaymentProofRepository).
 */
export interface ProcessedImage {
  dataUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export async function compressImageFile(
  file: File,
  maxDimension = 900,
  quality = 0.72
): Promise<ProcessedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar (JPG/PNG).");
  }
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Gagal memproses gambar.");
  ctx.drawImage(img, 0, 0, width, height);

  const compressed = canvas.toDataURL("image/jpeg", quality);
  // perkiraan ukuran dalam byte dari panjang string base64
  const size = Math.round((compressed.length - compressed.indexOf(",") - 1) * 0.75);

  return {
    dataUrl: compressed,
    fileName: file.name,
    mimeType: "image/jpeg",
    size,
  };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("File gambar tidak valid."));
    img.src = src;
  });
}
