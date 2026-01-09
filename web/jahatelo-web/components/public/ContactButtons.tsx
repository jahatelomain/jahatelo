'use client';

import { trackPhoneClick, trackWhatsAppClick } from '@/lib/analyticsService';

type ContactButtonsProps = {
  motelId: string;
  phone?: string | null;
  whatsapp?: string | null;
  variant?: 'horizontal' | 'vertical';
};

export default function ContactButtons({ motelId, phone, whatsapp, variant = 'horizontal' }: ContactButtonsProps) {
  const isVertical = variant === 'vertical';

  return (
    <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} gap-3`}>
      {phone && (
        <a
          href={`tel:${phone}`}
          onClick={() => trackPhoneClick(motelId, 'DETAIL')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
        >
          📞 Llamar
        </a>
      )}
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsAppClick(motelId, 'DETAIL')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
        >
          💬 WhatsApp
        </a>
      )}
    </div>
  );
}
