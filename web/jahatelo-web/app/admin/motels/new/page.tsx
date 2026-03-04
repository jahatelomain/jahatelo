import { Metadata } from 'next';
import MotelCaptureForm from '@/components/admin/MotelCaptureForm';

export const metadata: Metadata = {
  title: 'Formulario de Captura de Motel | Admin Jahatelo',
  description: 'Formulario completo para dar de alta un nuevo motel en Jahatelo',
};

export default function FormularioCapturaPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Motel - Formulario de Captura</h1>
          <p className="text-gray-600 mt-2">
            Completa toda la información del motel. Los datos se guardan automáticamente cada 30 segundos.
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
