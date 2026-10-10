// The server owns the canonical order and the number of ad slots. Never
// re-sort by commercial plan or advertising priority on the device.
export function resolveHomeSlides(slides, motels = [], ads = []) {
  if (!Array.isArray(slides)) return [];
  const motelById = new Map(motels.map((motel) => [motel.id, motel]));
  const adById = new Map(ads.map((ad) => [ad.id, ad]));
  return slides.flatMap((slide) => {
    const data = slide.kind === 'ad' ? adById.get(slide.id) : motelById.get(slide.id);
    return data ? [{ type: slide.kind === 'ad' ? 'ad' : 'promo', data }] : [];
  });
}
