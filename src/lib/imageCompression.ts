const WEBP_QUALITY = 0.85;

export async function convertImageToWebP(file: File): Promise<File> {
  // Preserve animations and avoid compressing an existing WebP a second time.
  if (file.type === "image/gif" || file.type === "image/webp") return file;

  const image = new Image();
  const canvas = document.createElement("canvas");
  const objectUrl = URL.createObjectURL(file);
  try {
    image.src = objectUrl;
    try {
      await image.decode();
    } catch {
      throw new Error("This photo could not be read. Choose another image.");
    }

    // Keep the original dimensions and transparency, including screenshot text.
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to prepare this photo. Please try again.");
    context.drawImage(image, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
    });
    // Unsupported encoders can silently return PNG instead of WebP.
    if (!blob || !blob.size) throw new Error("Unable to convert this photo to WebP. Please try again.");
    if (blob.type !== "image/webp") {
      throw new Error("Your browser cannot convert photos to WebP. Please try Chrome or Firefox.");
    }

    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${name}.webp`, { type: "image/webp", lastModified: file.lastModified });
  } finally {
    URL.revokeObjectURL(objectUrl);
    image.removeAttribute("src");
    canvas.width = 0;
    canvas.height = 0;
  }
}
