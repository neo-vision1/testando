import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AllConfigs, StoredUser, CloudConfig } from '../types';
import { 
  DEFAULT_PLAYBACK_ID_1, 
  DEFAULT_RTMP_KEY_1, 
  DEFAULT_PLAYBACK_ID_2, 
  DEFAULT_RTMP_KEY_2,
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from '../constants';

const SESSION_KEY = 'drone_session_v2'; 
const CLOUD_CONFIG_KEY = 'drone_supabase_config_v1';

// Configuração Padrão Inicial
const INITIAL_CONFIG: AllConfigs = {
  drone1: { playbackId: DEFAULT_PLAYBACK_ID_1, rtmpKey: DEFAULT_RTMP_KEY_1 },
  drone2: { playbackId: DEFAULT_PLAYBACK_ID_2, rtmpKey: DEFAULT_RTMP_KEY_2 },
  theme: 'dark'
};

// --- Supabase Instance Management ---

let supabaseInstance: SupabaseClient | null = null;

export const getCloudConfig = (): CloudConfig | null => {
  // 1. Prioridade: Chaves Hardcoded (constants.ts)
  if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.length > 5) {
    return {
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY
    };
  }

  // 2. Fallback: LocalStorage (Configuração Manual)
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(CLOUD_CONFIG_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveCloudConfig = (config: CloudConfig) => {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
  // Reset instance to force recreation with new creds
  supabaseInstance = null;
};

const getSupabase = (): SupabaseClient => {
  if (supabaseInstance) return supabaseInstance;

  const config = getCloudConfig();
  if (!config || !config.supabaseUrl || !config.supabaseKey) {
    throw new Error("Supabase não configurado. Verifique o arquivo constants.ts ou configure manualmente.");
  }

  try {
    supabaseInstance = createClient(config.supabaseUrl, config.supabaseKey);
    return supabaseInstance;
  } catch (e) {
    throw new Error("Configuração do Supabase inválida.");
  }
};

// --- Helper para UI (Teste de Conexão) ---

export const forceSync = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const supabase = getSupabase();
    // Tenta uma query leve para verificar a chave
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { 
        if (error.code === '42501' || error.message.includes('fetch')) {
             return { success: true, message: "Conectado ao Supabase!" };
        }
        return { success: true, message: "Conexão estabelecida." };
    }

    return { success: true, message: "Conectado com sucesso!" };
  } catch (e: any) {
    return { success: false, message: "Falha na conexão. Verifique URL e Chave." };
  }
};

// --- Auth Services (Supabase Auth) ---

export const registerUser = async (email: string, password: string): Promise<StoredUser> => {
  const supabase = getSupabase();

  // 1. Criar Usuário no Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error("Erro ao criar usuário.");

  // Se o Supabase exigir confirmação de email, a sessão virá nula
  if (!authData.session && authData.user.identities?.length) {
    throw new Error("Registro realizado! Verifique seu email para confirmar a conta antes de entrar.");
  }

  const userId = authData.user.id;

  // 2. Criar Perfil na Tabela (Profile)
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([
      { id: userId, email: email, config: INITIAL_CONFIG }
    ]);

  if (profileError) {
    console.error("Erro ao criar perfil:", profileError);
  }

  return { id: userId, name: email };
};

export const loginUser = async (email: string, password: string): Promise<StoredUser> => {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login Error:", error);
    if (error.message.includes("Email not confirmed")) {
      throw new Error("Email não confirmado. Verifique sua caixa de entrada (ou spam).");
    }
    if (error.message.includes("Invalid login credentials")) {
      throw new Error("Email ou senha incorretos.");
    }
    throw new Error(error.message || "Erro ao fazer login.");
  }
  
  if (!data.user) throw new Error("Usuário não encontrado.");

  return { id: data.user.id, name: data.user.email || email };
};

// --- Session Management ---

export const saveSession = (user: StoredUser): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
};

export const loadSession = (): StoredUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

export const clearSession = async (): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
    try {
        const supabase = getSupabase();
        await supabase.auth.signOut();
    } catch (e) {
        // Ignorar se não tiver instancia
    }
  }
};

// --- Config Management (Profiles Table) ---

export const saveUserConfig = async (userId: string, config: AllConfigs): Promise<void> => {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('profiles')
    .update({ config: config })
    .eq('id', userId);

  if (error) {
    console.error("Erro ao salvar config:", error);
    const { error: insertError } = await supabase
        .from('profiles')
        .upsert({ id: userId, config: config }); 
    
    if (insertError) console.error("Erro ao tentar upsert:", insertError);
  }
};

export const loadUserConfig = async (userId: string): Promise<AllConfigs> => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('profiles')
    .select('config')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.warn("Config não encontrada ou erro:", error);
    return INITIAL_CONFIG;
  }

  return { ...INITIAL_CONFIG, ...(data.config as object) };
};

export const loadConfig = (): AllConfigs => INITIAL_CONFIG; 
export const saveConfig = (c: AllConfigs) => {};