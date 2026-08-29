import sharp from 'sharp';
import { validateMediaDimensions } from '../specifications';

describe('validateMediaDimensions', () => {
  it('rechaza una portada demasiado pequeña con un mensaje accionable', async () => {
    const input = await sharp({ create: { width: 600, height: 400, channels: 3, background: '#822de2' } }).png().toBuffer();
    const result = await validateMediaDimensions(input, 'motel-photo');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain('1200×800px');
  });

  it('acepta un logo con resolución suficiente', async () => {
    const input = await sharp({ create: { width: 512, height: 512, channels: 3, background: '#ffffff' } }).png().toBuffer();
    await expect(validateMediaDimensions(input, 'motel-logo')).resolves.toMatchObject({ valid: true });
  });
});
