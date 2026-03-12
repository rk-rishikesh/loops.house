import Image from "next/image";
import Link from "next/link";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

export function HeroSection() {
  return (
    <section
      className="relative w-full rounded-t-[15px] overflow-hidden"
      style={{ backgroundColor: "#0F2C23" }}
    >
      <div className="relative px-[35px] pt-[60px] pb-[38px]" style={{ minHeight: 618 }}>
        {/* Large LOOPS HOUSE text */}
        <h1
          className="font-bold tracking-[7.4px] whitespace-nowrap"
          style={{
            fontFamily: PX,
            fontSize: "clamp(80px, 13vw, 185px)",
            lineHeight: "1.01",
            color: "#F8FFE8",
          }}
        >
          L
          <span className="relative inline-block">
            {/* The OO cutout box */}
            <span
              className="inline-block rounded-[12px] overflow-hidden align-middle"
              style={{
                backgroundColor: "#F8FFE8",
                width: "clamp(120px, 17vw, 241px)",
                height: "clamp(80px, 11.5vw, 163px)",
                position: "relative",
                verticalAlign: "baseline",
                marginBottom: "-0.05em",
              }}
            >
              <span
                className="absolute font-bold tracking-[-5.55px]"
                style={{
                  fontFamily: PX,
                  fontSize: "clamp(80px, 13vw, 185px)",
                  lineHeight: "1.01",
                  color: "#0F2C23",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                OO
              </span>
            </span>
          </span>
          PS HOUSE
        </h1>

        {/* Hero graphic (small illustration between letters) */}
        <div
          className="absolute"
          style={{ left: "9.77%", top: "30.42%", width: "17.19%", height: "32.69%" }}
        >
          <Image src="/landing/hero-graphic.png" alt="" fill className="object-contain" />
        </div>

        {/* Top-right description */}
        <p
          className="absolute text-right max-w-[324px]"
          style={{
            fontFamily: FN,
            fontSize: 16,
            lineHeight: "20px",
            color: "#F8FFE8",
            right: 35,
            top: 40,
          }}
        >
          Your permanent home for developer projects. Build, iterate, and showcase your work.
        </p>

        {/* Bottom-left description */}
        <p
          className="absolute max-w-[294px]"
          style={{
            fontFamily: FN,
            fontSize: 16,
            lineHeight: "20px",
            color: "#F8FFE8",
            left: 35,
            bottom: 50,
          }}
        >
          Discover hackathons, build with AI-powered tools, and connect with a community of
          builders.
        </p>

        {/* Bottom CTA buttons */}
        <div
          className="absolute flex flex-wrap items-center gap-3"
          style={{ right: 36, bottom: 38 }}
        >
          <Link
            href="/projects"
            className="inline-flex items-center justify-center rounded-full no-underline border transition-colors hover:bg-[rgba(226,254,165,0.1)]"
            style={{
              borderColor: "#E2FEA5",
              height: 48,
              paddingLeft: 22,
              paddingRight: 22,
            }}
          >
            <span
              className="font-bold text-center uppercase tracking-[0.32px]"
              style={{
                fontFamily: FN,
                fontSize: 15,
                color: "#E2FEA5",
              }}
            >
              Explore Projects
            </span>
          </Link>
          <Link
            href="/hackathons"
            className="inline-flex items-center justify-center rounded-full no-underline border transition-colors hover:bg-[rgba(226,254,165,0.1)]"
            style={{
              borderColor: "#E2FEA5",
              height: 48,
              paddingLeft: 22,
              paddingRight: 22,
            }}
          >
            <span
              className="font-bold text-center uppercase tracking-[0.32px]"
              style={{
                fontFamily: FN,
                fontSize: 15,
                color: "#E2FEA5",
              }}
            >
              Explore Hackathons
            </span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full no-underline transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "#F8FFE8",
              height: 56,
              paddingLeft: 24,
              paddingRight: 8,
            }}
          >
            <span
              className="font-bold text-center"
              style={{
                fontFamily: FN,
                fontSize: 19,
                color: "#0F2C23",
              }}
            >
              SIGN IN
            </span>
            <span
              className="inline-flex items-center justify-center rounded-full ml-3"
              style={{
                backgroundColor: "#0F2C23",
                width: 40,
                height: 40,
              }}
            >
              <Image
                src="/landing/arrow-btn.png"
                alt=""
                width={24}
                height={24}
                className="object-contain"
                style={{ transform: "rotate(61deg)" }}
              />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
