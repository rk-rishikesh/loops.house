import Image from "next/image";

const FN = "var(--font-funnel-sans), sans-serif";

export function AboutSection() {
  return (
    <section
      className="relative w-full rounded-b-[15px] overflow-hidden"
      style={{ backgroundColor: "#0F2C23", minHeight: 648 }}
    >
      <div className="relative flex items-start px-[38px] py-[40px]" style={{ minHeight: 648 }}>
        {/* Left side: images */}
        <div className="relative flex items-start gap-4 shrink-0" style={{ width: 600, height: 560 }}>
          {/* Robot/mascot card */}
          <div
            className="relative overflow-hidden rounded-[20px] mt-[180px]"
            style={{ backgroundColor: "#E2FEA5", width: 225, height: 239 }}
          >
            <div className="absolute inset-[27%_11%_27%_12%]">
              <Image src="/landing/robot.png" alt="Loops mascot" fill className="object-contain" />
            </div>
          </div>

          {/* Cat photo in arch shape */}
          <div
            className="relative overflow-hidden"
            style={{
              backgroundColor: "#F8FFE8",
              width: 364,
              height: 547,
              borderRadius: "180px 180px 20px 20px",
            }}
          >
            <Image
              src="/landing/cat-hero.png"
              alt="Cat illustration"
              fill
              className="object-cover"
              style={{ objectPosition: "center top" }}
            />
          </div>
        </div>

        {/* Right side: text content */}
        <div className="flex-1 pl-[40px] pt-[170px]">
          <p
            className="leading-[25px] whitespace-pre-wrap"
            style={{
              fontFamily: FN,
              fontSize: 20,
              color: "#F8FFE8",
              maxWidth: 543,
            }}
          >
            Loops House is where builders turn ideas into real, lasting projects. Whether you&apos;re hacking solo or shipping with a team, this is your permanent home to ideate, build, and grow.{"\n\n"}Join hackathons, get AI-powered feedback, and showcase your work to the ecosystem. Every project deserves more than a weekend.
          </p>

          {/* CTA */}
          <button
            className="mt-8 inline-flex items-center justify-center rounded-full border cursor-pointer transition-colors hover:opacity-90"
            style={{
              backgroundColor: "#E2FEA5",
              borderColor: "#0F2C23",
              height: 51,
              paddingLeft: 32,
              paddingRight: 32,
            }}
          >
            <span
              className="font-bold text-center tracking-[0.32px]"
              style={{
                fontFamily: "var(--font-funnel-sans), sans-serif",
                fontSize: 15,
                color: "#0F2C23",
                fontStyle: "normal",
                fontWeight: 700,
              }}
            >
              LEARN MORE
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
