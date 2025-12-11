import React, { useState, useEffect } from 'react';
import { AllConfigs, DroneDefinition } from '../types';
import CopyButton from './CopyButton';

interface ConfigFormProps {
  drone: DroneDefinition;
  config: AllConfigs;
  isExpanded: boolean;
  onToggle: (key: string) => void;
  onSave: (key: keyof AllConfigs, playbackId: string, rtmpKey: string) => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ drone, config, isExpanded, onToggle, onSave }) => {
  // We know drone.configKey exists if this component is used for configurable drones
  const key = drone.configKey as keyof AllConfigs;
  
  // Safe access with fallback in case of type mismatch during development
  const currentConfig = (config[key] as any) || { playbackId: '', rtmpKey: '' };

  const [tempPlaybackId, setTempPlaybackId] = useState(currentConfig.playbackId);
  const [tempRtmpKey, setTempRtmpKey] = useState(currentConfig.rtmpKey);

  useEffect(() => {
    setTempPlaybackId(currentConfig.playbackId);
    setTempRtmpKey(currentConfig.rtmpKey);
  }, [currentConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(key, tempPlaybackId, tempRtmpKey);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900/50 mb-3 transition-all duration-300 shadow-sm">
      <button 
        onClick={() => onToggle(key)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`text-sm ${isExpanded ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{drone.name}</span>
        </div>
        <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
          {currentConfig.playbackId ? `${currentConfig.playbackId.substring(0, 12)}...` : 'Não configurado'}
        </span>
      </button>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/80 animate-in fade-in slide-in-from-top-2">
          
          <div className="mb-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded p-3 text-sm text-blue-700 dark:text-blue-200">
            <h5 className="font-bold mb-1 flex items-center gap-2">
              📡 Instruções de Streaming
            </h5>
            <p className="text-blue-600/80 dark:text-blue-300/80 text-xs">Configure seu software de transmissão (OBS, vMix) com os dados abaixo.</p>
          </div>

          <div className="space-y-4">
            {/* Stream Key Input */}
            <div>
              <label className="block text-xs uppercase text-slate-500 dark:text-slate-400 font-bold mb-1 ml-1">Chave de Stream (RTMP Key)</label>
              <div className="flex rounded-md shadow-sm overflow-hidden border border-slate-300 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <input
                  type="text"
                  value={tempRtmpKey}
                  onChange={(e) => setTempRtmpKey(e.target.value)}
                  className="flex-1 block w-full bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
                  placeholder="Cole a Stream Key"
                />
                <CopyButton textToCopy={tempRtmpKey} label="Key" />
              </div>
            </div>

            <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-2"></div>

            {/* Playback ID Input */}
            <div>
              <label className="block text-xs uppercase text-slate-500 dark:text-slate-400 font-bold mb-1 ml-1">ID de Reprodução</label>
              <div className="flex rounded-md shadow-sm overflow-hidden border border-slate-300 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <input
                  type="text"
                  value={tempPlaybackId}
                  onChange={(e) => setTempPlaybackId(e.target.value)}
                  className="flex-1 block w-full bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
                  placeholder="Cole o Playback ID"
                />
                <CopyButton textToCopy={tempPlaybackId} label="ID" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 ml-1">Usado pelo player para recuperar e exibir o vídeo.</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 transition-all hover:scale-105 active:scale-95"
            >
              Salvar Configurações
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default React.memo(ConfigForm);