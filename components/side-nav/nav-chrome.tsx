"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { COLOR_ON, COLOR_OFF, FN, PX } from "./styles";

export function LogoButton({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/"
      className={`group flex items-center no-underline mb-6 transition-all duration-300 rounded-2xl ${
        collapsed
          ? "justify-center w-11 h-11 mx-auto"
          : "w-full h-12 px-4 gap-3"
      }`}
      title="Home"
    >
      <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-xl group-hover:bg-white/10 transition-colors">
        <Image src="/lightlogo.svg" alt="Loops" width={18} height={18} />
      </div>
      {!collapsed && (
        <span
          className="text-sm font-black tracking-widest uppercase transition-colors"
          style={{ color: COLOR_ON, fontFamily: PX }}
        >
          Loops
        </span>
      )}
    </Link>
  );
}

export function BackButton({
  href,
  label,
  collapsed,
}: {
  href: string;
  label: string;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex justify-between items-center no-underline mb-6 transition-all duration-300 hover:bg-white/5 rounded-2xl ${
        collapsed
          ? "justify-center w-11 h-11 mx-auto"
          : "w-full h-12 px-3 gap-3"
      }`}
      title={label}
    >
      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-[#E2FEA5]/5 text-[#E2FEA5] group-hover:bg-[#E2FEA5]/10 group-hover:-translate-x-0.5 transition-all">
        <ArrowLeft size={16} />
      </div>
      {!collapsed && (
        <span
          className="text-[10px] font-bold tracking-widest uppercase truncate"
          style={{ color: COLOR_OFF, fontFamily: FN }}
        >
          {label}
        </span>
      )}
    </Link>
  );
}
