import { NextResponse } from "next/server";
import { analyzeYoutube } from "@/lib/agents/youtube";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    const data = await analyzeYoutube(url);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process YouTube video";
    console.error("Error in YouTube Direct Source Agent:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
