import sharp from 'sharp';
import { validateMediaDimensions } from '../specifications';

describe('validateMediaDimensions', () => {
  it('acepta una portada pequeña y devuelve solo una recomendación', async () => {
    const input = await sharp({ create: { width: 120, height: 80, channels: 3, background: '#822de2' } }).png().toBuffer();
    const result = await validateMediaDimensions(input, 'motel-photo');
    expect(result).toMatchObject({ valid: true, width: 120, height: 80 });
    if (result.valid) expect(result.warning).toContain('Se aceptó y será ajustada automáticamente');
  });

  it('acepta la portada 16:9 de 613×345 que el editor puede procesar', async () => {
    const input = await sharp({ create: { width: 613, height: 345, channels: 3, background: '#822de2' } }).png().toBuffer();
    await expect(validateMediaDimensions(input, 'motel-photo')).resolves.toMatchObject({ valid: true });
  });

  it('acepta un logo con resolución suficiente', async () => {
    const input = await sharp({ create: { width: 512, height: 512, channels: 3, background: '#ffffff' } }).png().toBuffer();
    await expect(validateMediaDimensions(input, 'motel-logo')).resolves.toMatchObject({ valid: true });
  });
});
