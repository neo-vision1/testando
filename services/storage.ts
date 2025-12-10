import { AllConfigs, StoredUser } from '../types';
import { 
  DEFAULT_PLAYBACK_ID_1, 
  DEFAULT_RTMP_KEY_1, 
  DEFAULT_PLAYBACK_ID_2, 
  DEFAULT_RTMP_KEY_2 
} from '../constants';

const USER_KEY = 'currentUser';
const CONFIG_KEY = 'droneConfigs';

export const saveUser = (user: StoredUser): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const loadUser = (): StoredUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (e) {
    console.error("Error loading user:", e);
    return null;
  }
};

export const clearUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
};

export const saveConfig = (config: AllConfigs): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
};

export const loadConfig = (): AllConfigs => {
  if (typeof window !== 'undefined') {
    try {
      const savedConfig = localStorage.getItem(CONFIG_KEY);
      if (savedConfig) {
        return JSON.parse(savedConfig) as AllConfigs;
      }
    } catch (e) {
      console.error("Error loading config:", e);
    }
  }
  
  // Default fallback
  return {
    drone1: { playbackId: DEFAULT_PLAYBACK_ID_1, rtmpKey: DEFAULT_RTMP_KEY_1 },
    drone2: { playbackId: DEFAULT_PLAYBACK_ID_2, rtmpKey: DEFAULT_RTMP_KEY_2 },
  };
};