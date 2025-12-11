import React, { useState, useEffect } from 'react';
import { registerUser, loginUser, saveSession, getCloudConfig, saveCloudConfig } from '../services/storage';
import { StoredUser } from '../types';
import { Cloud, Github, Check, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: StoredUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showCloudConfig, setShowCloudConfig] = useState(false);
  
  // Auth Form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Cloud Form
  const [githubToken, setGithubToken] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cloud = getCloudConfig();
    if (cloud?.githubToken) {
      setGithubToken(cloud.githubToken);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!username.trim() || !password.trim()) {
        throw new Error("Preencha todos os campos.");
      }

      let user: StoredUser;

      if (isRegistering) {
        user = await registerUser(username, password);
      } else {
        user = await loginUser(username, password);
      }

      saveSession(user);
      
      setTimeout(() => {
        onLoginSuccess(user);
      }, 500);

    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Verifique suas credenciais.");
      setLoading(false);
    }
  };

  const handleSaveCloud = (e: React.FormEvent) => {
    e.preventDefault();
    saveCloudConfig({
      githubToken: githubToken.trim(),
      gistId: null, // Resetar ID para buscar novo se token mudar
      lastSync: Date.now()
    });
    setSuccessMsg("Token salvo! Tentando sincronizar...");
    setTimeout(() => {
      setShowCloudConfig(false);
      setSuccessMsg(null);
    }, 1500);
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
    setPassword('');
  };

  // Render Cloud Config Screen
  if (showCloudConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Github className="w-6 h-6" /> Configurar Nuvem
          </h2>
          <p className="text-slate-400 text-xs mb-6">
            Para acessar sua conta de qualquer dispositivo, crie um <strong>Personal Access Token (Classic)</strong> no GitHub com permissão de <code>gist</code> e cole abaixo. Isso criará um banco de dados privado na sua conta.
          </p>
          
          <form onSubmit={handleSaveCloud}>
            <label className="block text-xs uppercase text-slate-500 font-bold mb-2">GitHub Personal Token</label>
            <input 
              type="password"
              className="w-full px-4 py-3 bg-black border border-slate-700 rounded-lg text-white mb-4 focus:border-blue-500 outline-none"
              placeholder="ghp_..."
              value={githubToken}
              onChange={e => setGithubToken(e.target.value)}
            />
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setShowCloudConfig(false)}
                className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
              >
                Voltar
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500"
              >
                Salvar & Conectar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-radial-gradient from-slate-900 to-black p-4">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>

        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isRegistering ? 'Criar Acesso' : 'Acesso Restrito'}
          </h1>
          <p className="text-slate-400 text-sm mt-2">Central de Comando de Drones</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-800/50 rounded-lg text-green-200 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Usuário</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-black/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-all"
              placeholder="Identificação do Operador"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Senha</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-black/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-lg shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center
              ${loading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {loading ? (
              <span className="animate-pulse">Conectando...</span>
            ) : (
              isRegistering ? 'Cadastrar Operador' : 'Entrar no Sistema'
            )}
          </button>
        </form>
        
        <div className="mt-4 flex flex-col gap-3">
          <button 
            type="button"
            onClick={() => setShowCloudConfig(true)}
            className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <Cloud className="w-4 h-4" />
            {githubToken ? 'Nuvem Configurada (Editar)' : 'Ativar Banco de Dados GitHub'}
          </button>

          <div className="pt-2 border-t border-slate-800 text-center">
            <button 
              onClick={toggleMode}
              className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
            >
              {isRegistering 
                ? 'Já possui acesso? Voltar para Login' 
                : 'Não possui conta? Cadastrar novo acesso'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;