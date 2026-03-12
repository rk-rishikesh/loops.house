"use client";

import Image from "next/image";

const FD = "var(--font-funnel-sans), sans-serif";

const PARTNERS = [
  { src: "/landing/partner-1.png", width: 188, alt: "Partner 1" },
  { src: "/landing/partner-2.png", width: 172, alt: "Partner 2" },
  { src: "/landing/partner-3.png", width: 212, alt: "Partner 3" },
  { src: "/landing/partner-4.png", width: 178, alt: "Partner 4" },
  { src: "/landing/partner-5.png", width: 186, alt: "Partner 5" },
  { src: "/landing/partner-6.png", width: 148, alt: "Partner 6" },
  { src: "/landing/partner-7.png", width: 185, alt: "Partner 7" },
  { src: "/landing/partner-8.png", width: 95, alt: "Partner 8" },
];

export function PartnersSection() {
  return (
    <section
      className="relative w-full overflow-hidden py-0"
      style={{ backgroundColor: "#E2FEA5" }}
    >
      {/* Divider lines */}
      <div className="w-full h-[2px] bg-[rgba(15,44,35,0.15)]" />

      {/* OUR PARTNERS badge */}
      <div className="px-[68px] pt-[12px]">
        <div
          className="inline-flex items-center justify-center rounded-t-[40px] border-2 border-black overflow-hidden"
          style={{
            backgroundColor: "#F8FFE8",
            height: 62,
            paddingLeft: 40,
            paddingRight: 40,
          }}
        >
          <span
            className="font-extrabold uppercase tracking-[0.32px]"
            style={{
              fontFamily: FD,
              fontSize: 32,
              color: "#0F2C23",
              fontStyle: "normal",
              fontWeight: 800,
            }}
          >
            OUR PARTNERS
          </span>
        </div>
      </div>

      {/* Infinite scrolling partner logos */}
      <div className="overflow-hidden py-[27px]">
        <div className="flex animate-marquee">
          {[...PARTNERS, ...PARTNERS].map((partner, idx) => (
            <div
              key={idx}
              className="relative shrink-0 h-[45px] mx-[37.5px] w-[188px] flex items-center justify-center"
            >
              <Image
                src={partner.src}
                alt={partner.alt}
                width={188}
                height={45}
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom divider */}
      <div className="w-full h-[2px] bg-[rgba(15,44,35,0.15)]" />

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
          width: max-content;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
