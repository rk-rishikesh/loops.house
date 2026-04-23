"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { funnelSans } from "@/app/fonts";

const partnerLogos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n, i) => ({
  src: `/partners/${n}.svg`,
  borderRadius: i % 2 === 0 ? 25 : 182,
}));

export function PartnersSection() {
  return (
    <section
      style={{
        width: "100%",
        height: "100vh",
        background: "#F8FFE8",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          borderRadius: 12,
          background: "#0F2C23",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          border: "1px solid #2A4B3F",
          padding: "22px 18px 0 18px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
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
          <h2
            className={funnelSans.className}
            style={{
              margin: 0,
              color: "#E2FEA5",
              fontSize: "clamp(48px, 6.4vw, 78px)",
              fontWeight: 700,
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              maxWidth: 560,
            }}
          >
            WE&apos;VE BEEN
            <br />
            COLLABORATING
            <br />
            WITH
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 18,
              maxWidth: 520,
              paddingRight: 14,
              paddingTop: 4,
            }}
          >
            <p
              className={funnelSans.className}
              style={{
                margin: 0,
                color: "#D2E2DB",
                fontSize: "clamp(16px, 1.25vw, 28px)",
                lineHeight: 1.42,
              }}
            >
              We partner with startups and enterprise teams to design, build,
              and optimize AI-powered products, agent workflows, and automation
              systems that scale reliably.
            </p>
            <a
              className={funnelSans.className}
              href="mailto:hello@loops.house"
              style={{
                height: 46,
                minWidth: 162,
                borderRadius: 9999,
                border: "1px solid #D9E3D2",
                background: "#F3F8E9",
                color: "#0F2C23",
                fontSize: 15,
                fontWeight: 600,
                padding: "0 18px",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              Contact us ↗
            </a>
          </div>
        </div>

        <div style={{ position: "relative", marginTop: 32, marginBottom: 14 }}>
          <div className="relative z-20 overflow-hidden">
            <motion.div
              className="flex w-max gap-0"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                duration: 28,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  className="flex shrink-0 items-center gap-6 pr-6"
                  aria-hidden={copy === 1 || undefined}
                >
                  {partnerLogos.map(({ src, borderRadius }) => (
                    <div
                      key={`${copy}-${src}`}
                      className="relative flex shrink-0 items-center justify-center px-6"
                      style={{
                        width: 291,
                        height: 215,
                        borderRadius,
                        background: "#F8FFE8",
                        border: "1px solid #C7D4C8",
                      }}
                    >
                      <Image
                        src={src}
                        alt=""
                        width={240}
                        height={120}
                        className="object-contain"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
