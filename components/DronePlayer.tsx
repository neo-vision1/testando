import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScanEye, Loader2, AlertTriangle, Monitor } from 'lucide-react';

// Import TensorFlow.js and the pre-trained model
import '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

interface DronePlayerProps {
  playbackId: string;
  droneName: string;
}

const DronePlayer: React.FC<DronePlayerProps> = ({ playbackId, droneName }) => {
  const [isAiActive, setIsAiActive] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Refs
  const muxPlayerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const lastDetectTimeRef = useRef<number>(0);

  // 1. Load the Pre-trained Model (COCO-SSD)
  const loadModel = async () => {
    try {
      setIsModelLoading(true);
      setErrorMsg(null);
      
      const loadedModel = await cocoSsd.load({
        base: 'lite_mobilenet_v2' 
      });
      
      setModel(loadedModel);
      setIsModelLoading(false);
    } catch (err) {
      console.error("Erro ao carregar modelo:", err);
      setErrorMsg("Falha ao carregar IA");
      setIsModelLoading(false);
      setIsAiActive(false);
    }
  };

  const toggleAi = () => {
    if (!isAiActive && !model) {
      loadModel();
    }
    setIsAiActive(!isAiActive);
  };

  const detectFrame = useCallback(async () => {
    if (!model || !muxPlayerRef.current || !canvasRef.current || !isAiActive) return;

    const now = Date.now();
    if (now - lastDetectTimeRef.current < 100) {
      requestRef.current = requestAnimationFrame(detectFrame);
      return;
    }
    lastDetectTimeRef.current = now;

    const videoElement = muxPlayerRef.current.shadowRoot?.querySelector('video');

    if (!videoElement || videoElement.readyState < 3) { 
      requestRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayWidth = videoElement.clientWidth || videoElement.videoWidth;
    const displayHeight = videoElement.clientHeight || videoElement.videoHeight;

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
    
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    try {
      const predictions = await model.detect(videoElement);

      const scaleX = displayWidth / videoElement.videoWidth;
      const scaleY = displayHeight / videoElement.videoHeight;

      predictions.forEach((prediction) => {
        if (prediction.score < 0.5) return;

        const x = prediction.bbox[0] * scaleX;
        const y = prediction.bbox[1] * scaleY;
        const width = prediction.bbox[2] * scaleX;
        const height = prediction.bbox[3] * scaleY;

        const text = prediction.class.toUpperCase();
        const score = Math.round(prediction.score * 100) + '%';

        let strokeColor = '#00FF00'; 
        if (text === 'PERSON') strokeColor = '#FF0000'; 
        if (text === 'CAR' || text === 'TRUCK' || text === 'BUS') strokeColor = '#FFFF00'; 

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = strokeColor;
        const textWidth = ctx.measureText(text + ' ' + score).width;
        ctx.fillRect(x, y > 20 ? y - 20 : y, textWidth + 10, 20);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`${text} ${score}`, x + 5, y > 20 ? y - 5 : y + 15);
      });

    } catch (e) {
      // Ignorar erros momentâneos
    }

    requestRef.current = requestAnimationFrame(detectFrame);
  }, [model, isAiActive]);

  useEffect(() => {
    if (isAiActive && model) {
      requestRef.current = requestAnimationFrame(detectFrame);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isAiActive, model, detectFrame]);

  return (
    <div className="relative w-full h-full bg-black group overflow-hidden rounded-lg touch-none flex items-center justify-center">
      
      {/* Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-20 pointer-events-none"
      />

      {/* Overlay Info Superior */}
      <div className="absolute top-2 left-2 z-30 flex flex-col gap-1 max-w-[80%]">
        <div className="flex items-center gap-2">
            <div className="bg-black/60 backdrop-blur-sm text-green-400 px-2 py-1 rounded text-[10px] font-mono border border-green-900/50 flex items-center gap-2 shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">
            <span className="relative flex h-2 w-2 min-w-[8px]">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="hidden sm:inline">LIVE DVR |</span>
            <span className="text-slate-300">{playbackId.substring(0, 8)}...</span>
            </div>

            {/* Quality Indicator */}
            <div className="bg-blue-900/60 backdrop-blur-sm text-blue-200 px-2 py-1 rounded text-[10px] font-mono border border-blue-800/50 flex items-center gap-1 shadow-sm">
                <Monitor className="w-3 h-3" />
                <span className="font-bold">1080p</span>
            </div>
        </div>

        {/* AI Status Badge */}
        {isAiActive && (
          <div className="bg-red-950/80 backdrop-blur-sm text-red-400 px-2 py-1 rounded text-[10px] font-mono border border-red-900/50 flex items-center gap-2 animate-pulse whitespace-nowrap w-fit">
            <ScanEye className="w-3 h-3" />
            <span className="hidden sm:inline">AI DETECT:</span> {model ? 'ON' : 'LOAD'}
          </div>
        )}
      </div>

      <button
        onClick={toggleAi}
        disabled={isModelLoading}
        className={`
          absolute top-2 right-2 z-30 px-3 py-2 sm:py-1 rounded text-xs font-bold font-mono
          flex items-center gap-2 transition-all duration-200 border shadow-lg backdrop-blur-md
          active:scale-95 touch-manipulation
          ${isAiActive 
            ? 'bg-red-600/20 text-red-400 border-red-500 hover:bg-red-600/30' 
            : 'bg-slate-800/60 text-slate-300 border-slate-600 hover:bg-slate-700/80 hover:text-white'}
        `}
        title="Ativar Visão Computacional"
      >
        {isModelLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ScanEye className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">{isModelLoading ? 'INICIANDO...' : 'SV'}</span>
        <span className="sm:hidden">{isModelLoading ? '...' : 'SV'}</span>
      </button>

      {errorMsg && (
        <div className="absolute top-12 right-2 z-30 bg-red-900/90 text-white text-[10px] px-2 py-1 rounded border border-red-500 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {errorMsg}
        </div>
      )}
      
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
        plays-inline
        max-resolution="1080p" /* Hinting high res */
        crossOrigin="anonymous" 
        className="w-full h-full max-w-full max-h-full object-contain bg-black"
        style={{ aspectRatio: 'unset' }}
      />
    </div>
  );
};

export default React.memo(DronePlayer);