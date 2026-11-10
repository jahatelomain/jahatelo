import { AudioPlayer } from 'expo-audio';
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

function getOrCreatePlayer(key) {
  const soundEntry = sounds[key];
  if (!soundEntry) return null;

  if (!soundEntry.instance) {
    // expo-audio: AudioPlayer acepta un asset ID directamente (require()).
    // keepAudioSessionActive evita interrumpir otro audio al reproducir efectos cortos.
    soundEntry.instance = new AudioPlayer(soundEntry.source, {
      keepAudioSessionActive: true,
    });
  }

  return soundEntry.instance;
}

export async function playFavoriteSound(type) {
  const enabled = await getSoundEffectsEnabled();
  if (!enabled) return;

  try {
    const player = getOrCreatePlayer(type);
    if (!player) return;

    // Reiniciar reproducción desde el inicio para efectos de sonido cortos.
    player.seekTo(0);
    player.play();
  } catch (_error) {
    // Ignorar errores de audio para no bloquear acciones de UI.
  }
}