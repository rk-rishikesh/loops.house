"use client";

import { useEffect, useRef, useState } from "react";
import { funnelSans } from "@/app/fonts";

const TARGET_COUNT = 1000;
const ANIMATION_DURATION_MS = 1800;

export function BuildWithPurposeSection() {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sectionElement = sectionRef.current;
    if (!sectionElement) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        setHasStarted(true);
        observer.disconnect();
      },
      { threshold: 0.4 }
    );

    observer.observe(sectionElement);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) {
      return;
    }

    let frameId = 0;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextCount = Math.floor(TARGET_COUNT * easedProgress);

      setCount(nextCount);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    frameId = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(frameId);
  }, [hasStarted]);

  return (
    <section
      ref={sectionRef}
      style={{
        width: "100%",
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "min(100%, 960px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 52,
          textAlign: "center",
        }}
      >
        <p
          className={funnelSans.className}
          style={{
            margin: 0,
            color: "#0F2C23",
            fontSize: "clamp(116px, 21vw, 240px)",
            lineHeight: 0.82,
            letterSpacing: "6px",
            fontWeight: 800,
          }}
        >
          {count}+
        </p>

        <p
          className={funnelSans.className}
          style={{
            margin: 0,
            color: "#1E3028",
            fontSize: "clamp(22px, 2.8vw, 34px)",
            lineHeight: 1.2,
            letterSpacing: "0.04em",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Builder Community
        </p>
      </div>
    </section>
  );
}
