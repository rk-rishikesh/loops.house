"use client";

import { useState } from "react";
import { motion, type Transition } from "framer-motion";
import { funnelSans } from "@/app/fonts";

const spring: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 22,
  mass: 0.8,
};

export type ShanghaiJoinButtonProps = {
  onClick: () => void;
  text?: string;
  width?: number;
  height?: number;
  leftPadding?: number;
  rightPadding?: number;
  gap?: number;
};

export default function ShanghaiJoinButton({
  onClick,
  text = "Join Now",
  width = 165,
  height = 44,
  leftPadding = 26,
  rightPadding = 2,
  gap = 36,
}: ShanghaiJoinButtonProps) {
  const [hovered, setHovered] = useState(false);

  const borderRadius = 9999;
  const borderWidth = 1.5;
  const fontSize = height <= 44 ? 12 : 21;
  const circle = Math.round((height / 44) * 34);
  const arrow = Math.round((height / 44) * 22);

  const colors = {
    ring: "#4A0C00",
    pillPrimary: "#5E0F00",
    pillHover: "#EDEDED",
    textPrimary: "#EDEDED",
    textHover: "#5E0F00",
    circlePrimary: "#EDEDED",
    circleHover: "#5E0F00",
    arrowPrimary: "#5E0F00",
    arrowHover: "#EDEDED",
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        width,
        height,
        borderRadius,
        paddingLeft: leftPadding,
        paddingRight: rightPadding,
        gap,
        border: "none",
        cursor: "pointer",
        outline: "none",
        overflow: "hidden",
        fontFamily: funnelSans.style.fontFamily,
      }}
      animate={hovered ? "hover" : "default"}
    >
      {/* Outer ring */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius,
          background: colors.ring,
          zIndex: 0,
        }}
      />

      {/* Animated pill backgrounds */}
      <motion.div
        style={{
          position: "absolute",
          inset: borderWidth,
          borderRadius,
          background: colors.pillPrimary,
          zIndex: 0,
        }}
        variants={{ default: { opacity: 1 }, hover: { opacity: 0 } }}
        transition={spring}
      />
      <motion.div
        style={{
          position: "absolute",
          inset: borderWidth,
          borderRadius,
          background: colors.pillHover,
          zIndex: 0,
        }}
        variants={{ default: { opacity: 0 }, hover: { opacity: 1 } }}
        transition={spring}
      />

      {/* Text */}
      <motion.span
        style={{
          position: "relative",
          zIndex: 1,
          fontSize,
          fontWeight: 800,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
        variants={{
          default: { color: colors.textPrimary },
          hover: { color: colors.textHover },
        }}
        transition={spring}
      >
        {text}
      </motion.span>

      {/* Circle with rotating arrow */}
      <div style={{ position: "relative", zIndex: 1, flexShrink: 0 }}>
        <motion.div
          style={{
            width: circle,
            height: circle,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          variants={{
            default: { background: colors.circlePrimary },
            hover: { background: colors.circleHover },
          }}
          transition={spring}
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width={arrow}
            height={arrow}
            viewBox="0 0 256 256"
            variants={{
              default: { rotate: 0 },
              hover: { rotate: 45 },
            }}
            transition={spring}
          >
            <motion.path
              d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z"
              variants={{
                default: { fill: colors.arrowPrimary },
                hover: { fill: colors.arrowHover },
              }}
              transition={spring}
            />
          </motion.svg>
        </motion.div>
      </div>
    </motion.button>
  );
}
