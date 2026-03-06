"use client";
import { signOut } from "@/lib/auth";

export function clearAuthCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.trim().split("=")[0];
    if (name.startsWith("sb-") || name === "x-user-role-hint") {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  });
}

async function handleLogout() {
  try {
    await signOut();
  } catch {
    // Navigator lock timeout — non-fatal
  }
  clearAuthCookies();
  window.location.href = "/login";
}

const segmentBase =
  "w-[240px] max-w-xs py-8 px-10 flex items-center justify-end bg-transparent hover:bg-[#e1dbcf] cursor-pointer text-[10px] tracking-[0.18em] uppercase font-bold text-[#1a1a1a] border-none";

const inlineBase =
  "inline-flex items-center gap-2 rounded-full border-none cursor-pointer py-2 px-4 text-[10px] tracking-[0.18em] uppercase font-bold text-[#1a1a1a] transition-colors hover:bg-[#e1dbcf]";

export function LogoutButton({
  segment = true,
  className,
}: {
  segment?: boolean;
  className?: string;
} = {}) {
  const isSegment = segment;
  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`${isSegment ? segmentBase : inlineBase}${className ? ` ${className}` : ""}`}
      style={{ fontFamily: "'Inter', sans-serif" }}
      title="Sign out"
    >
      <span className="flex items-center gap-2">
        <span>Sign out</span>
      </span>
    </button>
  );
}
