import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import RegisterMotelForm from '@/components/public/RegisterMotelForm';

export const metadata = {
  title: 'Registrar un motel - Jahatelo',
  description: 'Registrá tu motel en Jahatelo y empezá a recibir más clientes',
};

export default function RegistrarMotelPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Registrar un motel
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Completá los siguientes datos y nos contactaremos en la brevedad posible.
            </p>
          </div>

          {/* Form Component */}
          <RegisterMotelForm />
        </div>
      </div>
      <Footer />
    </>
  );
}
