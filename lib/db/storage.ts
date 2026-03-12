import { createClient } from "@/lib/supabase/client";

type Bucket = "project-assets" | "hackathon-assets" | "user-avatars";

function sb() {
  return createClient();
}

/** Upload a file to Supabase Storage. Returns the public URL. */
export async function uploadFile(
  bucket: Bucket,
  path: string,
  file: File | Blob,
  contentType?: string,
): Promise<string> {
  const { error } = await sb().storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = sb().storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload a project asset (logo or screenshot) */
export async function uploadProjectAsset(
  teamId: string,
  projectId: string,
  file: File | Blob,
  filename: string,
): Promise<string> {
  const ext = filename.split(".").pop() ?? "png";
  const path = `${teamId}/${projectId}/${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}.${ext}`;
  return uploadFile("project-assets", path, file);
}

/** Upload project logo */
export async function uploadLogo(
  teamId: string,
  projectId: string,
  file: File | Blob,
): Promise<string> {
  const path = `${teamId}/${projectId}/logo`;
  return uploadFile("project-assets", path, file);
}

/** Upload project screenshot */
export async function uploadScreenshot(
  teamId: string,
  projectId: string,
  file: File | Blob,
  index: number,
): Promise<string> {
  const path = `${teamId}/${projectId}/screenshots/${index}`;
  return uploadFile("project-assets", path, file);
}

/** Upload user avatar */
export async function uploadAvatar(userId: string, file: File | Blob): Promise<string> {
  const path = `${userId}/avatar`;
  return uploadFile("user-avatars", path, file);
}

/** Get public URL for a storage path */
export function getPublicUrl(bucket: Bucket, path: string): string {
  const { data } = sb().storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Delete a file from storage */
export async function deleteFile(bucket: Bucket, path: string): Promise<void> {
  await sb().storage.from(bucket).remove([path]);
}
