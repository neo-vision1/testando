import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadYoloModel, preprocess, postprocess, Detection } from '../services/yoloDetection';
import * as ort from 'onnxruntime-web';

interface YoloDetectionHook {
  isModelLoading: boolean;
  isModelLoaded: boolean;
  detections: Detection[];
  error: string | null;
  runDetection: (videoElement: HTMLVideoElement) => Promise<void>;
}

/**
 * Hook customizado para gerenciar o ciclo de vida e a execução da detecção de objetos YOLOv8.
 */
export const useYoloDetection = (): YoloDetectionHook => {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<ort.InferenceSession | null>(null);

  // 1. Carregamento do Modelo
  useEffect(() => {
    const loadModel = async () => {
      try {
        const session = await loadYoloModel();
        sessionRef.current = session;
        setIsModelLoaded(true);
      } catch (err) {
        setError('Falha ao carregar o modelo YOLOv8.');
        console.error(err);
      } finally {
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, []);

  // 2. Função de Execução da Detecção
  const runDetection = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!sessionRef.current || !isModelLoaded) {
      console.warn('Modelo não carregado ou em processo de carregamento.');
      return;
    }

    try {
      // 2.1. Pré-processamento
      const inputTensor = preprocess(videoElement);

      // 2.2. Inferência
      const feeds = { images: inputTensor };
      const results = await sessionRef.current.run(feeds);
      const outputTensor = results[sessionRef.current.outputNames[0]];

      // 2.3. Pós-processamento
      const newDetections = postprocess(
        outputTensor,
        videoElement.videoWidth,
        videoElement.videoHeight
      );

      setDetections(newDetections);
    } catch (err) {
      console.error('Erro durante a execução da detecção:', err);
      setError('Erro durante a execução da detecção.');
      setDetections([]);
    }
  }, [isModelLoaded]);

  return {
    isModelLoading,
    isModelLoaded,
    detections,
    error,
    runDetection,
  };
};
