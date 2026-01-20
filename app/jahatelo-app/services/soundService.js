import { Audio } from 'expo-av';
import { getSoundEffectsEnabled } from './preferencesService';

const sounds = {
  add: {
    source: require('../assets/sounds/addfavorito.wav'),
    instance: null,
  },
  remove: {
    source: require('../assets/sounds/removefavorito.wav'),
    instance: null,
  },
};

async function loadSound(key) {
  const soundEntry = sounds[key];
  if (!soundEntry || soundEntry.instance) return soundEntry?.instance || null;

  const { sound } = await Audio.Sound.createAsync(soundEntry.source, {
    shouldPlay: false,
  });
  soundEntry.instance = sound;
  return sound;
}

export async function playFavoriteSound(type) {
  const enabled = await getSoundEffectsEnabled();
  if (!enabled) return;

  try {
    const sound = await loadSound(type);
    if (!sound) return;
    await sound.replayAsync();
  } catch (error) {
    // Ignore audio errors to avoid blocking UI actions.
  }
}
