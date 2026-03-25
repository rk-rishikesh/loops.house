"use client";
import { useState } from "react";
import { motion, type Transition } from "framer-motion";

const spring: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 22,
  mass: 0.8,
};

export type AnimatedButtonProps = {
  text: string;
  leftPadding?: number;
  rightPadding?: number;
  gap?: number;
  height?: number;
  invertedColors?: boolean;
  fullWidth?: boolean;
};

export default function AnimatedButton({
  text,
  leftPadding = 44,
  rightPadding = 2,
  gap = 10,
  height = 44,
  invertedColors = false,
  fullWidth = false,
}: AnimatedButtonProps) {
  const [hovered, setHovered] = useState(false);

  const borderRadius = 9999;
  const borderWidth = 1.5;
  const fontSize = height <= 44 ? 12 : 21;
  const circle = Math.round((height / 44) * 34);
  // Match the arrow proportions used elsewhere in the app (HeroSection icon).
  const arrow = Math.round((height / 44) * 22);
  const label = text;

  const colors = invertedColors
    ? {
        // Keep a visible dark outline in the primary (non-hover) state.
        ring: "#0F2C23",
        pillPrimary: "#F8FFE8",
        pillHover: "#0F2C23",
        textPrimary: "#0F2C23",
        textHover: "#F8FFE8",
        circlePrimary: "#F8FFE8",
        circleHover: "#F8FFE8",
        arrowPrimary: "#0F2C23",
        arrowHover: "#0F2C23",
      }
    : {
        ring: "#0F2C23",
        pillPrimary: "#0F2C23",
        pillHover: "#F8FFE8",
        textPrimary: "#F8FFE8",
        textHover: "#0F2C23",
        circlePrimary: "#F8FFE8",
        circleHover: "#0F2C23",
        arrowPrimary: "#0F2C23",
        arrowHover: "#F8FFE8",
      };

  return (
    <motion.button
      type="button"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        width: fullWidth ? "100%" : "auto",
        height,
        borderRadius,
        paddingLeft: leftPadding,
        paddingRight: rightPadding,
        gap,
        border: "none",
        cursor: "pointer",
        outline: "none",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
      }}
      animate={hovered ? "hover" : "default"}
    >
      {/* Background layers */}
      {/* Outer ring (acts like the border, avoids border/background clip gaps) */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius,
          background: colors.ring,
          zIndex: 0,
        }}
      />
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

      {/* Text: color only */}
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
        {label}
      </motion.span>

      {/* Circle with single rotating arrow */}
      <div style={{ position: "relative", zIndex: 1, flexShrink: 0 }}>
        <motion.div
          style={{
            width: circle,
            height: circle,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderStyle: "solid",
            borderWidth: invertedColors ? 1 : 0,
          }}
          variants={{
            default: {
              background: colors.circlePrimary,
              borderColor: invertedColors ? "#0F2C23" : "transparent",
            },
            hover: {
              background: colors.circleHover,
              borderColor: "transparent",
            },
          }}
          transition={spring}
        >
          {/*
              One arrow pointing RIGHT (→).
              default = rotated -45deg → appears as ↗ diagonal
              hover   = rotated 0deg  → appears as → right
            */}
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
