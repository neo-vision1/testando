import { AllConfigs, StoredUser, CloudConfig } from '../types';
import { 
  DEFAULT_PLAYBACK_ID_1, 
  DEFAULT_RTMP_KEY_1, 
  DEFAULT_PLAYBACK_ID_2, 
  DEFAULT_RTMP_KEY_2 
} from '../constants';

const SESSION_KEY = 'drone_session_v1';
const USERS_DB_KEY = 'drone_users_db_v1';
const CLOUD_CONFIG_KEY = 'drone_cloud_config_v1';
const GIST_FILENAME = 'drone_command_db.json';

// Estrutura interna do "Banco de Dados"
interface UserRecord {
  id: string;
  username: string;
  password: string;
  config: AllConfigs;
}

interface UserDatabase {
  [userId: string]: UserRecord;
}

// Configuração Padrão Inicial
const INITIAL_CONFIG: AllConfigs = {
  drone1: { playbackId: DEFAULT_PLAYBACK_ID_1, rtmpKey: DEFAULT_RTMP_KEY_1 },
  drone2: { playbackId: DEFAULT_PLAYBACK_ID_2, rtmpKey: DEFAULT_RTMP_KEY_2 },
  theme: 'dark'
};

// --- Cloud / GitHub Services ---

export const getCloudConfig = (): CloudConfig | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(CLOUD_CONFIG_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveCloudConfig = (config: CloudConfig) => {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
};

// Busca o banco de dados do GitHub (Se configurado)
const fetchCloudDB = async (token: string, gistId: string | null): Promise<{ db: UserDatabase | null, newGistId: string | null }> => {
  try {
    // Se temos um ID, tentamos ler direto
    if (gistId) {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { Authorization: `token ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.files && json.files[GIST_FILENAME]) {
          return { db: JSON.parse(json.files[GIST_FILENAME].content), newGistId: gistId };
        }
      }
    }

    // Se não temos ID ou falhou, buscamos nos gists do usuário
    const searchRes = await fetch(`https://api.github.com/gists`, {
      headers: { Authorization: `token ${token}` }
    });
    
    if (searchRes.ok) {
      const gists = await searchRes.json();
      const existingGist = gists.find((g: any) => g.files[GIST_FILENAME]);
      
      if (existingGist) {
        const contentRes = await fetch(existingGist.files[GIST_FILENAME].raw_url);
        const db = await contentRes.json();
        return { db, newGistId: existingGist.id };
      }
    }

    return { db: null, newGistId: null };
  } catch (e) {
    console.error("Erro na nuvem:", e);
    return { db: null, newGistId: null };
  }
};

// Salva o banco de dados no GitHub
const pushToCloud = async (db: UserDatabase, token: string, gistId: string | null): Promise<string | null> => {
  const body = {
    description: "Drone Command Center Database",
    public: false,
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(db, null, 2)
      }
    }
  };

  try {
    const url = gistId ? `https://api.github.com/gists/${gistId}` : `https://api.github.com/gists`;
    const method = gistId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      const json = await res.json();
      return json.id;
    }
  } catch (e) {
    console.error("Falha ao salvar na nuvem:", e);
  }
  return gistId;
};

// --- Local Helper Functions ---

const getLocalDB = (): UserDatabase => {
  if (typeof window === 'undefined') return {};
  try {
    const db = localStorage.getItem(USERS_DB_KEY);
    return db ? JSON.parse(db) : {};
  } catch (e) {
    return {};
  }
};

const saveLocalDB = (db: UserDatabase) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
  }
};

// --- Sync Logic (Core) ---

const getDB = async (): Promise<UserDatabase> => {
  const local = getLocalDB();
  const cloudConf = getCloudConfig();

  if (cloudConf && cloudConf.githubToken) {
    // Tentativa de Sync
    const { db: cloudDB, newGistId } = await fetchCloudDB(cloudConf.githubToken, cloudConf.gistId);
    
    if (newGistId && newGistId !== cloudConf.gistId) {
      saveCloudConfig({ ...cloudConf, gistId: newGistId });
    }

    if (cloudDB) {
      // Merge simples: Nuvem tem prioridade sobre local para consistência
      // Em um app real, faríamos merge inteligente por timestamp
      const merged = { ...local, ...cloudDB };
      saveLocalDB(merged);
      return merged;
    }
  }

  return local;
};

const saveDB = async (db: UserDatabase) => {
  // 1. Salva Local
  saveLocalDB(db);

  // 2. Tenta salvar Nuvem
  const cloudConf = getCloudConfig();
  if (cloudConf && cloudConf.githubToken) {
    const newId = await pushToCloud(db, cloudConf.githubToken, cloudConf.gistId);
    if (newId && newId !== cloudConf.gistId) {
      saveCloudConfig({ ...cloudConf, gistId: newId });
    }
  }
};

// --- Auth Services (Async Now) ---

export const registerUser = async (username: string, password: string): Promise<StoredUser> => {
  const db = await getDB();
  
  const exists = Object.values(db).some(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    throw new Error("Nome de usuário já está em uso.");
  }

  const newId = `OP-${Date.now().toString(36).toUpperCase()}`;
  
  const newUser: UserRecord = {
    id: newId,
    username,
    password,
    config: INITIAL_CONFIG
  };

  db[newId] = newUser;
  await saveDB(db);

  return { id: newId, name: username };
};

export const loginUser = async (username: string, password: string): Promise<StoredUser> => {
  // Força sync antes do login para pegar usuários criados em outros PCs
  const db = await getDB();
  
  const user = Object.values(db).find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );

  if (!user) {
    throw new Error("Usuário ou senha inválidos.");
  }

  return { id: user.id, name: user.username };
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

export const clearSession = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
};

// --- Config Management ---

export const saveUserConfig = async (userId: string, config: AllConfigs): Promise<void> => {
  const db = await getDB();
  if (db[userId]) {
    db[userId].config = config;
    await saveDB(db);
  }
};

export const loadUserConfig = async (userId: string): Promise<AllConfigs> => {
  // Tenta ler localmente primeiro para velocidade instantânea
  let db = getLocalDB();
  
  // Se não achar, ou se quisermos garantir atualização, chamamos o async
  if (!db[userId]) {
    db = await getDB();
  }

  if (db[userId] && db[userId].config) {
    return { ...INITIAL_CONFIG, ...db[userId].config };
  }
  return INITIAL_CONFIG;
};

// Compatibilidade
export const loadConfig = (): AllConfigs => INITIAL_CONFIG; 
export const saveConfig = (c: AllConfigs) => {};