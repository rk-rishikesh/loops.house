"use client";
import { useRef, useState } from "react";
import { signOut } from "@/lib/auth";

export function clearAuthCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.trim().split("=")[0];
    if (name.startsWith("sb-") || name === "x-user-role-hint" || name === "x-user-caps" || name === "x-user-caps-hint") {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  });
}

const segmentBase =
  "w-[240px] max-w-xs py-8 px-10 flex items-center justify-end bg-transparent cursor-pointer text-[10px] tracking-[0.18em] uppercase font-bold border-none disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-transparent";

const inlineBase =
  "inline-flex items-center gap-2 rounded-full border-none cursor-pointer py-2 px-4 text-[10px] tracking-[0.18em] uppercase font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-transparent";

export function LogoutButton({
  segment = true,
  className,
}: {
  segment?: boolean;
  className?: string;
} = {}) {
  const isSegment = segment;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const loggingOutRef = useRef(false);

  async function handleLogout() {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch {
      // Navigator lock timeout — non-fatal
    }
    clearAuthCookies();
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`${isSegment ? segmentBase : inlineBase}${className ? ` ${className}` : ""}`}
      style={{ fontFamily: "var(--font-pixelify-sans), sans-serif", color: "#0F2C23" }}
      title="Sign out"
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(15,44,35,0.06)")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <span className="flex items-center gap-2">
        <span>{isLoggingOut ? "Signing out…" : "Sign out"}</span>
      </span>
    </button>
  );
}
