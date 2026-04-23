"use client";

import Image from "next/image";
import { funnelSans } from "@/app/fonts";

export function BuildWithPurposeSection() {
  return (
    <section
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#F8FFE8",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        padding: "16px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1440,
          position: "relative",
          background: "#F8FFE8",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "24px 8px 20px 8px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 24,
          }}
        >
          <div
            className={funnelSans.className}
            style={{
              color: "#0F2C23",
              fontSize: "clamp(118px, 14vw, 220px)",
              lineHeight: "clamp(54px, 5.6vw, 84px)",
              letterSpacing: "-0.04em",
              fontWeight: 700,
              flexShrink: 0,
              position: "relative",
              zIndex: 2,
            }}
          >
            <div style={{ fontWeight: 800, marginTop: 40 }}>Build</div>
            <div
              style={{
                color: "#93A196",
                marginTop: 100,
                fontWeight: 800,
                marginLeft: 8,
                position: "relative",
                zIndex: 4,
              }}
            >
              With
            </div>
            <div
              style={{
                width: "clamp(210px, 27vw, 370px)",
                height: "clamp(160px, 26vw, 300px)",
                position: "relative",
                marginTop: -37,
                marginLeft: 17,
                zIndex: 0,
              }}
            >
              <Image
                src="/landing/purposeCat.svg"
                alt="Loops cat mascot"
                fill
                sizes="(max-width: 768px) 260px, 370px"
                style={{ objectFit: "contain", objectPosition: "bottom left" }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 12,
              paddingRight: 24,
              paddingTop: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: "clamp(132px, 12vw, 180px)",
                  height: "clamp(132px, 12vw, 180px)",
                  borderRadius: "9999px",
                  border: "1px solid #0F2C23",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <p
                  className={funnelSans.className}
                  style={{
                    margin: 0,
                    color: "#1E3028",
                    fontSize: "clamp(14px, 1.1vw, 18px)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    lineHeight: 1,
                  }}
                >
                  Builders
                </p>
                <p
                  className={funnelSans.className}
                  style={{
                    margin: 0,
                    color: "#0F2C23",
                    fontSize: "clamp(42px, 4vw, 58px)",
                    lineHeight: 0.9,
                  }}
                >
                  1085
                </p>
              </div>

              <div
                style={{
                  width: "clamp(132px, 12vw, 180px)",
                  height: "clamp(132px, 12vw, 180px)",
                  borderRadius: "9999px",
                  border: "1px solid #0F2C23",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <p
                  className={funnelSans.className}
                  style={{
                    margin: 0,
                    color: "#1E3028",
                    fontSize: "clamp(14px, 1.1vw, 18px)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    lineHeight: 1,
                  }}
                >
                  Projects
                </p>
                <p
                  className={funnelSans.className}
                  style={{
                    margin: 0,
                    color: "#0F2C23",
                    fontSize: "clamp(42px, 4vw, 58px)",
                    lineHeight: 0.9,
                  }}
                >
                  67
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: "38%",
            top: "42%",
            width: 150,
            height: 140,
            pointerEvents: "none",
          }}
          aria-hidden
        >
          <svg viewBox="0 0 150 140" width="100%" height="100%">
            <path
              d="M6 8 C 95 8, 140 62, 138 136"
              fill="none"
              stroke="#0F2C23"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div
          style={{
            marginTop: -120,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            gap: 18,
            width: "100%",
          }}
        >
          <div
            className={funnelSans.className}
            style={{
              color: "#0F2C23",
              fontSize: "clamp(128px, 14vw, 220px)",
              lineHeight: "clamp(92px, 10.5vw, 152.2px)",
              letterSpacing: "-0.04em",
              paddingRight: 0,
              fontWeight: 700,
              flexShrink: 0,
              marginLeft: "auto",
              textAlign: "right",
            }}
          >
            Purpose
          </div>
        </div>
      </div>
    </section>
  );
}
