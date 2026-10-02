"use client";
import { motion } from "framer-motion";

const EASING = [0.22, 1, 0.36, 1] as const;

interface RevealTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export default function RevealText({ text, className = "", delay = 0 }: RevealTextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 120 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 1.4, ease: EASING, delay }}
      className={className}
    >
      {text}
    </motion.div>
  );
}