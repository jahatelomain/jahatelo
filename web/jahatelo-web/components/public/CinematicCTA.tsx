"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const EASING = [0.22, 1, 0.36, 1] as const;

export default function CinematicCTA() {
  return (
    <section className="bg-white py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.4, ease: EASING }}
          className="text-[8vw] font-bold leading-[0.95] tracking-tighter text-neutral-950 mb-12"
        >
          ¿Listo para<br />
          <span className="text-emerald-500">tu próxima visita?</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASING, delay: 0.3 }}
        >
          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-10 py-5 text-lg font-semibold text-white hover:bg-emerald-400 transition-colors duration-300"
          >
            Explorar moteles
          </Link>
        </motion.div>
      </div>
    </section>
  );
}