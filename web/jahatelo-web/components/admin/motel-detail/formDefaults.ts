import type { DayRateForm } from './types';

export const COUNTRY_OPTIONS = [
  'Paraguay',
  'Argentina',
  'Peru',
  'Bolivia',
  'Chile',
  'Brasil',
] as const;

export const createEmptyDayRate = (): DayRateForm => ({
  price1h: '',
  price1_5h: '',
  price2h: '',
  price3h: '',
  price12h: '',
  price24h: '',
  priceNight: '',
});

export const createInitialPromoForm = () => ({
  title: '',
  description: '',
  imageUrl: '',
  isGlobal: false,
  hasPromoCode: false,
  codeRepeatRule: 'NEVER',
  codeLimit: '',
  codeLimitPeriod: 'UNLIMITED',
});

export type RoomForm = {
  name: string;
  description: string;
  price1h: string;
  price1_5h: string;
  price2h: string;
  price3h: string;
  price12h: string;
  price24h: string;
  priceNight: string;
  maxPersons: string;
  amenityIds: string[];
};

export const createInitialRoomForm = (): RoomForm => ({
  name: '',
  description: '',
  price1h: '',
  price1_5h: '',
  price2h: '',
  price3h: '',
  price12h: '',
  price24h: '',
  priceNight: '',
  maxPersons: '',
  amenityIds: [],
});
