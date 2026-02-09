import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';

export default function SupportPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-purple-600 to-purple-800">
          <div className="container mx-auto px-4 py-14 max-w-5xl text-white">
            <p className="text-sm uppercase tracking-widest text-purple-200">Centro de ayuda</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">Soporte Jahatelo</h1>
            <p className="mt-3 text-purple-100 max-w-2xl">
              Ayuda técnica, dudas de la app y problemas de acceso. Para consultas comerciales,
              usá la página de contacto.
            </p>
            <p className="mt-2 text-xs text-purple-200">
              Última actualización: {new Date().toLocaleDateString('es-PY')}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <h2 className="text-xl font-semibold text-slate-900">Preguntas frecuentes</h2>
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="font-medium text-slate-900">No recibo el código SMS</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Verificá la señal, esperá 60 segundos y solicitá el código nuevamente.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="font-medium text-slate-900">No encuentro moteles cercanos</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Asegurate de tener la ubicación activada y permisos habilitados en la app.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="font-medium text-slate-900">Quiero eliminar mi cuenta</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Escribinos desde el email registrado y te ayudamos.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="font-medium text-slate-900">Problemas con favoritos</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Cerrá sesión y volvé a iniciar. Si persiste, contactanos.
                    </p>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <h2 className="text-xl font-semibold text-slate-900">Soporte directo</h2>
                <p className="text-sm text-slate-600 mt-2">
                  Respondemos a la brevedad posible. Incluí modelo de teléfono y versión de la app si podés.
                </p>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <a
                    href="mailto:info@jahatelo.com"
                    className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-5 py-3 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    Escribir a soporte
                  </a>
                  <span className="text-sm text-slate-600">info@jahatelo.com</span>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900">Atajos útiles</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <a href="/contacto" className="text-purple-600 hover:text-purple-700 underline">
                      Contacto comercial
                    </a>
                  </li>
                  <li>
                    <a href="/terminos" className="text-purple-600 hover:text-purple-700 underline">
                      Términos y Condiciones
                    </a>
                  </li>
                  <li>
                    <a href="/privacidad" className="text-purple-600 hover:text-purple-700 underline">
                      Política de Privacidad
                    </a>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900">Recomendaciones</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li>Actualizá la app a la última versión.</li>
                  <li>Probá con Wi‑Fi y datos móviles.</li>
                  <li>Si hay un error, enviá captura de pantalla.</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
