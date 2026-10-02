"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export default function FullBleedImageBreak() {
 const ref = useRef<HTMLDivElement>(null);
 const { scrollYProgress } = useScroll({
 target: ref,
 offset: ["start end", "end start"],
 });

 const smoothProgress = useSpring(scrollYProgress, {
 stiffness: 50,
 damping: 20,
 });

 const y = useTransform(smoothProgress, [0, 1], ["-15%", "15%"]);

 return (
 <section ref={ref} className="relative h-[70vh] w-full overflow-hidden">
 <motion.div
 style={{ y }}
 className="absolute inset-[-20%] will-change-transform"
 >
 <img
 src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=80&auto=format"
 alt="Ambiente premium"
 className="h-full w-full object-cover"
 />
 </motion.div>
 <div className="absolute inset-0 bg-neutral-950/30" />
 </section>
 );
}