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
      className={`group flex items-center gap-4 rounded-2xl border-none cursor-pointer transition-all duration-300 hover:bg-white/5 ${
        collapsed ? "justify-center w-11 h-11 mx-auto" : "w-full h-11 px-4"
      }`}
      style={{ backgroundColor: "transparent" }}
      title={collapsed ? "Expand Menu" : undefined}
    >
      <div className="shrink-0 text-[#E2FEA5]/40 group-hover:text-[#E2FEA5] transition-colors">
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </div>
      {!collapsed && (
        <span
          className="text-[10px] font-bold tracking-widest uppercase"
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
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        setEmail(data.session?.user?.email ?? null);
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

  if (!email) {
    return (
      <a
        href="/login"
        className={`group flex items-center gap-4 rounded-2xl no-underline transition-all duration-300 hover:bg-white/5 ${
          collapsed ? "justify-center w-11 h-11 mx-auto" : "w-full h-11 px-4"
        }`}
        style={{ backgroundColor: "transparent" }}
        title={collapsed ? "Sign in" : undefined}
      >
        <div className="shrink-0 text-[#E2FEA5]/40 group-hover:text-[#E2FEA5] transition-colors">
          <LogIn size={18} />
        </div>
        {!collapsed && (
          <span
            className="text-[10px] font-bold tracking-widest uppercase transition-colors group-hover:text-[#E2FEA5]"
            style={{ color: COLOR_OFF, fontFamily: FN }}
          >
            Sign in
          </span>
        )}
      </a>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {!collapsed && (
        <p
          className="truncate px-4 text-[10px] tracking-wide"
          style={{ color: "rgba(226,254,165,0.45)", fontFamily: FN }}
          title={email}
        >
          {email}
        </p>
      )}
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className={`group flex items-center gap-4 rounded-2xl border-none cursor-pointer transition-all duration-300 hover:bg-red-500/10 disabled:opacity-50 ${
          collapsed ? "justify-center w-11 h-11 mx-auto" : "w-full h-11 px-4"
        }`}
        style={{ backgroundColor: "transparent" }}
        title={collapsed ? "Log out" : undefined}
      >
        <div className="shrink-0 text-[#E2FEA5]/40 group-hover:text-red-400 transition-colors">
          <LogOut size={18} />
        </div>
        {!collapsed && (
          <span
            className="text-[10px] font-bold tracking-widest uppercase transition-colors group-hover:text-red-400"
            style={{ color: COLOR_OFF, fontFamily: FN }}
          >
            Sign out
          </span>
        )}
      </button>
    </div>
  );
}
