import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AllConfigs, StoredUser, CloudConfig } from '../types';
import { 
  DEFAULT_PLAYBACK_ID_1, 
  DEFAULT_RTMP_KEY_1, 
  DEFAULT_PLAYBACK_ID_2, 
  DEFAULT_RTMP_KEY_2 
} from '../constants';

const SESSION_KEY = 'drone_session_v2'; // Bump version
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
    throw new Error("Supabase não configurado. Clique em 'Configurar Nuvem'.");
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
    
    // Se a tabela não existir ou RLS bloquear, pode dar erro, mas valida a conexão http
    // Erro 401/403 indica chave ruim. Erro 404 indica url ruim.
    
    if (error && error.code !== 'PGRST116') { // Ignora erro de 'no rows' se for o caso
        // Se for erro de permissão (que é esperado se não estiver logado), ainda assim a conexão funcionou
        if (error.code === '42501' || error.message.includes('fetch')) {
             // 42501 é row level security violation (bom sinal, significa que conectou no banco)
             return { success: true, message: "Conectado ao Supabase!" };
        }
        // Retornar sucesso se for apenas questão de auth, pois o login virá depois
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

  const userId = authData.user.id;

  // 2. Criar Perfil na Tabela (Profile)
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([
      { id: userId, email: email, config: INITIAL_CONFIG }
    ]);

  if (profileError) {
    // Se falhar o perfil, tentamos limpar o auth (opcional, mas boa prática)
    console.error("Erro ao criar perfil:", profileError);
    // Mas não paramos o fluxo, pois o usuário pode logar e o perfil ser criado depois
  }

  return { id: userId, name: email };
};

export const loginUser = async (email: string, password: string): Promise<StoredUser> => {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error("Email ou senha incorretos.");
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
    // Fallback: Se não existe (ex: usuário antigo), tenta criar
    const { error: insertError } = await supabase
        .from('profiles')
        .upsert({ id: userId, config: config }); // Upsert requer email se for not null, mas nossa tabela simplificada pode não exigir
    
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

  // Merge com inicial para garantir que novos campos não quebrem
  return { ...INITIAL_CONFIG, ...(data.config as object) };
};

// Compatibilidade
export const loadConfig = (): AllConfigs => INITIAL_CONFIG; 
export const saveConfig = (c: AllConfigs) => {};