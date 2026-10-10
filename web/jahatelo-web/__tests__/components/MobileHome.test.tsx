import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MobileHome from '@/components/public/MobileHome';

jest.mock('@/components/public/MotelCard', () => function MockMotelCard() { return <div>Ficha de motel</div>; });

const cities = [{ name: 'Asunción', total: 9 }];

describe('MobileHome en pantallas angostas', () => {
  it('muestra Ver mapa como una tarjeta de bloque para que no se superponga con las otras', () => {
    render(<MobileHome featuredMotels={[]} cities={cities} />);
    expect(screen.getByRole('link', { name: /Ver mapa/i }).className.split(' ')).toContain('block');
  });

  it('respeta el margen interno del carrusel también cuando se activa el snap', () => {
    render(<MobileHome featuredMotels={[]} cities={cities} />);
    const carousel = screen.getByRole('heading', { name: 'Destacados' }).parentElement?.nextElementSibling;
    expect(carousel?.className.split(' ')).toContain('scroll-px-4');
  });

  it('no comprime los títulos de Por ciudad y Promos en columnas pequeñas', () => {
    render(<MobileHome featuredMotels={[]} cities={cities} />);
    for (const label of [/Por ciudad/i, /Promos/i]) {
      const card = screen.getByRole('link', { name: label });
      expect(card.querySelector('div.relative')?.className.split(' ')).toContain('flex-col');
      expect(card.querySelector('div.relative > svg')?.getAttribute('class')?.split(' ')).toContain('hidden');
    }
  });

  it('avisa cuando falla la carga de una ciudad y permite reintentar', async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn()
      .mockRejectedValueOnce(new Error('Sin conexión'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });
    global.fetch = fetchMock as unknown as typeof fetch;
    try {
      render(<MobileHome featuredMotels={[]} cities={cities} />);
      fireEvent.click(screen.getByRole('button', { name: /Asunción/i }));
      expect(await screen.findByText(/No se pudieron cargar los moteles/i)).not.toBeNull();
      expect(screen.queryByText('No hay moteles publicados en esta ciudad.')).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: /Intentar de nuevo/i }));
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
      expect(await screen.findByText('No hay moteles publicados en esta ciudad.')).not.toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
