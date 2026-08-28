import type { Metadata } from 'next';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import MobilePageHeader from '@/components/public/MobilePageHeader';

export const metadata: Metadata = {
  title: 'Eliminar cuenta y datos - Jahatelo',
  description: 'Pasos para solicitar la eliminación de una cuenta de Jahatelo o de datos específicos.',
  alternates: { canonical: 'https://jahatelo.com/eliminar-cuenta' },
};

const accountSubject = encodeURIComponent('Eliminación de cuenta Jahatelo');
const accountBody = encodeURIComponent(
  'Solicito eliminar mi cuenta de Jahatelo y los datos asociados.\n\nEmail o teléfono registrado:\nNombre:\n\nEntiendo que Jahatelo verificará mi identidad antes de procesar la solicitud.'
);
const dataSubject = encodeURIComponent('Eliminación de datos Jahatelo');
const dataBody = encodeURIComponent(
  'Solicito eliminar los siguientes datos de mi cuenta de Jahatelo:\n\nDatos a eliminar:\nEmail o teléfono registrado:\nNombre:\n\nEntiendo que Jahatelo verificará mi identidad antes de procesar la solicitud.'
);

export default function AccountDeletionPage() {
  return (
    <>
      <Navbar />
      <MobilePageHeader title="Eliminar cuenta y datos" />
      <main className="min-h-screen bg-slate-50 px-4 py-6 md:py-12">
        <article className="mx-auto max-w-4xl rounded-2xl bg-white p-5 shadow-sm md:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">Jahatelo</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Eliminación de cuenta y datos</h1>
          <p className="mt-4 leading-relaxed text-slate-700">
            Esta página permite a las personas usuarias de Jahatelo solicitar la eliminación completa de su cuenta
            o únicamente de determinados datos, tanto si usan la aplicación móvil como la web.
          </p>

          <section className="mt-9">
            <h2 className="text-2xl font-semibold text-slate-900">Solicitar la eliminación de la cuenta</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-slate-700">
              <li>Escribí desde el email registrado en Jahatelo a <strong>info@jahatelo.com</strong>.</li>
              <li>Usá el asunto <strong>“Eliminación de cuenta Jahatelo”</strong>.</li>
              <li>Indicá el email o teléfono asociado a la cuenta y tu nombre.</li>
              <li>Responderemos al medio registrado para verificar tu identidad. Nunca solicitaremos tu contraseña.</li>
              <li>Una vez verificada la solicitud, procesaremos la eliminación en un plazo máximo de 30 días.</li>
            </ol>
            <a
              href={`mailto:info@jahatelo.com?subject=${accountSubject}&body=${accountBody}`}
              className="mt-5 inline-flex rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
            >
              Solicitar eliminación de cuenta
            </a>
          </section>

          <section className="mt-9 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
            <h2 className="text-xl font-semibold text-slate-900">Datos que se eliminan con la cuenta</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
              <li>Perfil, nombre, email, teléfono, fotografía y credenciales de acceso.</li>
              <li>Favoritos, preferencias, tokens de notificación y dispositivos asociados.</li>
              <li>Reseñas, comentarios y demás contenido vinculado a la identidad de la cuenta.</li>
              <li>Datos de personalización y actividad directamente asociados al usuario.</li>
            </ul>
          </section>

          <section className="mt-9">
            <h2 className="text-xl font-semibold text-slate-900">Datos que pueden conservarse temporalmente</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
              <li>Copias de seguridad cifradas, hasta 90 días antes de su sobrescritura definitiva.</li>
              <li>Registros técnicos de seguridad y prevención de fraude, hasta 12 meses y sin mantener el perfil activo.</li>
              <li>Información que una obligación legal exija conservar, únicamente durante el plazo aplicable.</li>
              <li>Registros de auditoría desidentificados, sin nombre, email, teléfono ni credenciales de la cuenta eliminada.</li>
            </ul>
          </section>

          <section id="eliminar-datos" className="mt-10 scroll-mt-8 border-t border-slate-200 pt-9">
            <h2 className="text-2xl font-semibold text-slate-900">Eliminar datos sin cerrar la cuenta</h2>
            <p className="mt-3 leading-relaxed text-slate-700">
              También podés solicitar la eliminación de datos específicos y conservar tu cuenta. Indicá con claridad
              qué información querés borrar, por ejemplo reseñas, favoritos, historial, fotografía, teléfono, token de
              notificaciones u otros datos asociados.
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-slate-700">
              <li>Escribí desde el email registrado a <strong>info@jahatelo.com</strong>.</li>
              <li>Usá el asunto <strong>“Eliminación de datos Jahatelo”</strong>.</li>
              <li>Detallá los datos que querés eliminar.</li>
              <li>Verificaremos tu identidad y responderemos dentro de un plazo máximo de 30 días.</li>
            </ol>
            <a
              href={`mailto:info@jahatelo.com?subject=${dataSubject}&body=${dataBody}`}
              className="mt-5 inline-flex rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700"
            >
              Solicitar eliminación de datos
            </a>
          </section>

          <p className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
            Última actualización: 28 de agosto de 2026. Para consultas sobre privacidad: info@jahatelo.com.
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
