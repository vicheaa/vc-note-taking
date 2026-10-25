import { supabase } from "./supabase";
import { convertImageToWebP } from "./imageCompression";

export const NOTE_IMAGES_BUCKET = import.meta.env.VITE_SUPABASE_IMAGES_BUCKET || "note-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
export const IMAGE_ACCEPT = Object.keys(IMAGE_TYPES).join(",");

export function getNoteImagePaths(content: string | null) {
  if (!content || typeof DOMParser === "undefined") return [];
  return Array.from(new DOMParser().parseFromString(content, "text/html").querySelectorAll("img[data-storage-path]"))
    .map((image) => image.getAttribute("data-storage-path"))
    .filter((path): path is string => !!path);
}

export async function deleteNoteImages(paths: string[]) {
  const uniquePaths = [...new Set(paths)];
  if (!uniquePaths.length) return;
  const { error } = await supabase.storage.from(NOTE_IMAGES_BUCKET).remove(uniquePaths);
  if (error) throw error;
}

export function validateNoteImage(file: File) {
  if (!Object.prototype.hasOwnProperty.call(IMAGE_TYPES, file.type)) throw new Error("Choose a JPEG, PNG, WebP, or GIF photo.");
  if (!file.size) throw new Error("This photo is empty. Choose another file.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Each photo must be 5 MB or smaller.");
}

export async function uploadNoteImage(file: File) {
  validateNoteImage(file);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Please sign in again to upload photos.");
  const uploadFile = await convertImageToWebP(file);
  validateNoteImage(uploadFile);
  const extension = IMAGE_TYPES[uploadFile.type as keyof typeof IMAGE_TYPES];
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(NOTE_IMAGES_BUCKET).upload(path, uploadFile, {
    contentType: uploadFile.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error("Unable to upload this photo. Check your connection and that photo storage is configured.");
  return path;
}

export async function signNoteImage(path: string) {
  const { data, error } = await supabase.storage.from(NOTE_IMAGES_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
