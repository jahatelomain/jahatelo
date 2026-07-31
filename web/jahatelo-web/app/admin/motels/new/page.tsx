import { Metadata } from 'next';
import MotelCaptureForm from '@/components/admin/MotelCaptureForm';

export const metadata: Metadata = {
  title: 'Nuevo Motel | Admin Jahatelo',
  description: 'Alta de un nuevo motel en Jahatelo',
};

export default function FormularioCapturaPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Motel</h1>
          <p className="text-gray-600 mt-2">
            Cargá la información esencial para crear el perfil del motel.
          </p>
          <p className="text-sm text-purple-600 mt-1">
            💡 Después de crear el motel, podrás subir las fotos desde el perfil del motel.
          </p>
        </div>

        <MotelCaptureForm />
      </div>
    </div>
  );
}
