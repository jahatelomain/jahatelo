export type HomeSlide = { kind: 'motel' | 'ad'; id: string };

const stableIds = (ids: string[]) => [...new Set(ids)].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);

const rotate = (slides: HomeSlide[], turn: bigint): HomeSlide[] => {
  if (slides.length === 0) return [];
  const index = Number(turn % BigInt(slides.length));
  return [...slides.slice(index), ...slides.slice(0, index)];
};

// turn is a global, monotonically increasing ticket starting at zero.
export function planPopupSlides(adIds: string[], turn: bigint): HomeSlide[] {
  return rotate(stableIds(adIds).map((id) => ({ kind: 'ad', id })), turn);
}

export function planFeaturedSlides(motelIds: string[], adIds: string[], turn: bigint): HomeSlide[] {
  const motels = stableIds(motelIds);
  const ads = stableIds(adIds);
  if (motels.length === 0 && ads.length === 0) return [];

  const adSlots = ads.length ? Math.max(1, Math.ceil(motels.length / 5)) : 0;
  const slideCount = motels.length + adSlots;
  const creativeCycle = turn / BigInt(slideCount);
  const slides: HomeSlide[] = [];
  motels.forEach((id, index) => {
    slides.push({ kind: 'motel', id });
    if (ads.length && ((index + 1) % 5 === 0 || index === motels.length - 1)) {
      const slot = Math.floor(index / 5);
      const adIndex = Number((creativeCycle + BigInt(slot)) % BigInt(ads.length));
      slides.push({ kind: 'ad', id: ads[adIndex] });
    }
  });
  if (motels.length === 0 && ads.length) {
    slides.push({ kind: 'ad', id: ads[Number(creativeCycle % BigInt(ads.length))] });
  }
  return rotate(slides, turn);
}
