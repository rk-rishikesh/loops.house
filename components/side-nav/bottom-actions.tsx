"use client";

import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useRef, useState } from "react";
import { signOut } from "@/lib/auth";
import { COLOR_OFF, PX } from "./styles";

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
        collapsed
          ? "justify-center w-11 h-11 mx-auto"
          : "w-full h-11 px-4"
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
          style={{ color: COLOR_OFF, fontFamily: PX }}
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

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className={`group flex items-center gap-4 rounded-2xl border-none cursor-pointer transition-all duration-300 hover:bg-red-500/10 disabled:opacity-50 ${
        collapsed
          ? "justify-center w-11 h-11 mx-auto"
          : "w-full h-11 px-4"
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
          style={{ color: COLOR_OFF, fontFamily: PX }}
        >
          Sign out
        </span>
      )}
    </button>
  );
}
