import React, { useState, useEffect } from 'react';
import { registerUser, loginUser, saveSession, getCloudConfig, saveCloudConfig, forceSync } from '../services/storage';
import { StoredUser } from '../types';
import { Database, Check, AlertCircle, Loader2, KeyRound, Lock } from 'lucide-react';
import { SUPABASE_URL } from '../constants';

interface LoginProps {
  onLoginSuccess: (user: StoredUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showCloudConfig, setShowCloudConfig] = useState(false);
  
  // Auth Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Cloud Form
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if configuration is hardcoded
  const isHardcoded = !!(SUPABASE_URL && SUPABASE_URL.length > 5);

  useEffect(() => {
    const cloud = getCloudConfig();
    if (cloud?.supabaseUrl) {
      setSupabaseUrl(cloud.supabaseUrl);
      setSupabaseKey(cloud.supabaseKey);
    } else if (!isHardcoded) {
        // Apenas mostra a config inicial se não estiver hardcoded e não tiver local storage
        setShowCloudConfig(true);
    }
  }, [isHardcoded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("Preencha todos os campos.");
      }

      let user: StoredUser;

      if (isRegistering) {
        user = await registerUser(email, password);
      } else {
        user = await loginUser(email, password);
      }

      saveSession(user);
      
      setTimeout(() => {
        onLoginSuccess(user);
      }, 500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro de autenticação. Verifique conexão e dados.");
      setLoading(false);
    }
  };

  const handleSaveCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
        saveCloudConfig({
            supabaseUrl: supabaseUrl.trim(),
            supabaseKey: supabaseKey.trim(),
        });

        const result = await forceSync();

        if (result.success) {
            setSuccessMsg(result.message);
            setTimeout(() => {
                setShowCloudConfig(false);
                setSuccessMsg(null);
            }, 1500);
        } else {
            setError(result.message);
        }
    } catch (err: any) {
        setError("Erro desconhecido ao conectar.");
    } finally {
        setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
    setPassword('');
  };

  // Render Cloud Config Screen
  if (showCloudConfig && !isHardcoded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
            <Database className="w-6 h-6" /> Conectar Supabase
          </h2>
          <p className="text-slate-400 text-xs mb-6 leading-relaxed">
            Para ativar o sistema de login, crie um projeto no <a href="https://supabase.com" target="_blank" className="text-blue-400 underline">supabase.com</a>.
            <br/><br/>
            Copie a <strong>Project URL</strong> e a <strong>API Key (anon/public)</strong> das configurações do projeto.
          </p>
          
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
          
          <form onSubmit={handleSaveCloud} className="space-y-4">
            <div>
                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Project URL</label>
                <input 
                type="text"
                className="w-full px-4 py-3 bg-black border border-slate-700 rounded-lg text-white focus:border-green-500 outline-none"
                placeholder="https://xyz.supabase.co"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                disabled={loading}
                />
            </div>
            
            <div>
                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Anon Public Key</label>
                <div className="relative">
                    <input 
                    type="password"
                    className="w-full pl-4 pr-10 py-3 bg-black border border-slate-700 rounded-lg text-white focus:border-green-500 outline-none"
                    placeholder="eyJhbG..."
                    value={supabaseKey}
                    onChange={e => setSupabaseKey(e.target.value)}
                    disabled={loading}
                    />
                    <KeyRound className="w-4 h-4 text-slate-600 absolute right-3 top-3.5" />
                </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                type="button" 
                onClick={() => setShowCloudConfig(false)}
                className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm font-semibold"
                disabled={loading}
              >
                Voltar
              </button>
              <button 
                type="submit"
                className="flex-[2] py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Conectando...' : 'Salvar & Conectar'}
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
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]"></div>

        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isRegistering ? 'Criar Conta' : 'Acesso Seguro'}
          </h1>
          <p className="text-slate-400 text-sm mt-2">Central de Comando via Supabase</p>
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
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-black/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:border-green-500 focus:outline-none transition-all"
              placeholder="operador@comando.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Senha</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-black/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:border-green-500 focus:outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-lg shadow-lg shadow-green-900/30 transition-all flex items-center justify-center
              ${loading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {loading ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Processando...</span>
            ) : (
              isRegistering ? 'Registrar Operador' : 'Entrar'
            )}
          </button>
        </form>
        
        <div className="mt-4 flex flex-col gap-3">
          {isHardcoded ? (
             <div className="w-full py-2 px-4 bg-slate-900/80 text-slate-500 text-xs font-mono rounded-lg border border-slate-800 text-center flex items-center justify-center gap-2 select-none">
                <Lock className="w-3 h-3" />
                Conexão: Definida no Sistema (Global)
             </div>
          ) : (
            <button 
                type="button"
                onClick={() => setShowCloudConfig(true)}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
                <Database className="w-4 h-4" />
                {supabaseUrl ? 'Supabase Conectado (Editar)' : 'Configurar Banco de Dados'}
            </button>
          )}

          <div className="pt-2 border-t border-slate-800 text-center">
            <button 
              onClick={toggleMode}
              className="text-xs text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors"
            >
              {isRegistering 
                ? 'Já possui conta? Fazer Login' 
                : 'Não possui conta? Registrar-se'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;