import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent mb-4">
              Jahatelo
            </h3>
            <p className="text-gray-600 text-sm">
              Encuentra tu motel ideal en minutos. La plataforma más completa para descubrir y comparar moteles.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Enlaces</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-purple-600 text-sm transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/motels" className="text-gray-600 hover:text-purple-600 text-sm transition-colors">
                  Moteles
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Contacto</h4>
            <p className="text-gray-600 text-sm">
              ¿Tienes un motel y quieres aparecer en Jahatelo?
            </p>
            <p className="text-purple-600 text-sm font-medium mt-2">
              contacto@jahatelo.com
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500 text-sm">
            &copy; {currentYear} Jahatelo. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
