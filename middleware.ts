import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  encodeCapsForCookie,
  decodeCapsFromCookie,
  getBasicCapabilities,
  type BasicCapabilities,
} from "@/lib/capabilities";

const PUBLIC = ["/hackathons", "/residency", "/events", "/projects"];

const CAPS_COOKIE = "x-user-caps";
const CAPS_HINT_COOKIE = "x-user-caps-hint"; // JS-readable twin
const CAPS_COOKIE_TTL = 30;

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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Authenticated user hitting /login → redirect to dashboard
  if (session && pathname === "/login") {
    const explicit = request.nextUrl.searchParams.get("redirect");
    if (explicit) {
      return NextResponse.redirect(new URL(explicit, request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated user on a public route → let through
  const isPublicRoute = PUBLIC.some((p) => pathname.startsWith(p));
  if (
    !session &&
    pathname !== "/login" &&
    !isStaticAssetRequest &&
    !isPublicRoute
  ) {
    // Unauthenticated on protected route → login
    if (
      pathname === "/" ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/host") ||
      pathname.startsWith("/builder") ||
      pathname.startsWith("/judge") ||
      pathname.startsWith("/notifications")
    ) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const redirect = NextResponse.redirect(loginUrl);
      redirect.cookies.delete(CAPS_COOKIE);
      redirect.cookies.delete(CAPS_HINT_COOKIE);
      return redirect;
    }
    return response;
  }

  if (!session) return response;

  // Extract user ID from JWT
  const userId = JSON.parse(atob(session.access_token.split(".")[1]))
    .sub as string;

  // Resolve capabilities — cookie first, then DB
  let caps: BasicCapabilities | null = null;
  const cached = request.cookies.get(CAPS_COOKIE)?.value;
  if (cached) {
    caps = decodeCapsFromCookie(cached, userId);
  }
  if (!caps) {
    caps = (await getBasicCapabilities(supabase, userId)) ?? {
      isAdmin: false,
      isEventCreator: false,
      isCohost: false,
      isJudge: false,
    };
    const cookieValue = encodeCapsForCookie(userId, caps);
    response.cookies.set(CAPS_COOKIE, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CAPS_COOKIE_TTL,
      path: "/",
    });
    // JS-readable hint: "isAdmin,isEventCreator,isCohost,isJudge" as 0/1
    response.cookies.set(
      CAPS_HINT_COOKIE,
      [caps.isAdmin, caps.isEventCreator, caps.isCohost, caps.isJudge]
        .map((v) => (v ? "1" : "0"))
        .join(","),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: CAPS_COOKIE_TTL,
        path: "/",
      },
    );
  }

  // Route protection
  if (pathname.startsWith("/admin") && !caps.isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // /host/new — only event creators or admins can create new hackathons
  // (cohost check happens at page level since we need hackathon_id)
  if (pathname === "/host/new" && !caps.isEventCreator && !caps.isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // /judge — only judges or admins
  if (pathname.startsWith("/judge") && !caps.isJudge && !caps.isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/(dashboard|builder|host|admin|judge|notifications|login|hackathons|residency|events|projects)(.*)",
  ],
};
