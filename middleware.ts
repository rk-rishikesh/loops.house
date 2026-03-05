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
const ROLE_HINT_COOKIE = "x-user-role-hint"; // JS-readable twin for AuthProvider
const ROLE_COOKIE_TTL = 30; // 30s — keep short so role changes (e.g. admin promotion) propagate without hard refresh

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isStaticAssetRequest = /\.[^/]+$/.test(pathname);

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

  // Use getSession() instead of getUser() — reads JWT from cookie locally (~5ms)
  // instead of making a network call to Supabase auth servers (~150ms).
  // RLS on actual data access still validates the JWT server-side.
  // We extract the user ID from the JWT `sub` claim rather than accessing
  // session.user, which avoids the Supabase "insecure user" warning proxy.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Authenticated user hitting /login → redirect them away immediately
  if (session && pathname === "/login") {
    const userId = JSON.parse(atob(session.access_token.split(".")[1])).sub as string;
    const explicit = request.nextUrl.searchParams.get("redirect");
    if (explicit) {
      return NextResponse.redirect(new URL(explicit, request.url));
    }
    // Resolve role for dashboard redirect
    let role: string | undefined;
    const cached = request.cookies.get(ROLE_COOKIE)?.value;
    if (cached) {
      const sep = cached.indexOf(":");
      if (sep !== -1 && cached.slice(0, sep) === userId) {
        role = cached.slice(sep + 1);
      }
    }
    if (!role) {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();
      role = (data?.role as string) ?? "builder";
    }
    return NextResponse.redirect(new URL(ROLE_DASHBOARDS[role] ?? "/builder", request.url));
  }

  // Unauthenticated user on a protected route → send to login
  // (Skip if already on /login and allow static asset requests, e.g. public files/CSS)
  if (!session && pathname !== "/login" && !isStaticAssetRequest) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const redirect = NextResponse.redirect(loginUrl);
    redirect.cookies.delete(ROLE_COOKIE);
    redirect.cookies.delete(ROLE_HINT_COOKIE);
    return redirect;
  }

  // Unauthenticated user on /login → let through
  if (!session) {
    return response;
  }

  // Extract user ID from JWT sub claim (avoids touching the proxied session.user)
  const userId = JSON.parse(atob(session.access_token.split(".")[1])).sub as string;

  // Role check — use cached cookie first, fall back to DB.
  // Cookie format: "userId:role" to prevent cross-user contamination.
  let role: string | undefined;
  const cached = request.cookies.get(ROLE_COOKIE)?.value;
  if (cached) {
    const sep = cached.indexOf(":");
    if (sep !== -1 && cached.slice(0, sep) === userId) {
      role = cached.slice(sep + 1);
    }
  }
  if (!role) {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
    role = (data?.role as string) ?? "builder";
    // Cache role in a short-lived HTTP-only cookie, bound to this user
    response.cookies.set(ROLE_COOKIE, `${userId}:${role}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ROLE_COOKIE_TTL,
      path: "/",
    });
    // JS-readable twin so AuthProvider can read role instantly without a DB query
    response.cookies.set(ROLE_HINT_COOKIE, role, {
      httpOnly: false,
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
  matcher: ["/(builder|host|admin|login)(.*)"],
};
