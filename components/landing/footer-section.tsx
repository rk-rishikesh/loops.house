import Image from "next/image";
import Link from "next/link";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

const FOOTER_LINKS = [
  { label: "About", href: "#about" },
  { label: "Apply", href: "/host/apply" },
  { label: "Loops House", href: "/" },
  { label: "Ecosystem", href: "/hackathons" },
  { label: "FAQ", href: "#faq" },
];

export function FooterSection() {
  return (
    <footer
      className="relative w-full rounded-[15px] overflow-hidden"
      style={{ backgroundColor: "#3C574B" }}
    >
      {/* Content layer — above decorative elements */}
      <div className="relative z-10 px-6 sm:px-10 pt-9 pb-10">
        {/* Large LOOPS HOUSE */}
        <p
          className="font-bold text-center"
          style={{
            fontFamily: PX,
            fontSize: "clamp(48px, 9.6vw, 138px)",
            lineHeight: 1,
            color: "#E2FEA5",
            letterSpacing: "-0.45px",
          }}
        >
          LOOPS HOUSE
        </p>

        {/* Tagline */}
        <p
          className="mt-5 max-w-xl"
          style={{
            fontFamily: FN,
            fontSize: "clamp(18px, 2vw, 24px)",
            lineHeight: "1.35",
            color: "#E2FEA5",
            fontWeight: 500,
          }}
        >
          Don&apos;t sleep on your ideas. Make them a reality with Loops House.
        </p>

        {/* Footer links */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 sm:gap-x-14 mt-7">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="no-underline transition-opacity hover:opacity-80"
              style={{
                fontFamily: FN,
                fontSize: "clamp(15px, 1.3vw, 19px)",
                lineHeight: "1.2",
                color: "#F8FFE8",
                letterSpacing: "0.16px",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Decorative area — trees and cat pinned to bottom */}
      <div className="relative w-full h-[250px] sm:h-[350px] md:h-[420px] pointer-events-none">
        {/* Tree right */}
        <div className="absolute right-[10%] sm:right-[16%] bottom-0 w-[35%] sm:w-[28%] h-full">
          <Image
            src="/landing/footer-tree1.png"
            alt=""
            fill
            className="object-contain object-bottom"
          />
        </div>
        {/* Tree left */}
        <div className="absolute left-[10%] sm:left-[16%] bottom-0 w-[35%] sm:w-[28%] h-full">
          <Image
            src="/landing/footer-tree2.png"
            alt=""
            fill
            className="object-contain object-bottom"
          />
        </div>
        {/* Cat */}
        <div className="absolute right-[15%] sm:right-[20%] bottom-[8%] w-[200px] h-[200px] sm:w-[350px] sm:h-[350px] md:w-[450px] md:h-[450px]">
          <div style={{ transform: "rotate(26.29deg)" }} className="w-full h-full relative">
            <Image src="/landing/cat-footer.png" alt="" fill className="object-contain" />
          </div>
        </div>
      </div>
    </footer>
  );
}
