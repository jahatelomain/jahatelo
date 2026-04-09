import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-[#0f0520] to-[#080110] overflow-hidden">
      {/* Glow decorativo */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-purple-700/15 rounded-full blur-3xl pointer-events-none" />

      {/* Borde superior animado */}
      <div className="navbar-gradient-border h-[2px] w-full absolute top-0 left-0" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
              Jahatelo
            </h3>
            <p className="text-purple-200/60 text-sm leading-relaxed">
              Encontrá tu motel ideal en minutos. La plataforma más completa para descubrir y comparar moteles en Paraguay.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Enlaces</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/', label: 'Inicio' },
                { href: '/search', label: 'Buscar moteles' },
                { href: '/soporte', label: 'Soporte' },
                { href: '/privacidad', label: 'Privacidad' },
                { href: '/terminos', label: 'Términos' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-purple-300/70 hover:text-purple-300 text-sm transition-colors hover:translate-x-1 inline-block">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Contacto</h4>
            <p className="text-purple-200/60 text-sm">
              ¿Tenés un motel y querés aparecer en Jahatelo?
            </p>
            <a
              href="mailto:contacto@jahatelo.com"
              className="inline-block mt-3 text-sm font-medium text-purple-400 hover:text-pink-400 transition-colors"
            >
              contacto@jahatelo.com
            </a>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-purple-900/40">
          <p className="text-center text-purple-400/40 text-xs">
            &copy; {currentYear} Jahatelo. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
