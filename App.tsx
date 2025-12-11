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
    // h-[100dvh] é melhor para mobile pois ignora barra de endereços dinâmicas
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-3 bg-slate-900 border-b border-slate-800 z-20 shadow-md gap-3 md:gap-4 shrink-0">
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
           <div className="flex items-center gap-3">
              {/* LOGO IMAGE */}
             <img 
               src="/logo.svg" 
               alt="NEO" 
               className="h-8 md:h-10 w-auto object-contain"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 const parent = e.currentTarget.parentElement;
                 if (parent) {
                    const fallback = document.createElement('span');
                    fallback.textContent = 'NEO';
                    fallback.className = 'text-xl md:text-2xl font-black tracking-tighter text-white mr-2';
                    parent.insertBefore(fallback, parent.firstChild);
                 }
               }}
             />
             
             <div>
               <h1 className="text-base md:text-lg font-bold text-white leading-tight">Comando</h1>
               <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-400">
                 <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></span>
                 <span className="max-w-[80px] md:max-w-none truncate">{user.name}</span>
               </div>
             </div>
           </div>

           {/* Mobile Menu Button - Poderia ser adicionado aqui, mas vamos simplificar layout */}
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0">
          {/* View Mode Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
            {[
              { id: 'alpha', label: '1' },
              { id: 'bravo', label: '2' },
              { id: 'multi', label: 'Multi' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as ViewMode)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === mode.id 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          
          <div className="h-6 w-px bg-slate-800 mx-1 hidden md:block"></div>

          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border shrink-0 ${
              isConfigOpen 
                ? 'bg-slate-800 border-slate-600 text-white' 
                : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">Config</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors border border-transparent hover:border-red-900/50 shrink-0"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* CONFIG SIDEBAR (Conditional) */}
        <div className={`
          absolute z-40 top-0 right-0 h-full w-full md:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out
          ${isConfigOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="p-4 md:p-6 h-full flex flex-col overflow-y-auto pb-20 md:pb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Configuração</h2>
              <button onClick={() => setIsConfigOpen(false)} className="p-2 rounded bg-slate-800 text-slate-300">
                ✕ Fechar
              </button>
            </div>
            
            <p className="text-sm text-slate-400 mb-6">
              Gerencie as chaves de transmissão.
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
          </div>
        </div>

        {/* MAIN VIDEO AREA */}
        <main className="flex-1 p-2 md:p-4 overflow-y-auto bg-black">
          
          <div className={`
            grid gap-2 md:gap-4 w-full h-full max-w-7xl mx-auto transition-all duration-500 content-start
            ${viewMode === 'multi' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-rows-1' 
              : 'grid-cols-1 grid-rows-1'}
          `}>
            {feedsToDisplay.length > 0 ? (
              feedsToDisplay.map(drone => (
                <div key={drone.id} className="bg-black rounded-lg md:rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col relative group h-full">
                  
                  <div className="flex-1 relative bg-black flex items-center justify-center">
                    {/* Container do player forçado a ocupar espaço */}
                    <div className="w-full h-full absolute inset-0">
                      <DronePlayer playbackId={drone.playbackId} droneName={drone.name} />
                    </div>
                  </div>
                  
                  {/* Footer info - Oculto em mobile landscape muito pequeno se necessário */}
                  <div className="bg-slate-900 border-t border-slate-800 px-3 py-1.5 md:px-4 md:py-2 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${drone.isConfigurable ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                      <span className="truncate max-w-[150px]">{drone.name}</span>
                    </div>
                    <div>DVR ON</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20 p-8">
                <span className="text-4xl mb-4">📡</span>
                <p>Nenhum sinal.</p>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}