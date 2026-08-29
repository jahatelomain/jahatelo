import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import RegisterMotelForm from '@/components/public/RegisterMotelForm';
import MobilePageHeader from '@/components/public/MobilePageHeader';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com';

export const metadata = {
  title: 'Registrar un motel - Jahatelo',
  description: 'Registrá tu motel en Jahatelo y empezá a recibir más clientes',
  alternates: { canonical: `${BASE_URL}/registrar-motel` },
  openGraph: {
    title: 'Registrar un motel - Jahatelo',
    description: 'Publicá tu motel en Jahatelo y llegá a más clientes.',
    url: `${BASE_URL}/registrar-motel`,
    locale: 'es_PY',
    type: 'website',
  },
};

export default function RegistrarMotelPage() {
  return (
    <>
      <Navbar />
      <MobilePageHeader title="Registrar motel" />
      <main className="public-page px-4 py-7 md:px-0 md:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center md:mb-12">
            <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 md:mb-4 md:h-16 md:w-16">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 md:mb-3 md:text-4xl">
              Registrar un motel
            </h1>
            <p className="mx-auto max-w-xl text-base text-gray-600 md:text-lg">
              Completá los siguientes datos y nos contactaremos en la brevedad posible.
            </p>
          </div>

          {/* Form Component */}
          <RegisterMotelForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
