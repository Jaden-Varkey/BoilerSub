export const MAX_LISTING_IMAGES = 10;
export const MAX_LISTING_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_LISTING_IMAGES_TOTAL_BYTES = 12 * 1024 * 1024;

function isJpegFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return type === "image/jpeg" || name.endsWith(".jpg") || name.endsWith(".jpeg");
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read image"));
    };
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export async function readListingImages(files: FileList | File[]): Promise<string[]> {
  const nextFiles = Array.from(files);

  if (nextFiles.length === 0) {
    return [];
  }

  if (nextFiles.length > MAX_LISTING_IMAGES) {
    throw new Error(`Upload up to ${MAX_LISTING_IMAGES} JPEG images.`);
  }

  let totalBytes = 0;
  for (const file of nextFiles) {
    if (!isJpegFile(file)) {
      throw new Error("Only JPEG images are supported.");
    }
    if (file.size > MAX_LISTING_IMAGE_BYTES) {
      throw new Error("Each image must be 2MB or smaller.");
    }
    totalBytes += file.size;
  }

  if (totalBytes > MAX_LISTING_IMAGES_TOTAL_BYTES) {
    throw new Error("Total image upload size must stay under 12MB.");
  }

  return Promise.all(nextFiles.map((file) => fileToDataUrl(file)));
}
