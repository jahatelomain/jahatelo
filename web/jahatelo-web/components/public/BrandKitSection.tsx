"use client";

import { motion } from "framer-motion";

const EASING = [0.22, 1, 0.36, 1] as const;

export default function BrandKitSection() {
 return (
 <section className="bg-neutral-950 py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
 <div className="max-w-7xl mx-auto">
 <motion.div
 initial={{ opacity: 0, y: 80 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: "-10%" }}
 transition={{ duration: 1.4, ease: EASING }}
 className="mb-16"
 >
 <span className="text-emerald-400 text-sm font-semibold uppercase tracking-[0.2em] mb-4 block">
 Nuestra identidad
 </span>
 <h2 className="text-[5vw] font-bold leading-[1.1] tracking-tight text-white max-w-3xl">
 Diseñada para quienes<br />
 <span className="text-emerald-400">buscan más</span>
 </h2>
 </motion.div>

 {/* Mock UI Dark */}
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 whileInView={{ opacity: 1, scale: 1 }}
 viewport={{ once: true, margin: "-5%" }}
 transition={{ duration: 1.6, ease: EASING, delay: 0.2 }}
 className="relative rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12 backdrop-blur-sm"
 >
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 {/* Palette */}
 <div className="space-y-4">
 <h3 className="text-white font-semibold text-lg">Paleta</h3>
 <div className="flex gap-3">
 <div className="w-12 h-12 rounded-full bg-neutral-950 border border-white/20" title="neutral-950" />
 <div className="w-12 h-12 rounded-full bg-emerald-400" title="emerald-400" />
 <div className="w-12 h-12 rounded-full bg-emerald-500" title="emerald-500" />
 <div className="w-12 h-12 rounded-full bg-white" title="white" />
 </div>
 </div>

 {/* Tone */}
 <div className="space-y-4">
 <h3 className="text-white font-semibold text-lg">Tono</h3>
 <p className="text-neutral-400 text-sm leading-relaxed">
 Directo, respetuoso, sin juicios. Jahatelo habla como vos: claro, moderno y con confianza.
 </p>
 </div>

 {/* KV Visual */}
 <div className="space-y-4">
 <h3 className="text-white font-semibold text-lg">Estilo visual</h3>
 <div className="aspect-video rounded-lg bg-gradient-to-br from-emerald-500/20 to-neutral-900 border border-white/10 flex items-center justify-center">
 <span className="text-emerald-400/60 text-xs uppercase tracking-widest">Editorial · Cinematográfico</span>
 </div>
 </div>
 </div>
 </motion.div>
 </div>
 </section>
 );
}