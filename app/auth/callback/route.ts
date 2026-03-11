import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { AppRole } from "@/lib/supabase/types";

const ROLE_DASHBOARDS: Record<AppRole, string> = {
  builder: "/builder",
  host: "/host",
  viewer: "/hackathons",
  judge: "/host/judging",
  admin: "/admin",
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const explicitRedirect = searchParams.get("redirect");

  if (code) {
    const supabase = await createServerSupabase();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If middleware set an explicit redirect (e.g. user tried /host while logged out), honour it
      if (explicitRedirect) {
        return NextResponse.redirect(new URL(explicitRedirect, origin));
      }

      // Use user from exchangeCodeForSession response — no need for a second getUser() call
      const user = sessionData.session?.user;
      if (user) {
        const { data } = await supabaseAdmin
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        const role = (data?.role as AppRole) ?? "builder";
        return NextResponse.redirect(
          new URL(ROLE_DASHBOARDS[role], origin),
        );
      }

      return NextResponse.redirect(new URL("/builder", origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_failed", origin));
}
