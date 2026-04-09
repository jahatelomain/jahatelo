import { Metadata } from 'next';
import { ReactNode } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com';

export const metadata: Metadata = {
  title: 'Contacto - Jahatelo',
  description: 'Contáctanos para cualquier consulta o sugerencia sobre nuestra plataforma',
  alternates: {
    canonical: `${BASE_URL}/contacto`,
  },
};

export default function ContactoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
