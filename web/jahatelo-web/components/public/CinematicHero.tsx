"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import SearchBar from "./SearchBar";
import FeaturedCarousel from "./FeaturedCarousel";
import type { PublicMotelListItem } from "@/lib/domain/motels/publicListItem";

interface CinematicHeroProps {
  featuredMotels: PublicMotelListItem[];
}

const EASING = [0.22, 1, 0.36, 1] as const;

export default function CinematicHero({ featuredMotels }: CinematicHeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
  });

  const imageScale = useTransform(smoothProgress, [0, 1], [1, 1.15]);
  const textY = useTransform(smoothProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(smoothProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative h-screen min-h-[700px] w-full overflow-hidden bg-neutral-950"
    >
      {/* Background parallax image */}
      <motion.div
        style={{ scale: imageScale }}
        className="absolute inset-0 will-change-transform"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/20 to-neutral-950 z-10" />
        <img
          src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1920&q=80&auto=format"
          alt="Jahatelo hero"
          className="h-full w-full object-cover"
        />
      </motion.div>

      {/* Content layer */}
      <motion.div
        style={{ y: textY, opacity }}
        className="relative z-20 flex h-full flex-col items-center justify-center px-4 text-center"
      >
        <motion.span
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EASING, delay: 0.2 }}
          className="mb-6 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400"
        >
          La plataforma de moteles de Paraguay
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 120 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: EASING, delay: 0.4 }}
          className="mb-8 text-[12vw] font-bold leading-[0.9] tracking-tighter text-white md:text-[8vw]"
        >
          Encontrá tu<br />
          <span className="text-emerald-400">motel ideal</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EASING, delay: 0.7 }}
          className="w-full max-w-2xl"
        >
          <SearchBar />
        </motion.div>
      </motion.div>

      {/* Carousel overlay at bottom */}
      {featuredMotels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: EASING, delay: 1.0 }}
          className="absolute bottom-12 left-0 right-0 z-30 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-5xl mx-auto">
            <FeaturedCarousel featuredMotels={featuredMotels} />
          </div>
        </motion.div>
      )}

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
        className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">
            Scroll
          </span>
          <div className="h-8 w-px bg-gradient-to-b from-white/50 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}