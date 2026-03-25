"use client";

import Image from "next/image";
import { motion, type Transition } from "framer-motion";

const appearTransition: Transition = {
  type: "spring",
  stiffness: 60,
  damping: 22,
  mass: 0.95,
  bounce: 0.2,
};

export type AnimatedHeroCatProps = {
  src: string;
  alt?: string;
  width: number;
  height: number;
  className?: string;
};

export default function AnimatedHeroCat({
  src,
  alt = "",
  width,
  height,
  className,
}: AnimatedHeroCatProps) {
  return (
    <motion.div
      className="h-full w-full flex items-end justify-center"
      initial={{ y: 45, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={appearTransition}
      whileHover={{
        y: 10,
        transition: { type: "spring", stiffness: 260, damping: 22, mass: 0.9 },
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    </motion.div>
  );
}
