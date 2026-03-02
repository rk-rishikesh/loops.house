import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/builder", "/host", "/admin"];

// Which roles can access which route prefixes
const ROLE_ROUTES: Record<string, string[]> = {
  "/builder": ["builder", "admin"],
  "/host": ["host", "admin", "judge"],
  "/admin": ["admin"],
};

const ROLE_DASHBOARDS: Record<string, string> = {
  builder: "/builder",
  host: "/host",
  viewer: "/boosters",
  judge: "/host/judging",
  admin: "/admin",
};

const ROLE_COOKIE = "x-user-role";
const ROLE_COOKIE_TTL = 30; // 30s — keep short so role changes (e.g. admin promotion) propagate without hard refresh

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Refresh session (important for SSR)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const redirect = NextResponse.redirect(loginUrl);
    redirect.cookies.delete(ROLE_COOKIE);
    return redirect;
  }

  // Role check — use cached cookie first, fall back to DB.
  // Cookie format: "userId:role" to prevent cross-user contamination.
  let role: string | undefined;
  const cached = request.cookies.get(ROLE_COOKIE)?.value;
  if (cached) {
    const sep = cached.indexOf(":");
    if (sep !== -1 && cached.slice(0, sep) === user.id) {
      role = cached.slice(sep + 1);
    }
  }
  if (!role) {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    role = (data?.role as string) ?? "builder";
    // Cache role in a short-lived HTTP-only cookie, bound to this user
    response.cookies.set(ROLE_COOKIE, `${user.id}:${role}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ROLE_COOKIE_TTL,
      path: "/",
    });
  }

  // /host/apply is open to any authenticated user (public host application form)
  if (pathname === "/host/apply") {
    return response;
  }

  const routePrefix = PROTECTED.find((p) => pathname.startsWith(p));
  if (routePrefix) {
    const allowed = ROLE_ROUTES[routePrefix] ?? [];
    if (!allowed.includes(role)) {
      const dashboard = ROLE_DASHBOARDS[role] ?? "/builder";
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/(builder|host|admin)(.*)"],
};
