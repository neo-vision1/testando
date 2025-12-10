import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useYoloDetection } from '../hooks/useYoloDetection';
import { drawBoxes } from '../services/yoloDetection';

// Fix: Add explicit type definition for the custom element 'mux-player'
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'mux-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'playback-id'?: string;
        'stream-type'?: string;
        'primary-color'?: string;
        'secondary-color'?: string;
        controls?: boolean;
        autoplay?: boolean;
        muted?: boolean;
        ref?: React.Ref<any>; // Adicionando ref para o mux-player
      };
    }
  }
}

interface DronePlayerProps {
  playbackId: string;
  droneName: string;
}

const DronePlayer: React.FC<DronePlayerProps> = ({ playbackId, droneName }) => {
  const muxPlayerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetectionActive, setIsDetectionActive] = useState(false);
  const { isModelLoaded, isModelLoading, detections, runDetection } = useYoloDetection();

  // Função para obter o elemento de vídeo real dentro do mux-player
  const getVideoElement = useCallback((): HTMLVideoElement | null => {
    if (muxPlayerRef.current) {
      // O mux-player geralmente expõe o elemento de vídeo internamente
      // ou podemos tentar acessar o shadow DOM
      const videoElement = muxPlayerRef.current.shadowRoot?.querySelector('video') || muxPlayerRef.current;
      if (videoElement instanceof HTMLVideoElement) {
        return videoElement;
      }
    }
    return null;
  }, []);

  // Loop de detecção e desenho
  useEffect(() => {
    let animationFrameId: number;

    const detectAndDraw = async () => {
      const videoElement = getVideoElement();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (isDetectionActive && isModelLoaded && videoElement && ctx && videoElement.readyState >= 2) {
        // 1. Executa a detecção
        await runDetection(videoElement);

        // 2. Desenha as caixas no canvas
        // Garante que o canvas tenha o mesmo tamanho do vídeo
        if (canvas!.width !== videoElement.videoWidth || canvas!.height !== videoElement.videoHeight) {
          canvas!.width = videoElement.videoWidth;
          canvas!.height = videoElement.videoHeight;
        }
        
        // A função drawBoxes já usa as detecções do hook, mas vamos garantir que o desenho ocorra
        // após a atualização do estado `detections`
        drawBoxes(ctx!, detections);
      } else if (!isDetectionActive && canvas && ctx) {
        // Limpa o canvas quando a detecção é desativada
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(detectAndDraw);
    };

    if (isDetectionActive && isModelLoaded) {
      // Inicia o loop
      detectAndDraw();
    } else if (!isDetectionActive && canvasRef.current) {
      // Limpa o canvas ao desativar
      canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDetectionActive, isModelLoaded, runDetection, detections, getVideoElement]);

  const toggleDetection = () => {
    if (isModelLoading) return; // Não permite toggle enquanto carrega
    setIsDetectionActive(prev => !prev);
  };

  const svButtonText = isModelLoading ? 'Carregando...' : isDetectionActive ? 'SV ON' : 'SV OFF';
  const svButtonClass = isDetectionActive 
    ? 'bg-red-600 hover:bg-red-700' 
    : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="relative w-full h-full bg-black group">
      
      {/* Logo in Top-Left Corner */}
      <img 
        src="/neo_logo.png" 
        alt="NeO Logo" 
        className="absolute top-2 left-2 z-20 h-8" // Tamanho ajustado para 8 unidades de altura
      />
      
      {/* Botão SV e Overlay Info (Movido para Top-Right) */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        {/* Botão SV */}
        <button
          onClick={toggleDetection}
          disabled={isModelLoading}
          className={`px-2 py-1 rounded text-[10px] font-mono text-white transition-colors ${svButtonClass} disabled:opacity-50`}
        >
          {svButtonText}
        </button>

        {/* Overlay Info */}
        <div className="bg-black/60 backdrop-blur-sm text-green-400 px-2 py-1 rounded text-[10px] font-mono border border-green-900/50 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          LIVE DVR
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">{playbackId.substring(0, 8)}...</span>
        </div>
      </div>
      
      {/* Canvas Overlay para Detecção */}
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none" 
      />

      {/* 
        Mux Player Setup 
        stream-type="live:dvr" is CRITICAL for the timeline/seek bar 
      */}
      {/* @ts-ignore */}
      <mux-player
        ref={muxPlayerRef}
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
