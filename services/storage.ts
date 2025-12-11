import { AllConfigs, StoredUser } from '../types';
import { 
  DEFAULT_PLAYBACK_ID_1, 
  DEFAULT_RTMP_KEY_1, 
  DEFAULT_PLAYBACK_ID_2, 
  DEFAULT_RTMP_KEY_2 
} from '../constants';

const SESSION_KEY = 'drone_session_v1';
const USERS_DB_KEY = 'drone_users_db_v1';

// Estrutura interna do "Banco de Dados"
interface UserRecord {
  id: string;
  username: string;
  password: string; // Nota: Em produção, nunca salve senhas em texto puro.
  config: AllConfigs;
}

interface UserDatabase {
  [userId: string]: UserRecord;
}

// Configuração Padrão Inicial
const INITIAL_CONFIG: AllConfigs = {
  drone1: { playbackId: DEFAULT_PLAYBACK_ID_1, rtmpKey: DEFAULT_RTMP_KEY_1 },
  drone2: { playbackId: DEFAULT_PLAYBACK_ID_2, rtmpKey: DEFAULT_RTMP_KEY_2 },
};

// --- Helper Functions ---

const getDB = (): UserDatabase => {
  if (typeof window === 'undefined') return {};
  try {
    const db = localStorage.getItem(USERS_DB_KEY);
    return db ? JSON.parse(db) : {};
  } catch (e) {
    console.error("Erro ao ler DB:", e);
    return {};
  }
};

const saveDB = (db: UserDatabase) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
  }
};

// --- Auth Services ---

export const registerUser = (username: string, password: string): StoredUser => {
  const db = getDB();
  
  // Verifica se usuário já existe
  const exists = Object.values(db).some(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    throw new Error("Nome de usuário já está em uso.");
  }

  const newId = `OP-${Date.now().toString(36).toUpperCase()}`;
  
  const newUser: UserRecord = {
    id: newId,
    username,
    password,
    config: INITIAL_CONFIG // Inicia com config padrão
  };

  db[newId] = newUser;
  saveDB(db);

  return { id: newId, name: username };
};

export const loginUser = (username: string, password: string): StoredUser => {
  const db = getDB();
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

// --- Config Management (Per User) ---

export const saveUserConfig = (userId: string, config: AllConfigs): void => {
  const db = getDB();
  if (db[userId]) {
    db[userId].config = config;
    saveDB(db);
  }
};

export const loadUserConfig = (userId: string): AllConfigs => {
  const db = getDB();
  if (db[userId] && db[userId].config) {
    return db[userId].config;
  }
  return INITIAL_CONFIG;
};

// Mantemos compatibilidade com assinaturas antigas se necessário, mas o App deve usar as novas
export const loadConfig = (): AllConfigs => INITIAL_CONFIG; 
export const saveConfig = (c: AllConfigs) => {}; 
