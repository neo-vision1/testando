import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StoredUser, ViewMode, AllConfigs } from './types';
import { CONFIGURABLE_DRONES, ADDITIONAL_DRONES } from './constants';
import { loadUser, saveUser, clearUser, loadConfig, saveConfig } from './services/storage';
import Login from './components/Login';
import DronePlayer from './components/DronePlayer';
import ConfigForm from './components/ConfigForm';

export default function App() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('alpha');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<AllConfigs>({
    drone1: { playbackId: '', rtmpKey: '' },
    drone2: { playbackId: '', rtmpKey: '' }
  });
  const [expandedConfig, setExpandedConfig] = useState<string | null>('drone1');

  // Load initial data
  useEffect(() => {
    setUser(loadUser());
    setConfig(loadConfig());
  }, []);

  const handleLogin = (username: string) => {
    const uniqueId = `OP-${Math.floor(Math.random() * 9000) + 1000}`;
    const newUser = { name: username, id: uniqueId };
    setUser(newUser);
    saveUser(newUser);
  };

  const handleLogout = () => {
    setUser(null);
    clearUser();
  };

  const handleSaveConfig = useCallback((key: keyof AllConfigs, playbackId: string, rtmpKey: string) => {
    setConfig(prev => {
      const updated = {
        ...prev,
        [key]: { playbackId: playbackId.trim(), rtmpKey: rtmpKey.trim() }
      };
      saveConfig(updated);
      return updated;
    });
    setExpandedConfig(null);
  }, []);

  // Compute active feeds
  const feedsToDisplay = useMemo(() => {
    // Combine definitions with current config values
    const allFeeds = [...CONFIGURABLE_DRONES, ...ADDITIONAL_DRONES].map(def => {
      let pid = config.drone2.playbackId;
      if (def.id === 1) pid = config.drone1.playbackId;
      if (def.id === 2) pid = config.drone2.playbackId;
      
      return { ...def, playbackId: pid, isConfigurable: def.id <= 2 };
    });

    switch (viewMode) {
      case 'alpha': return allFeeds.filter(d => d.id === 1);
      case 'bravo': return allFeeds.filter(d => d.id === 2);
      case 'multi': return allFeeds.filter(d => d.id === 1 || d.id === 2);
      default: return [];
    }
  }, [viewMode, config]);

  // Auth Guard
  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 z-20 shadow-md gap-4">
        <div className="flex items-center gap-4">
           {/* LOGO IMAGE */}
           <img 
             src="/logo.png" 
             alt="NEO" 
             className="h-12 w-auto object-contain"
             onError={(e) => {
               // Fallback silencioso se a imagem não existir na pasta public
               // Para ver a imagem, salve seu arquivo como 'logo.png' na pasta public
               e.currentTarget.style.display = 'none';
             }}
           />
           
           <div>
             <h1 className="text-lg font-bold text-white leading-tight">Central de Comando</h1>
             <div className="flex items-center gap-2 text-xs text-slate-400">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span>Operador: <span className="text-blue-400 font-semibold">{user.name}</span></span>
               <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">{user.id}</span>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          {/* View Mode Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            {[
              { id: 'alpha', label: 'Alpha' },
              { id: 'bravo', label: 'Bravo' },
              { id: 'multi', label: 'Multi-View' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as ViewMode)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === mode.id 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          
          <div className="h-6 w-px bg-slate-800 mx-2"></div>

          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
              isConfigOpen 
                ? 'bg-slate-800 border-slate-600 text-white' 
                : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Config
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors border border-transparent hover:border-red-900/50"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* CONFIG SIDEBAR (Conditional) */}
        <div className={`
          absolute z-30 top-0 right-0 h-full w-full md:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out
          ${isConfigOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="p-6 h-full flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Configuração de Feed</h2>
              <button onClick={() => setIsConfigOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                ✕
              </button>
            </div>
            
            <p className="text-sm text-slate-400 mb-6">
              Gerencie as chaves de transmissão e IDs de reprodução para os drones principais.
            </p>

            <div className="flex-1">
              {CONFIGURABLE_DRONES.map(drone => (
                <ConfigForm 
                  key={drone.id} 
                  drone={drone} 
                  config={config} 
                  isExpanded={expandedConfig === drone.configKey}
                  onToggle={(key) => setExpandedConfig(expandedConfig === key ? null : key)}
                  onSave={handleSaveConfig}
                />
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-600">
                Alterações aplicam-se imediatamente.<br/>
                Certifique-se que o drone está online.
              </p>
            </div>
          </div>
        </div>

        {/* MAIN VIDEO AREA */}
        <main className="flex-1 p-4 overflow-y-auto bg-black/50">
          
          <div className={`
            grid gap-4 w-full h-full max-w-7xl mx-auto transition-all duration-500
            ${viewMode === 'multi' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-rows-1' 
              : 'grid-cols-1 grid-rows-1'}
          `}>
            {feedsToDisplay.length > 0 ? (
              feedsToDisplay.map(drone => (
                <div key={drone.id} className="bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col relative group">
                  {/* Header overlay on hover */}
                  <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                    <h3 className="text-white font-bold tracking-wide drop-shadow-md">{drone.name}</h3>
                  </div>

                  <div className="flex-1 relative">
                    <DronePlayer playbackId={drone.playbackId} droneName={drone.name} />
                  </div>
                  
                  {/* Footer info */}
                  <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${drone.isConfigurable ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                      ID: {drone.id}
                    </div>
                    <div>DVR HABILITADO</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                <span className="text-4xl mb-4">📡</span>
                <p>Nenhum sinal selecionado.</p>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}