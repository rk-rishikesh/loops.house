"use client";

import { useState } from "react";

const FD = "var(--font-funnel-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

const STEPS = [
  {
    number: "01",
    title: "Ideate",
    description:
      "Brainstorm and refine your project idea with AI-powered tools. Get feedback, explore possibilities, and shape your vision before writing a single line of code.",
  },
  {
    number: "02",
    title: "Build",
    description:
      "Ship your project with a team or solo. Use our AI agents to analyze code, generate documentation, and get real-time mentorship throughout your build.",
  },
  {
    number: "03",
    title: "Launch",
    description:
      "Submit to hackathons, get scored by AI judges, and showcase your work to the community. Every project gets a permanent home on Loops House.",
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section
      className="relative w-full rounded-[15px] overflow-hidden"
      style={{ backgroundColor: "#0F2C23", minHeight: 676 }}
    >
      <div className="relative px-[44px] py-[60px]" style={{ minHeight: 676 }}>
        {/* Title */}
        <h2
          className="font-extrabold not-italic"
          style={{
            fontFamily: FD,
            fontSize: "clamp(40px, 5vw, 70px)",
            lineHeight: "0.99",
            color: "#E2FEA5",
            maxWidth: 343,
          }}
        >
          HOW IT WORKS
        </h2>

        {/* Steps grid */}
        <div className="flex gap-0 mt-[80px]" style={{ marginLeft: 343 }}>
          {STEPS.map((step, idx) => (
            <div
              key={step.number}
              className="flex-1 cursor-pointer transition-opacity"
              style={{ opacity: activeStep === idx ? 1 : 0.7 }}
              onClick={() => setActiveStep(idx)}
            >
              {/* Step number */}
              <p
                className="font-bold"
                style={{
                  fontFamily: FD,
                  fontSize: 25,
                  lineHeight: "36px",
                  color: "#E2FEA5",
                  fontStyle: "normal",
                  fontWeight: 700,
                }}
              >
                {step.number}
              </p>

              {/* Step title */}
              <p
                className="font-bold mt-4"
                style={{
                  fontFamily: FD,
                  fontSize: 30,
                  lineHeight: "36px",
                  color: "#E2FEA5",
                  fontStyle: "normal",
                  fontWeight: 700,
                }}
              >
                {step.title}
              </p>

              {/* Step description */}
              <p
                className="mt-4"
                style={{
                  fontFamily: FN,
                  fontSize: 19,
                  lineHeight: "19.2px",
                  color: "#F8FFE8",
                  maxWidth: 292,
                  letterSpacing: "0.16px",
                }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-4 mt-[60px]" style={{ marginLeft: 343 }}>
          <button
            type="button"
            onClick={() => setActiveStep((p) => Math.max(0, p - 1))}
            className="inline-flex items-center justify-center rounded-full cursor-pointer transition-colors hover:opacity-90"
            style={{
              backgroundColor: "#E2FEA5",
              border: "1px solid #0F2C23",
              height: 51,
              width: 211,
            }}
          >
            <span
              className="font-bold text-center tracking-[0.32px]"
              style={{
                fontFamily: FD,
                fontSize: 15,
                color: "#0F2C23",
                fontStyle: "normal",
                fontWeight: 700,
              }}
            >
              PREVIOUS
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep((p) => Math.min(STEPS.length - 1, p + 1))}
            className="inline-flex items-center justify-center rounded-full cursor-pointer transition-colors hover:opacity-90"
            style={{
              border: "1px solid #E2FEA5",
              backgroundColor: "transparent",
              height: 51,
              width: 211,
            }}
          >
            <span
              className="font-bold text-center tracking-[0.32px]"
              style={{
                fontFamily: FD,
                fontSize: 15,
                color: "#E2FEA5",
                fontStyle: "normal",
                fontWeight: 700,
              }}
            >
              NEXT
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
