import { NextRequest, NextResponse } from "next/server";
import { ai, MODELS } from "../../lib/gemini-client";

export interface ThemeReaderOutput {
  primary_color: string;
  accent_color: string;
  secondary_color: string;
  theme_label: string;
  design_description: string;
}

const DEFAULTS: ThemeReaderOutput = {
  primary_color: "#1A1A2E",
  accent_color: "#6C3BF5",
  secondary_color: "#FFFFFF",
  theme_label: "dark-minimal",
  design_description: "Default dark theme with violet accents",
};

const MAX_SCREENSHOTS = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = await res.arrayBuffer();

    if (buffer.byteLength > MAX_IMAGE_SIZE) return null;

    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.some((t) => contentType.includes(t))) return null;

    const base64 = Buffer.from(buffer).toString("base64");
    return { data: base64, mimeType: contentType.split(";")[0] };
  } catch {
    return null;
  }
}

export async function analyzeTheme(
  screenshotUrls: string[],
  logoUrl?: string
): Promise<ThemeReaderOutput> {
  const allUrls = [...(logoUrl ? [logoUrl] : []), ...screenshotUrls.slice(0, MAX_SCREENSHOTS)];

  if (allUrls.length === 0) return DEFAULTS;

  const images = await Promise.all(allUrls.map(fetchImageAsBase64));
  const validImages = images.filter(Boolean) as { data: string; mimeType: string }[];

  if (validImages.length === 0) return DEFAULTS;

  const imageParts = validImages.map((img) => ({
    inlineData: { data: img.data, mimeType: img.mimeType },
  }));

  const prompt = `Analyze these project UI screenshots and/or logo. Extract the visual design theme.

Return a STRICT JSON object:
{
  "primary_color": "#hex - the most dominant UI color",
  "accent_color": "#hex - the accent/highlight color",
  "secondary_color": "#hex - the second most common UI color",
  "theme_label": "one of: dark-minimal, dark-colorful, light-clean, light-vibrant, glassmorphism, neomorphic, brutalist, gradient-heavy",
  "design_description": "One-line description of the design style"
}`;

  const response = await ai.models.generateContent({
    model: MODELS.flash,
    contents: [{ role: "user", parts: [...imageParts, { text: prompt }] }],
    config: { responseMimeType: "application/json", temperature: 0.2 },
  });

  if (!response.text) return DEFAULTS;

  try {
    const result = JSON.parse(response.text);
    return {
      primary_color: result.primary_color || DEFAULTS.primary_color,
      accent_color: result.accent_color || DEFAULTS.accent_color,
      secondary_color: result.secondary_color || DEFAULTS.secondary_color,
      theme_label: result.theme_label || DEFAULTS.theme_label,
      design_description: result.design_description || DEFAULTS.design_description,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { logo_url, screenshot_urls = [] } = await request.json();

    const result = await analyzeTheme(screenshot_urls, logo_url);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("theme-reader error:", message);
    return NextResponse.json({ error: "Failed to analyze theme", message }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";
