"use client";

import Image from "next/image";
import { useState } from "react";

const FN = "var(--font-funnel-sans), sans-serif";
const FD = "var(--font-funnel-sans), sans-serif";

const FAQS = [
  {
    question: "Who is this for?",
    answer:
      "Loops House is for developers, designers, and builders who want a permanent home for their projects. Whether you're a solo hacker or part of a team, you can build, showcase, and grow here.",
  },
  {
    question: "What is Loops?",
    answer:
      "Loops is an AI-native developer platform where you can build projects, join hackathons, and get AI-powered feedback on your code and ideas.",
  },
  {
    question: "What is the Active Score?",
    answer:
      "The Active Score is a metric that tracks how engaged and active your project is. It considers commits, hackathon submissions, team activity, and community engagement.",
  },
  {
    question: "What happens at Loops House?",
    answer:
      "Loops House hosts hackathons, builder residencies, and community events. It's where projects go from idea to launch with mentorship, tools, and a supportive ecosystem.",
  },
];

function FaqCard({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-start gap-[24px] rounded-[40px] p-[30px_54px] text-left cursor-pointer border-none transition-all"
      style={{ backgroundColor: "#F8FFE8" }}
    >
      <div className="shrink-0 mt-[2px]">
        <Image
          src="/landing/faq-plus.png"
          alt=""
          width={50}
          height={50}
          className="object-contain"
          style={{
            transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </div>
      <div className="flex-1">
        <p
          className="font-semibold"
          style={{
            fontFamily: FN,
            fontSize: 24,
            lineHeight: "32px",
            color: "#0F2C23",
            fontStyle: "normal",
            fontWeight: 600,
          }}
        >
          {question}
        </p>
        {isOpen && (
          <p
            className="mt-3"
            style={{
              fontFamily: FN,
              fontSize: 16,
              lineHeight: "22px",
              color: "rgba(15,44,35,0.7)",
            }}
          >
            {answer}
          </p>
        )}
      </div>
    </button>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className="relative w-full rounded-[15px] overflow-hidden"
      style={{ backgroundColor: "#0F2C23", minHeight: 694 }}
    >
      <div className="relative px-[224px] py-[60px]">
        {/* Title */}
        <h2
          className="font-extrabold not-italic text-center mb-[60px]"
          style={{
            fontFamily: FD,
            fontSize: "clamp(50px, 6.6vw, 95px)",
            lineHeight: "1.38",
            color: "#E2FEA5",
            letterSpacing: "-0.05px",
          }}
        >
          GOT SOME FAQ
        </h2>

        {/* FAQ grid - 2x2 */}
        <div className="grid grid-cols-2 gap-[20px]">
          {FAQS.map((faq, idx) => (
            <FaqCard
              key={idx}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === idx}
              onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
