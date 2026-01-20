import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_EFFECTS_KEY = 'jahatelo:soundEffectsEnabled';
const ADVERTISING_PUSH_KEY = 'jahatelo:advertisingPushEnabled';

let cachedSoundEnabled = null;
let cachedAdvertisingPushEnabled = null;

export async function getSoundEffectsEnabled() {
  if (cachedSoundEnabled !== null) return cachedSoundEnabled;
  try {
    const stored = await AsyncStorage.getItem(SOUND_EFFECTS_KEY);
    if (stored === null) {
      cachedSoundEnabled = true;
      return true;
    }
    cachedSoundEnabled = stored === 'true';
    return cachedSoundEnabled;
  } catch (error) {
    return true;
  }
}

export async function setSoundEffectsEnabled(enabled) {
  cachedSoundEnabled = !!enabled;
  try {
    await AsyncStorage.setItem(SOUND_EFFECTS_KEY, String(!!enabled));
  } catch (error) {
    // Ignore storage errors; keep in-memory value.
  }
}

export async function getAdvertisingPushEnabled() {
  if (cachedAdvertisingPushEnabled !== null) return cachedAdvertisingPushEnabled;
  try {
    const stored = await AsyncStorage.getItem(ADVERTISING_PUSH_KEY);
    if (stored === null) {
      cachedAdvertisingPushEnabled = true;
      return true;
    }
    cachedAdvertisingPushEnabled = stored === 'true';
    return cachedAdvertisingPushEnabled;
  } catch (error) {
    return true;
  }
}

export async function setAdvertisingPushEnabled(enabled) {
  cachedAdvertisingPushEnabled = !!enabled;
  try {
    await AsyncStorage.setItem(ADVERTISING_PUSH_KEY, String(!!enabled));
  } catch (error) {
    // Ignore storage errors; keep in-memory value.
  }
}
