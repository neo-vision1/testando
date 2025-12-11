export interface SingleDroneConfig {
  playbackId: string;
  rtmpKey: string;
}

export interface AllConfigs {
  drone1: SingleDroneConfig;
  drone2: SingleDroneConfig;
  theme: 'light' | 'dark';
}

export interface StoredUser {
  name: string; // Será o email no caso do Supabase
  id: string;
}

export interface CloudConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export type ViewMode = 'alpha' | 'bravo' | 'multi';

export interface DroneDefinition {
  id: number;
  name: string;
  configKey?: keyof AllConfigs;
}