import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File too large. Max 5MB." },
      { status: 400 },
    );
  }

  const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Use PNG, JPG, WebP, or SVG." },
      { status: 400 },
    );
  }

  const ext = file.name.split(".").pop() || "png";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const blob = await put(path, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
