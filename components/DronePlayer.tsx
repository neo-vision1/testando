import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'mux-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'playback-id': string;
        'stream-type': string;
        'primary-color'?: string;
        'secondary-color'?: string;
        controls?: boolean;
        autoplay?: boolean;
        muted?: boolean;
        className?: string;
      };
    }
  }
}

interface DronePlayerProps {
  playbackId: string;
  droneName: string;
}

const DronePlayer: React.FC<DronePlayerProps> = ({ playbackId, droneName }) => {
  return (
    <div className="relative w-full h-full bg-black group">
      {/* Overlay Info */}
      <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm text-green-400 px-2 py-1 rounded text-[10px] font-mono border border-green-900/50 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        LIVE DVR
        <span className="text-slate-400">|</span>
        <span className="text-slate-300">{playbackId.substring(0, 8)}...</span>
      </div>
      
      {/* 
        Mux Player Setup 
        stream-type="live:dvr" is CRITICAL for the timeline/seek bar 
      */}
      <mux-player
        playback-id={playbackId}
        stream-type="live:dvr"
        primary-color="#3b82f6"
        secondary-color="#1e293b"
        controls
        autoplay
        muted
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default React.memo(DronePlayer);