import React, { useState } from 'react';
import { registerUser, loginUser, saveSession } from '../services/storage';
import { StoredUser } from '../types';

interface LoginProps {
  onLoginSuccess: (user: StoredUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        user = registerUser(username, password);
      } else {
        user = loginUser(username, password);
      }

      // Persist session
      saveSession(user);
      
      // Delay artificial para feedback visual
      setTimeout(() => {
        onLoginSuccess(user);
      }, 500);

    } catch (err: any) {
      setError(err.message || "Ocorreu um erro.");
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
    setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-radial-gradient from-slate-900 to-black p-4">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        
        {/* Background decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>

        <div className="text-center mb-8">
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
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-red-200 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Usuário</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-black/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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
              className="w-full px-4 py-3 bg-black/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-lg shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-0.5 flex items-center justify-center
              ${loading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {loading ? (
              <span className="animate-pulse">Processando...</span>
            ) : (
              isRegistering ? 'Cadastrar Operador' : 'Entrar no Sistema'
            )}
          </button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
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
  );
};

export default Login;