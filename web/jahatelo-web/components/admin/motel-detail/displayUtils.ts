const normalizePlan = (plan: string | null | undefined) =>
  (plan || 'BASIC').toUpperCase();

export const formatPrice = (price: number | null | undefined) =>
  (typeof price === 'number' ? price : 0).toLocaleString();

export const getPlanLabel = (plan: string | null | undefined) => {
  const normalized = normalizePlan(plan);
  if (normalized === 'GOLD') return 'Gold';
  if (normalized === 'DIAMOND') return 'Diamond';
  if (normalized === 'FREE') return 'Free';
  return 'Básico';
};

export const getPlanPromoLimit = (plan: string | null | undefined) => {
  const normalized = normalizePlan(plan);
  if (normalized === 'GOLD') return 3;
  if (normalized === 'DIAMOND') return Number.POSITIVE_INFINITY;
  return 1;
};

export const getPlanRoomPhotoLimit = (plan: string | null | undefined) => {
  return getPublishedRoomPhotoLimit(plan);
};

export const formatLimit = (limit: number) =>
  Number.isFinite(limit) ? `${limit}` : 'Ilimitadas';

export const sortByExplicitOrder = <T extends { id: string; order?: number; name: string }>(
  items: T[],
  orderedIds: string[],
) => {
  const explicitOrder = new Map(orderedIds.map((id, index) => [id, index]));
  return [...items].sort((left, right) => {
    const leftIndex = explicitOrder.get(left.id);
    const rightIndex = explicitOrder.get(right.id);
    if (leftIndex !== undefined && rightIndex !== undefined) return leftIndex - rightIndex;
    if (leftIndex !== undefined) return -1;
    if (rightIndex !== undefined) return 1;
    return (left.order ?? 0) - (right.order ?? 0) || left.name.localeCompare(right.name);
  });
};
import { getPublishedRoomPhotoLimit } from '@/lib/domain/motels/roomPhotoLimits';
