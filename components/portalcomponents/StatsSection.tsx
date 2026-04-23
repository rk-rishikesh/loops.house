import { funnelSans } from "@/app/fonts";

export function StatsSection() {
  return (
    <div
      id="activity"
      className="flex min-h-screen w-full items-center justify-center bg-[#F8FFE8] text-[#0f241c] md:h-screen md:items-stretch"
    >
      <div className="flex w-full max-w-7xl flex-col">
        <div className="relative flex flex-col items-center gap-6 md:top-[90px] md:flex-row md:items-start md:justify-between md:gap-16">
          {/* Left column */}
          <div className="flex flex-col items-center gap-6 text-center md:items-start md:gap-16 md:text-left">
            {/* Ideate / Build / Launch heading stack */}
            <div className="flex flex-col items-center gap-1 text-center sm:gap-2 md:flex-row md:items-baseline md:gap-6 md:text-left">
              <span
                className={`${funnelSans.className} font-bold leading-none tracking-[-0.04em] text-[84px] text-[#0F2C23] sm:text-[110px] md:text-[150px]`}
              >
                Shape.
              </span>
              <span
                className={`${funnelSans.className} font-bold leading-none tracking-[-0.04em] text-[84px] text-[#0F2C23CC] sm:text-[110px] md:text-[150px]`}
              >
                Your.
              </span>
              <span
                className={`${funnelSans.className} font-bold leading-none tracking-[-0.04em] text-[84px] text-[#0F2C2399] sm:text-[110px] md:text-[150px]`}
              >
                Ideas.
              </span>
            </div>

            {/* Cats row + desktop copy */}
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-10">
              <div className="flex flex-row items-center justify-center gap-6 md:justify-start">
                <div
                  className="border border-[#0F2C23]/20 text-center"
                  style={{
                    width: 260,
                    height: 260,
                    borderRadius: "9999px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <p
                    className={`${funnelSans.className} uppercase text-[#0F2C23]/75`}
                    style={{
                      fontSize: 22,
                      letterSpacing: "0.08em",
                      lineHeight: 1,
                    }}
                  >
                    Builders
                  </p>
                  <p
                    className={`${funnelSans.className} leading-none text-[#0F2C23]`}
                    style={{ fontSize: 88 }}
                  >
                    1085
                  </p>
                </div>
                <div
                  className="border border-[#0F2C23]/20 text-center"
                  style={{
                    width: 260,
                    height: 260,
                    borderRadius: "9999px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <p
                    className={`${funnelSans.className} uppercase text-[#0F2C23]/75`}
                    style={{
                      fontSize: 22,
                      letterSpacing: "0.08em",
                      lineHeight: 1,
                    }}
                  >
                    Projects
                  </p>
                  <p
                    className={`${funnelSans.className} leading-none text-[#0F2C23]`}
                    style={{ fontSize: 88 }}
                  >
                    67
                  </p>
                </div>
              </div>

              {/* Desktop text beside cats */}
              <div className="hidden max-w-md flex-col gap-3 md:flex left-72 top-24 relative">
                <h2
                  className={`${funnelSans.className} text-3xl font-semibold tracking-tight text-[#10271d]`}
                >
                  From idea to launch
                </h2>
                <p
                  className={`${funnelSans.className} text-lg leading-relaxed text-[#10271d]`}
                >
                  Start with raw ideas, prototype fast in Loops, and launch
                  updates to your community without losing momentum.
                </p>
              </div>
            </div>

            {/* Mobile text (Col 3 on small screens) */}
            <div className="mt-6 max-w-md text-center md:hidden">
              <h2
                className={`${funnelSans.className} text-2xl font-semibold tracking-tight text-[#10271d]`}
              >
                From idea to launch
              </h2>
              <p
                className={`${funnelSans.className} mt-3 text-base leading-relaxed text-[#10271d]`}
              >
                Ideate with other builders, turn concepts into live loops, and
                ship updates with Loops AI guiding every step.
              </p>
            </div>

            {/* <Link
              href="/login"
              className="inline-flex h-[44px] w-[160px] items-center justify-center"
            >
              <AnimatedButton
                text="Get Started"
                leftPadding={18}
                rightPadding={15}
                gap={10}
                height={44}
                fullWidth
              />
            </Link> */}
          </div>
        </div>
      </div>
    </div>
  );
}
