import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StoredUser, ViewMode, AllConfigs } from './types';
import { CONFIGURABLE_DRONES, ADDITIONAL_DRONES } from './constants';
import { loadSession, clearSession, loadUserConfig, saveUserConfig } from './services/storage';
import Login from './components/Login';
import DronePlayer from './components/DronePlayer';
import ConfigForm from './components/ConfigForm';
import { Sun, Moon, LogOut, Settings, Monitor } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('alpha');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // Estado inicial com tema padrão 'dark'
  const [config, setConfig] = useState<AllConfigs>({
    drone1: { playbackId: '', rtmpKey: '' },
    drone2: { playbackId: '', rtmpKey: '' },
    theme: 'dark'
  });
  
  const [expandedConfig, setExpandedConfig] = useState<string | null>('drone1');

  // --- THEME MANAGEMENT ---
  // Aplica a classe 'dark' no elemento HTML root baseado na config
  useEffect(() => {
    if (config.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config.theme]);

  // Load initial session and user config
  useEffect(() => {
    const sessionUser = loadSession();
    if (sessionUser) {
      setUser(sessionUser);
      const userConfig = loadUserConfig(sessionUser.id);
      setConfig(userConfig);
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: StoredUser) => {
    setUser(loggedInUser);
    const userConfig = loadUserConfig(loggedInUser.id);
    setConfig(userConfig);
  };

  const handleLogout = () => {
    setUser(null);
    clearSession();
  };

  const handleSaveConfig = useCallback((key: keyof AllConfigs, playbackId: string, rtmpKey: string) => {
    if (!user) return;

    setConfig(prev => {
      // TypeScript safety: Ensure we are constructing a valid AllConfigs object
      // We manually construct the object to satisfy the type checker for the specific keys
      const updated = { ...prev };
      
      if (key === 'drone1' || key === 'drone2') {
         updated[key] = { playbackId: playbackId.trim(), rtmpKey: rtmpKey.trim() };
      }

      saveUserConfig(user.id, updated);
      return updated;
    });
    setExpandedConfig(null);
  }, [user]);

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    if (!user) return;
    setConfig(prev => {
      const updated = { ...prev, theme: newTheme };
      saveUserConfig(user.id, updated);
      return updated;
    });
  };

  // Compute active feeds
  const feedsToDisplay = useMemo(() => {
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
  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

  return (
    // h-[100dvh] + Classes dinâmicas de tema (bg-slate-50 vs dark:bg-slate-950)
    <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 overflow-hidden font-sans transition-colors duration-300">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-20 shadow-md gap-3 md:gap-4 shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
           <div className="flex items-center gap-3">
              {/* LOGO IMAGE */}
             <img 
               src="/logo.svg" 
               alt="NEO" 
               className="h-8 md:h-10 w-auto object-contain filter dark:invert-0 invert" // Inverte cor do logo no modo claro se necessário
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 const parent = e.currentTarget.parentElement;
                 if (parent) {
                    const fallback = document.createElement('span');
                    fallback.textContent = 'NEO';
                    fallback.className = 'text-xl md:text-2xl font-black tracking-tighter text-slate-900 dark:text-white mr-2';
                    parent.insertBefore(fallback, parent.firstChild);
                 }
               }}
             />
             
             <div>
               <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-tight">Comando</h1>
               <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                 <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></span>
                 <span className="max-w-[80px] md:max-w-none truncate font-medium">{user.name}</span>
               </div>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0">
          {/* View Mode Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
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
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-800 mx-1 hidden md:block"></div>

          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border shrink-0 ${
              isConfigOpen 
                ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white' 
                : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Config</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/50 shrink-0 flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* CONFIG SIDEBAR (Conditional) */}
        <div className={`
          absolute z-40 top-0 right-0 h-full w-full md:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out
          ${isConfigOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="p-4 md:p-6 h-full flex flex-col overflow-y-auto pb-20 md:pb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Configuração</h2>
              <button onClick={() => setIsConfigOpen(false)} className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                ✕
              </button>
            </div>
            
            {/* THEME SWITCHER */}
            <div className="mb-6 bg-slate-100 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block flex items-center gap-2">
                <Monitor className="w-3 h-3" />
                Contraste / Tema
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => toggleTheme('light')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                    config.theme === 'light'
                      ? 'bg-white border-blue-500 text-blue-600 shadow-sm ring-1 ring-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span className="text-sm font-semibold">White</span>
                </button>
                <button
                  onClick={() => toggleTheme('dark')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                    config.theme === 'dark'
                      ? 'bg-slate-800 border-blue-500 text-blue-400 shadow-sm ring-1 ring-blue-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span className="text-sm font-semibold">Dark</span>
                </button>
              </div>
            </div>
            
            <div className="w-full h-px bg-slate-200 dark:bg-slate-800 mb-6"></div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
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

            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded text-xs text-yellow-700 dark:text-yellow-500">
               <strong>Atenção:</strong> Os dados são salvos localmente neste navegador. Para acessar em outro dispositivo, você precisará reconfigurar suas chaves.
            </div>
          </div>
        </div>

        {/* MAIN VIDEO AREA */}
        <main className="flex-1 p-2 md:p-4 overflow-y-auto bg-slate-100 dark:bg-black transition-colors duration-300">
          
          <div className={`
            grid gap-2 md:gap-4 w-full h-full max-w-7xl mx-auto transition-all duration-500
            ${viewMode === 'multi' 
              ? 'grid-rows-2 grid-cols-1 md:grid-cols-2 md:grid-rows-1' 
              : 'grid-rows-1 grid-cols-1'}
          `}>
            {feedsToDisplay.length > 0 ? (
              feedsToDisplay.map(drone => (
                <div key={drone.id} className="bg-black rounded-lg md:rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-lg md:shadow-2xl flex flex-col relative group h-full">
                  
                  <div className="flex-1 relative bg-black flex items-center justify-center">
                    {/* Container do player forçado a ocupar espaço */}
                    <div className="w-full h-full absolute inset-0">
                      <DronePlayer playbackId={drone.playbackId} droneName={drone.name} />
                    </div>
                  </div>
                  
                  {/* Footer info */}
                  <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 md:px-4 md:py-2 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-500 font-mono shrink-0 transition-colors duration-300">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${drone.isConfigurable ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                      <span className="truncate max-w-[150px] font-bold">{drone.name}</span>
                    </div>
                    <div className="text-slate-400 dark:text-slate-600">DVR ACTIVE</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-slate-200/50 dark:bg-slate-900/20 p-8 transition-colors">
                <span className="text-4xl mb-4 grayscale opacity-50">📡</span>
                <p>Nenhum sinal.</p>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}