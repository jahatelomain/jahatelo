"use client";
import { motion } from "framer-motion";
import ParallaxImage from "../ParallaxImage";
import RevealText from "./RevealText";
import Link from "next/link";

const EASING = [0.22, 1, 0.36, 1] as const;

interface EditorialFeaturesProps {
  cities: { name: string; total: number }[];
  promosCount: number;
}

export default function EditorialFeatures({ cities, promosCount }: EditorialFeaturesProps) {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Statement */}
        <RevealText
          text="Explorá Paraguay como nunca antes"
          className="text-[5vw] font-bold leading-[1.1] tracking-tight text-neutral-950 mb-20 max-w-4xl"
        />

        {/* Asymmetric Grid */}
        <div className="grid grid-cols-12 gap-6 md:gap-8">
          {/* Row 1: 8+4 */}
          <div className="col-span-12 md:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1.2, ease: EASING }}
            >
              <ParallaxImage
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80&auto=format"
                alt="Motel boutique"
                className="rounded-2xl aspect-[4/3]"
              />
            </motion.div>
          </div>
          <div className="col-span-12 md:col-span-4 flex flex-col justify-center">
            <RevealText
              text="Moteles por ciudad"
              className="text-3xl font-bold text-neutral-950 mb-4"
              delay={0.2}
            />
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: EASING, delay: 0.4 }}
              className="text-neutral-600 mb-6"
            >
              {cities.length} ciudades con los mejores moteles de Paraguay
            </motion.p>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: EASING, delay: 0.6 }}
              className="h-px w-full bg-neutral-200 origin-left mb-6"
            />
            <Link
              href="/search"
              className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
            >
              Ver todas las ciudades →
            </Link>
          </div>

          {/* Row 2: 4+8 */}
          <div className="col-span-12 md:col-span-4 flex flex-col justify-center order-2 md:order-1">
            <RevealText
              text="Promos exclusivas"
              className="text-3xl font-bold text-neutral-950 mb-4"
            />
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: EASING, delay: 0.2 }}
              className="text-neutral-600 mb-6"
            >
              {promosCount > 0
                ? `${promosCount} ofertas activas ahora mismo`
                : "Ofertas especiales para vos"}
            </motion.p>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: EASING, delay: 0.4 }}
              className="h-px w-full bg-neutral-200 origin-left mb-6"
            />
            <Link
              href="/search?promos=1"
              className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
            >
              Ver promos →
            </Link>
          </div>
          <div className="col-span-12 md:col-span-8 order-1 md:order-2">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1.2, ease: EASING }}
            >
              <ParallaxImage
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80&auto=format"
                alt="Suite premium"
                className="rounded-2xl aspect-[4/3]"
              />
            </motion.div>
          </div>

          {/* Row 3: 6+6 */}
          <div className="col-span-12 md:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1.2, ease: EASING }}
            >
              <ParallaxImage
                src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80&auto=format"
                alt="Experiencia única"
                className="rounded-2xl aspect-square"
              />
            </motion.div>
          </div>
          <div className="col-span-12 md:col-span-6 flex flex-col justify-center">
            <RevealText
              text="Tu próxima experiencia empieza acá"
              className="text-3xl font-bold text-neutral-950 mb-4"
            />
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: EASING, delay: 0.2 }}
              className="text-neutral-600 mb-6"
            >
              Descubrí los moteles mejor calificados de Paraguay con fotos reales, precios transparentes y reservas instantáneas.
            </motion.p>
            <Link
              href="/mapa"
              className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
            >
              Explorar en el mapa →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}