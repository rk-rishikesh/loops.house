import Image from "next/image";

export function ResidencySection() {
  return (
    <section
      className="relative w-full overflow-hidden rounded-[35px]"
      style={{
        background:
          "linear-gradient(180deg, rgba(15, 44, 35, 0) -100%, #0F2C23 50%)",
      }}
    >
      {/* Top content area */}
      <div className="relative px-6 pt-10 pb-6 sm:px-10 md:px-14 md:pt-14 md:pb-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Title */}
          <div className="flex-shrink-0">
            <h2
              className="uppercase text-[#e2fea5] leading-[0.9]"
              style={{
                fontFamily: "'Pixelify Sans', sans-serif",
                fontWeight: 700,
              }}
            >
              <span className="block text-[40px] sm:text-[50px] md:text-[61px] tracking-[0.48px]">
                Loops House{" "}
              </span>
              <span
                className="block text-[30px] sm:text-[36px] md:text-[44px] mt-1"
                style={{ color: "rgba(226,254,165,0.52)" }}
              >
                IRL Builder
              </span>
              <span
                className="block text-[30px] sm:text-[36px] md:text-[44px]"
                style={{ color: "rgba(226,254,165,0.52)" }}
              >
                Residency
              </span>
            </h2>
          </div>

          {/* Description paragraphs */}
          <div
            className="flex flex-col gap-4 max-w-[340px] text-[#f8ffe8] text-[15px] leading-[1.32]"
            style={{ fontFamily: "'Funnel Sans', sans-serif" }}
          >
            <p>
              The Loops House Residency is a high-intensity, 5 day co-living and
              co-building program. It&apos;s designed for deep collaboration,
              removing the isolation of building and replacing it with a focused
              execution loop.
            </p>
            <p>
              Through technical sprints, peer feedback, and ecosystem
              mentorship, founders move faster from idea to validation together.
            </p>
          </div>

          {/* Cat mascot */}
          <div className="hidden lg:block flex-shrink-0 ml-auto">
            <div className="relative w-[200px] h-[200px] xl:w-[260px] xl:h-[260px]">
              <Image
                src="/landing/residency-cat.png"
                alt="Loops House cat mascot"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom cards row */}
      <div className="px-6 pb-8 sm:px-10 md:px-14 md:pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Photo card 1 */}
          <div className="relative h-[237px] rounded-[35px] overflow-hidden border-2 border-black">
            <Image
              src="/landing/residency-photos-1.png"
              alt="Builders collaborating at Loops House"
              fill
              className="object-cover"
            />
          </div>

          {/* High-Bandwidth Collaboration card */}
          <div className="relative h-[237px] rounded-[35px] overflow-hidden border-2 border-black bg-[#f8ffe8] p-6">
            <h3
              className="uppercase text-[#ff8717] text-[22px] sm:text-[25px] leading-[0.9]"
              style={{
                fontFamily: "'Pixelify Sans', sans-serif",
                fontWeight: 500,
              }}
            >
              High-Bandwidth Collaboration
            </h3>
            <p
              className="mt-3 text-[11px] text-black leading-[1.29]"
              style={{
                fontFamily: "'Funnel Sans', sans-serif",
                fontWeight: 300,
              }}
            >
              Building in isolation is a trap. Loops House brings the brightest
              minds into one room for 5 days of unfiltered growth. By combining
              Peer Feedback Loops with Ecosystem Mentorship, we eliminate the
              &ldquo;echo chamber&rdquo; effect. Founders receive no-BS
              critiques from fellow builders and direct guidance from industry
              leaders who move the needle.
            </p>
          </div>

          {/* From Prototype to Traction card */}
          <div className="relative h-[237px] rounded-[35px] overflow-hidden border-2 border-black bg-[#f8ffe8] p-6">
            <h3
              className="uppercase text-[#7360ff] text-[22px] sm:text-[25px] leading-[0.9]"
              style={{
                fontFamily: "'Pixelify Sans', sans-serif",
                fontWeight: 500,
              }}
            >
              From Prototype to Traction
            </h3>
            <p
              className="mt-3 text-[11px] text-black leading-[1.29]"
              style={{
                fontFamily: "'Funnel Sans', sans-serif",
                fontWeight: 300,
              }}
            >
              The hardest transition is moving from &ldquo;code that
              works&rdquo; to &ldquo;a product that scales.&rdquo; Through
              Rapid-fire Technical Sprints, we strip away the fluff to polish
              your core features and ensure technical hygiene. We don&apos;t
              just help you ship; we help you find the traction worth building
              for.
            </p>
          </div>

          {/* Photo card 2 */}
          <div className="relative h-[237px] rounded-[35px] overflow-hidden border-2 border-black">
            <Image
              src="/landing/residency-photos-2.png"
              alt="Builders working at Loops House"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
