import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

function getDashboardUrl(user: { is_admin: boolean; is_event_creator: boolean }): string {
  if (user.is_admin) return "/admin";
  if (user.is_event_creator) return "/host";
  return "/dashboard";
}

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
          .select("is_admin, is_event_creator")
          .eq("id", user.id)
          .single();
        const dashboard = data
          ? getDashboardUrl(data as { is_admin: boolean; is_event_creator: boolean })
          : "/dashboard";
        return NextResponse.redirect(new URL(dashboard, origin));
      }

      return NextResponse.redirect(new URL("/dashboard", origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_failed", origin));
}
