import fs from 'node:fs';
import path from 'node:path';
import opentype, { type Font, type Glyph } from 'opentype.js';

const FONT_SIZE = 15;
const ROBOTO_FONT_PATH = path.join(
  process.cwd(),
  'node_modules',
  '@fontsource',
  'roboto',
  'files',
  'roboto-latin-500-normal.woff',
);

let cachedFont: Font | null = null;

function markerFont() {
  if (cachedFont) return cachedFont;
  const buffer = fs.readFileSync(ROBOTO_FONT_PATH);
  cachedFont = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  return cachedFont;
}

function glyphAdvance(font: Font, glyph: Glyph) {
  return ((glyph.advanceWidth ?? font.unitsPerEm) / font.unitsPerEm) * FONT_SIZE;
}

/**
 * Convierte cada glifo a trazos SVG. El PNG final no depende de que Vercel,
 * iOS o Android tengan instalada una fuente concreta.
 */
export function markerLabelPath(label: string, baseline = 27) {
  const font = markerFont();
  const glyphs = Array.from(label, (character) => font.charToGlyph(character));
  const width = glyphs.reduce((total, glyph) => total + glyphAdvance(font, glyph), 0);
  let cursor = 0;
  let pathData = '';

  for (const glyph of glyphs) {
    pathData += glyph.getPath(cursor, baseline, FONT_SIZE).toPathData(2);
    cursor += glyphAdvance(font, glyph);
  }

  return { width, pathData };
}

