"use client";

import { LogIn, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { COLOR_OFF, FN } from "./styles";

function clearAuthCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.trim().split("=")[0];
    if (
      name.startsWith("sb-") ||
      name === "x-user-role-hint" ||
      name === "x-user-caps" ||
      name === "x-user-caps-hint"
    ) {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  });
}

const BTN_COLLAPSED =
  "group flex items-center justify-center w-11 h-11 mx-auto rounded-2xl transition-all duration-300";
const BTN_EXPANDED =
  "group flex items-center w-full h-11 px-4 rounded-2xl transition-all duration-300";

export function CollapseButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${collapsed ? BTN_COLLAPSED : BTN_EXPANDED} border border-white/10 bg-white/3 hover:bg-white/5 cursor-pointer`}
      title={collapsed ? "Expand Menu" : undefined}
    >
      <div className="shrink-0 text-[#E2FEA5]/40 group-hover:text-[#E2FEA5] transition-colors">
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </div>
      {!collapsed && (
        <span
          className="ml-auto text-[10px] font-bold tracking-widest uppercase"
          style={{ color: COLOR_OFF, fontFamily: FN }}
        >
          Collapse
        </span>
      )}
    </button>
  );
}

export function LogoutButton({ collapsed }: { collapsed: boolean }) {
  const lockRef = useRef(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const user = data.user;
        setEmail(user?.email ?? null);
        setDisplayName(
          user?.user_metadata?.display_name ||
            user?.user_metadata?.full_name ||
            null,
        );
        setAvatarUrl(user?.user_metadata?.avatar_url || null);
        setChecked(true);
      });
  }, []);

  async function handleLogout() {
    if (lockRef.current) return;
    lockRef.current = true;
    setLoggingOut(true);
    try {
      await signOut();
    } catch {
      /* non-fatal */
    }
    clearAuthCookies();
    window.location.href = "/login";
  }

  if (!checked) return null;

  const initials = (displayName || email || "U")
    .split(/[\s@._]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0].toUpperCase())
    .join("");

  // ── Signed-out ──
  if (!email) {
    if (collapsed) {
      return (
        <a
          href="/login"
          className={`${BTN_COLLAPSED} bg-[#E2FEA5] hover:bg-[#f3ffd0] no-underline`}
          title="Sign in"
        >
          <LogIn size={16} className="text-[#0F2C23]" />
        </a>
      );
    }
    return (
      <a
        href="/login"
        className={`${BTN_EXPANDED} bg-[#E2FEA5] hover:bg-[#f3ffd0] no-underline`}
        style={{ fontFamily: FN }}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0F2C23]">
          Sign in
        </span>
      </a>
    );
  }

  // ── Signed-in ──
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-11 h-11 mx-auto rounded-2xl flex items-center justify-center font-bold text-[11px] ring-1 ring-white/20 overflow-hidden bg-white/10 text-white"
          style={{ fontFamily: FN }}
          title={displayName || email}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={`${BTN_COLLAPSED} bg-[#E2FEA5] hover:bg-[#f3ffd0] disabled:opacity-60 border-none cursor-pointer`}
          title="Sign out"
        >
          <LogOut size={16} className="text-[#0F2C23]" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 w-full rounded-2xl border border-white/10 bg-white/3 px-3 py-2">
        <div
          className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs ring-1 ring-white/15 overflow-hidden bg-white/10 text-white"
          style={{ fontFamily: FN }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] font-bold truncate tracking-tight text-white"
            style={{ fontFamily: FN }}
          >
            {displayName || email.split("@")[0]}
          </p>
          <p
            className="text-[9px] truncate text-[#E2FEA5]"
            style={{ fontFamily: FN }}
          >
            {email}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className={`${BTN_EXPANDED} bg-[#E2FEA5] hover:bg-[#f3ffd0] disabled:opacity-60 border-none cursor-pointer`}
        style={{ fontFamily: FN }}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0F2C23]">
          Sign out
        </span>
      </button>
    </div>
  );
}
