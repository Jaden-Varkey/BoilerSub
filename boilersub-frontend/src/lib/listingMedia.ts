export function isRenderableImageSource(src: string): boolean {
  if (!src) {
    return false;
  }

  if (src.startsWith("data:image/")) {
    return true;
  }

  try {
    const url = new URL(src);
    return /\.(avif|gif|jpe?g|png|webp)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function filterRenderableImages(images: string[]): string[] {
  return images.filter(isRenderableImageSource);
}
