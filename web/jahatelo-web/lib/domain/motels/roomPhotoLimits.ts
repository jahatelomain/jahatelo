export const MAX_STORED_ROOM_PHOTOS = 10;

export const getPublishedRoomPhotoLimit = (plan: string | null | undefined) => {
  switch ((plan || 'BASIC').toUpperCase()) {
    case 'GOLD':
      return 3;
    case 'DIAMOND':
      return MAX_STORED_ROOM_PHOTOS;
    default:
      return 1;
  }
};
