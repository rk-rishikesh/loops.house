import Image from "next/image";
import Link from "next/link";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

export function BuildPurposeSection() {
  return (
    <section
      className="relative w-full rounded-[15px] overflow-hidden"
      style={{ backgroundColor: "#F8FFE8", minHeight: 768 }}
    >
      <div className="relative px-[25px] py-[60px]" style={{ minHeight: 768 }}>
        {/* "Build" */}
        <p
          className="font-bold"
          style={{
            fontFamily: PX,
            fontSize: "clamp(100px, 14.6vw, 210px)",
            lineHeight: "0.72",
            color: "#0F2C23",
          }}
        >
          Build
        </p>

        {/* "With" */}
        <p
          className="font-bold mt-[40px]"
          style={{
            fontFamily: PX,
            fontSize: "clamp(100px, 14.6vw, 210px)",
            lineHeight: "0.67",
            color: "#8FA08F",
          }}
        >
          With
        </p>

        {/* Cat image */}
        <div className="absolute" style={{ left: 99, top: 323, width: 345, height: 367 }}>
          <Image src="/landing/build-cat.png" alt="" fill className="object-cover" />
        </div>

        {/* "Purpose" */}
        <p
          className="font-bold absolute"
          style={{
            fontFamily: PX,
            fontSize: "clamp(100px, 14.6vw, 210px)",
            lineHeight: "0.72",
            color: "#0F2C23",
            left: 502,
            bottom: 160,
          }}
        >
          Purpose
        </p>

        {/* Right side subtitle */}
        <div className="absolute" style={{ right: 37, top: 100 }}>
          <p
            className="text-right"
            style={{
              fontFamily: FN,
              fontSize: 24.6,
              lineHeight: "23.4px",
              color: "#534A37",
              maxWidth: 287,
            }}
          >
            Validate before you scale<br />
            Ship with conviction<br />
            Build for the long term
          </p>

          {/* Learn more CTA */}
          <Link
            href="/hackathons"
            className="mt-6 inline-flex items-center justify-center rounded-full border no-underline transition-colors hover:opacity-90"
            style={{
              backgroundColor: "#E2FEA5",
              borderColor: "#0F2C23",
              height: 26,
              paddingLeft: 20,
              paddingRight: 20,
            }}
          >
            <span
              className="font-normal text-center tracking-[0.32px]"
              style={{
                fontFamily: PX,
                fontSize: 14,
                color: "#0F2C23",
              }}
            >
              Learn more
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
