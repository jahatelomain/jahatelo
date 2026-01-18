export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Términos y Condiciones</h1>
          <p className="text-sm text-slate-600 mb-8">Última actualización: {new Date().toLocaleDateString('es-PY')}</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">1. Aceptación de los Términos</h2>
              <p className="text-slate-700 leading-relaxed">
                Al acceder y utilizar Jahatelo (&quot;la Plataforma&quot;), usted acepta estar sujeto a estos Términos y Condiciones.
                Si no está de acuerdo con alguna parte de estos términos, no debe usar nuestros servicios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">2. Descripción del Servicio</h2>
              <p className="text-slate-700 leading-relaxed">
                Jahatelo es una plataforma digital que conecta a usuarios con moteles en Paraguay, facilitando la búsqueda,
                consulta de información y servicios relacionados. No somos propietarios ni operadores de los establecimientos listados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">3. Registro y Cuenta de Usuario</h2>
              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">3.1 Requisitos</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li>Debe ser mayor de 18 años para crear una cuenta</li>
                <li>Debe proporcionar información veraz y actualizada</li>
                <li>Es responsable de mantener la confidencialidad de su contraseña</li>
                <li>Es responsable de todas las actividades realizadas bajo su cuenta</li>
              </ul>

              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">3.2 Tipos de Cuenta</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li><strong>Usuario:</strong> Acceso a búsqueda, favoritos, reseñas</li>
                <li><strong>Motel Admin:</strong> Gestión de establecimiento registrado</li>
                <li><strong>Super Admin:</strong> Administración de la plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">4. Uso Aceptable</h2>
              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">4.1 Usted se compromete a:</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li>Utilizar la plataforma de forma legal y apropiada</li>
                <li>No publicar contenido ofensivo, difamatorio o ilegal</li>
                <li>Respetar los derechos de propiedad intelectual</li>
                <li>No intentar acceder a áreas restringidas del sistema</li>
                <li>Proporcionar reseñas honestas basadas en experiencias reales</li>
              </ul>

              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">4.2 Prohibiciones:</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li>Uso automatizado (bots, scrapers) sin autorización</li>
                <li>Recopilación de datos de otros usuarios</li>
                <li>Suplantación de identidad</li>
                <li>Difusión de malware o contenido malicioso</li>
                <li>Manipulación de reseñas o calificaciones</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">5. Contenido del Usuario</h2>
              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">5.1 Reseñas y Comentarios</h3>
              <p className="text-slate-700 leading-relaxed">
                Al publicar reseñas, comentarios o cualquier contenido en la plataforma, usted otorga a Jahatelo
                una licencia no exclusiva, perpetua, irrevocable y libre de regalías para usar, reproducir,
                modificar y distribuir dicho contenido.
              </p>

              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">5.2 Moderación</h3>
              <p className="text-slate-700 leading-relaxed">
                Nos reservamos el derecho de revisar, editar o eliminar cualquier contenido que viole estos
                términos o que consideremos inapropiado, sin previo aviso.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">6. Registro de Moteles</h2>
              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">6.1 Proceso de Aprobación</h3>
              <p className="text-slate-700 leading-relaxed">
                Los establecimientos que deseen registrarse deben completar el formulario de registro.
                Jahatelo se reserva el derecho de aprobar o rechazar solicitudes a su discreción.
              </p>

              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">6.2 Responsabilidades del Motel</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li>Mantener información actualizada y precisa</li>
                <li>Cumplir con todas las leyes y regulaciones locales</li>
                <li>Responder a consultas de usuarios de forma oportuna</li>
                <li>Pagar las tarifas acordadas según el plan seleccionado</li>
              </ul>

              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">6.3 Planes y Pagos</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li><strong>FREE:</strong> Listado básico con acceso limitado</li>
                <li><strong>BASIC:</strong> Listado estándar con funcionalidades esenciales</li>
                <li><strong>GOLD:</strong> Visibilidad mejorada con funciones adicionales</li>
                <li><strong>DIAMOND:</strong> Máxima visibilidad y beneficios avanzados</li>
                <li>Los pagos son mensuales y no reembolsables</li>
                <li>Las cancelaciones surten efecto al final del período pagado</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">7. Propiedad Intelectual</h2>
              <p className="text-slate-700 leading-relaxed">
                Todo el contenido de la plataforma, incluyendo pero no limitado a diseño, logos, texto, gráficos,
                código fuente y funcionalidad, es propiedad de Jahatelo o sus licenciantes y está protegido por
                las leyes de propiedad intelectual de Paraguay.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">8. Limitación de Responsabilidad</h2>
              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">8.1 Información de Terceros</h3>
              <p className="text-slate-700 leading-relaxed">
                La información sobre moteles es proporcionada por los establecimientos. No garantizamos la
                exactitud, integridad o actualidad de dicha información.
              </p>

              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">8.2 Exclusión de Garantías</h3>
              <p className="text-slate-700 leading-relaxed">
                La plataforma se proporciona &quot;tal cual&quot; y &quot;según disponibilidad&quot;. No garantizamos que el servicio
                será ininterrumpido, seguro o libre de errores.
              </p>

              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">8.3 Límite de Daños</h3>
              <p className="text-slate-700 leading-relaxed">
                Jahatelo no será responsable por daños indirectos, incidentales, especiales, consecuentes o
                punitivos relacionados con el uso de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">9. Privacidad y Datos Personales</h2>
              <p className="text-slate-700 leading-relaxed">
                El uso de sus datos personales se rige por nuestra{' '}
                <a href="/privacidad" className="text-purple-600 hover:text-purple-700 underline">
                  Política de Privacidad
                </a>
                , que forma parte integral de estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">10. Suspensión y Terminación</h2>
              <p className="text-slate-700 leading-relaxed">
                Podemos suspender o terminar su acceso a la plataforma inmediatamente, sin previo aviso,
                por cualquier motivo, incluyendo pero no limitado a violación de estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">11. Modificaciones</h2>
              <p className="text-slate-700 leading-relaxed">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios
                serán efectivos inmediatamente después de su publicación. El uso continuado de la plataforma
                después de los cambios constituye su aceptación de los nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">12. Ley Aplicable y Jurisdicción</h2>
              <p className="text-slate-700 leading-relaxed">
                Estos términos se rigen por las leyes de la República del Paraguay. Cualquier disputa será
                resuelta en los tribunales competentes de Asunción, Paraguay.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">13. Contacto</h2>
              <p className="text-slate-700 leading-relaxed">
                Para preguntas sobre estos términos, contáctenos:
              </p>
              <ul className="list-none pl-0 text-slate-700 space-y-2 mt-4">
                <li><strong>Email:</strong> legal@jahatelo.com</li>
                <li><strong>Teléfono:</strong> +595 XXX XXX XXX</li>
                <li><strong>Dirección:</strong> [Dirección física en Paraguay]</li>
              </ul>
            </section>

            <section className="mt-12 pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Al usar Jahatelo, usted reconoce que ha leído, entendido y acepta estar sujeto a estos
                Términos y Condiciones.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
