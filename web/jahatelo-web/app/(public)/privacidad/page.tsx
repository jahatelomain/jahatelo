export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Política de Privacidad</h1>
          <p className="text-sm text-slate-600 mb-8">Última actualización: {new Date().toLocaleDateString('es-PY')}</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">1. Introducción</h2>
              <p className="text-slate-700 leading-relaxed">
                Jahatelo (&quot;nosotros&quot;, &quot;nuestro&quot; o &quot;la Plataforma&quot;) se compromete a proteger la privacidad de
                sus usuarios. Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos y
                protegemos su información personal de acuerdo con las leyes de protección de datos de Paraguay.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">2. Información que Recopilamos</h2>

              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">2.1 Información proporcionada por usted:</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li><strong>Registro de cuenta:</strong> nombre, correo electrónico, contraseña (encriptada)</li>
                <li><strong>Perfil:</strong> foto de perfil, preferencias, configuración</li>
                <li><strong>Contenido del usuario:</strong> reseñas, comentarios, favoritos</li>
                <li><strong>Información de contacto:</strong> teléfono, dirección (para moteles registrados)</li>
              </ul>

              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">2.2 Información recopilada automáticamente:</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li><strong>Datos de uso:</strong> páginas visitadas, clics, tiempo en la plataforma</li>
                <li><strong>Información del dispositivo:</strong> tipo de dispositivo, sistema operativo, navegador</li>
                <li><strong>Ubicación:</strong> ubicación aproximada basada en IP o GPS (con su permiso)</li>
                <li><strong>Cookies:</strong> identificadores únicos, preferencias (ver sección 7)</li>
              </ul>

              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">2.3 Información de terceros:</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li><strong>Redes sociales:</strong> si inicia sesión con Google/Facebook</li>
                <li><strong>Servicios de pago:</strong> MercadoPago (no almacenamos datos de tarjetas)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">3. Cómo Usamos su Información</h2>
              <p className="text-slate-700 leading-relaxed mb-4">Utilizamos su información para:</p>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li><strong>Proveer servicios:</strong> crear y gestionar su cuenta, procesar solicitudes</li>
                <li><strong>Personalización:</strong> recomendar moteles, mostrar favoritos, preferencias</li>
                <li><strong>Comunicación:</strong> notificaciones push, emails sobre actualizaciones</li>
                <li><strong>Seguridad:</strong> prevenir fraudes, proteger la plataforma</li>
                <li><strong>Análisis:</strong> mejorar funcionalidades, entender uso de la plataforma</li>
                <li><strong>Marketing:</strong> enviar promociones (con su consentimiento)</li>
                <li><strong>Legal:</strong> cumplir con obligaciones legales, resolver disputas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">4. Base Legal para el Procesamiento</h2>
              <p className="text-slate-700 leading-relaxed mb-4">Procesamos sus datos basándonos en:</p>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li><strong>Consentimiento:</strong> cuando acepta estos términos o da permiso explícito</li>
                <li><strong>Ejecución de contrato:</strong> para proveer los servicios solicitados</li>
                <li><strong>Interés legítimo:</strong> mejorar servicios, prevenir fraudes</li>
                <li><strong>Cumplimiento legal:</strong> cuando la ley lo requiere</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">5. Compartir Información</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                No vendemos su información personal. Compartimos datos limitados con:
              </p>

              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">5.1 Proveedores de servicios:</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li><strong>Hosting:</strong> Vercel (infraestructura web)</li>
                <li><strong>Base de datos:</strong> Neon/Vercel Postgres</li>
                <li><strong>Almacenamiento:</strong> Cloudinary (imágenes)</li>
                <li><strong>Notificaciones:</strong> Expo Push Notifications</li>
                <li><strong>Pagos:</strong> MercadoPago</li>
                <li><strong>Analytics:</strong> Google Analytics, Sentry (monitoreo de errores)</li>
              </ul>

              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">5.2 Otros usuarios:</h3>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li>Su nombre y foto de perfil son visibles en reseñas públicas</li>
                <li>Los moteles pueden ver contactos que usted proporciona</li>
              </ul>

              <h3 className="text-xl font-medium text-slate-800 mt-4 mb-2">5.3 Autoridades:</h3>
              <p className="text-slate-700 leading-relaxed">
                Si la ley lo requiere o para proteger nuestros derechos legales.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">6. Sus Derechos</h2>
              <p className="text-slate-700 leading-relaxed mb-4">Usted tiene derecho a:</p>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li><strong>Acceso:</strong> solicitar una copia de sus datos personales</li>
                <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos</li>
                <li><strong>Eliminación:</strong> solicitar borrado de su cuenta y datos</li>
                <li><strong>Portabilidad:</strong> recibir sus datos en formato estructurado</li>
                <li><strong>Oposición:</strong> objetar el procesamiento de sus datos</li>
                <li><strong>Restricción:</strong> limitar el uso de sus datos en ciertos casos</li>
                <li><strong>Retirar consentimiento:</strong> en cualquier momento</li>
              </ul>

              <p className="text-slate-700 leading-relaxed mt-4">
                Para ejercer estos derechos, contáctenos en: <strong>privacidad@jahatelo.com</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">7. Cookies y Tecnologías Similares</h2>
              <p className="text-slate-700 leading-relaxed mb-4">Usamos cookies para:</p>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li><strong>Esenciales:</strong> mantener sesión, seguridad (no se pueden deshabilitar)</li>
                <li><strong>Funcionales:</strong> recordar preferencias, idioma</li>
                <li><strong>Analytics:</strong> entender uso de la plataforma</li>
                <li><strong>Marketing:</strong> mostrar anuncios relevantes (con consentimiento)</li>
              </ul>

              <p className="text-slate-700 leading-relaxed mt-4">
                Puede gestionar cookies en la configuración de su navegador. Deshabilitar cookies esenciales
                puede afectar funcionalidades de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">8. Seguridad de Datos</h2>
              <p className="text-slate-700 leading-relaxed mb-4">Implementamos medidas de seguridad:</p>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li><strong>Encriptación:</strong> HTTPS/TLS para transmisión de datos</li>
                <li><strong>Contraseñas:</strong> hasheadas con bcrypt (irreversible)</li>
                <li><strong>Autenticación:</strong> JWT tokens con expiración</li>
                <li><strong>Rate limiting:</strong> protección contra ataques automatizados</li>
                <li><strong>Validación:</strong> sanitización de inputs del usuario</li>
                <li><strong>Acceso restringido:</strong> solo personal autorizado</li>
                <li><strong>Auditorías:</strong> logs de actividades sensibles</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">9. Retención de Datos</h2>
              <p className="text-slate-700 leading-relaxed">
                Conservamos sus datos mientras su cuenta esté activa o según sea necesario para:
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-2 mt-4">
                <li><strong>Cuentas activas:</strong> mientras use la plataforma</li>
                <li><strong>Cuentas eliminadas:</strong> 30 días (periodo de recuperación)</li>
                <li><strong>Datos de facturación:</strong> 5 años (requisito legal)</li>
                <li><strong>Logs de seguridad:</strong> 12 meses</li>
                <li><strong>Datos anonimizados:</strong> indefinidamente (analytics)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">10. Transferencias Internacionales</h2>
              <p className="text-slate-700 leading-relaxed">
                Algunos proveedores (Vercel, Cloudinary, Google) pueden almacenar datos en servidores fuera
                de Paraguay. Estos proveedores cumplen con estándares internacionales de protección de datos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">11. Menores de Edad</h2>
              <p className="text-slate-700 leading-relaxed">
                Nuestra plataforma está dirigida a personas mayores de 18 años. No recopilamos
                intencionalmente información de menores. Si descubrimos que hemos recopilado datos
                de un menor, los eliminaremos inmediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">12. Notificaciones Push</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Si usa nuestra app móvil, puede recibir notificaciones push sobre:
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li>Promociones de moteles (solo si está suscrito)</li>
                <li>Actualizaciones de seguridad</li>
                <li>Avisos de mantenimiento</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                Puede gestionar preferencias en: App → Perfil → Notificaciones
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">13. Cambios a esta Política</h2>
              <p className="text-slate-700 leading-relaxed">
                Podemos actualizar esta política periódicamente. Los cambios significativos serán notificados
                por email o mediante aviso en la plataforma. El uso continuado después de los cambios
                constituye su aceptación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">14. Contacto</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Para preguntas sobre esta política o ejercer sus derechos:
              </p>
              <ul className="list-none pl-0 text-slate-700 space-y-2">
                <li><strong>Email de Privacidad:</strong> privacidad@jahatelo.com</li>
                <li><strong>Email General:</strong> contacto@jahatelo.com</li>
                <li><strong>Teléfono:</strong> +595 XXX XXX XXX</li>
                <li><strong>Dirección:</strong> [Dirección física en Paraguay]</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">15. Autoridad de Control</h2>
              <p className="text-slate-700 leading-relaxed">
                Si considera que sus derechos de privacidad han sido violados, puede presentar una queja
                ante la autoridad de protección de datos de Paraguay.
              </p>
            </section>

            <section className="mt-12 pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Al usar Jahatelo, usted reconoce que ha leído y entendido esta Política de Privacidad.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
