import React from 'react';

export interface SingleDroneConfig {
  playbackId: string;
  rtmpKey: string;
}

export interface AllConfigs {
  drone1: SingleDroneConfig;
  drone2: SingleDroneConfig;
}

export interface StoredUser {
  name: string;
  id: string;
}

export type ViewMode = 'alpha' | 'bravo' | 'multi';

export interface DroneDefinition {
  id: number;
  name: string;
  configKey?: keyof AllConfigs;
}

// Declaration for the Mux Player Web Component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'mux-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'playback-id': string;
        'stream-type': string;
        'primary-color'?: string;
        'secondary-color'?: string;
        controls?: boolean;
        autoplay?: boolean;
        muted?: boolean;
        className?: string;
      }, HTMLElement>;
    }
  }
}