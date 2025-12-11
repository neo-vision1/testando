import { DroneDefinition } from './types';

// --- CONFIGURAÇÃO DO SUPABASE (PREENCHA AQUI PARA ACESSO DIRETO) ---
// Ao preencher estas chaves, o login funcionará para qualquer pessoa com o link,
// sem precisar configurar manualmente.
// Fix: Added explicit type annotation to prevent 'never' type inference on empty string checks
export const SUPABASE_URL: string = 'https://xrezuunshjzefdncsvgv.supabase.co'; // Ex: 'https://seunome.supabase.co'
export const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyZXp1dW5zaGp6ZWZkbmNzdmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0Nzk5NDEsImV4cCI6MjA4MTA1NTk0MX0.grxtcbI_39x_RARgxrJxNlx972M_q5mTQ77rCC3_hyI'; // Ex: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// --- CONFIGURAÇÃO DE DRONES ---

export const DEFAULT_PLAYBACK_ID_1 = 'W72UFolv01VI00hiyh004TLbxVO300Osr300901Kp84HXGfBE'; 
export const DEFAULT_RTMP_KEY_1 = '8e2849be-3829-8a6b-2bc4-bce86a83bf62';

export const DEFAULT_PLAYBACK_ID_2 = 'Z8lGAPsbj021RFH5UCdVAdSlhRwmqRjRHX1hbaGJJ802g'; 
export const DEFAULT_RTMP_KEY_2 = 'dde664a5-b40d-6688-f962-4cac8353fae9';

export const RTMP_BASE_URL = 'rtmp://global-live.mux.com:5222/app/';

export const CONFIGURABLE_DRONES: DroneDefinition[] = [
  { id: 1, name: 'Drone Alpha (Principal)', configKey: 'drone1' },
  { id: 2, name: 'Drone Bravo (Secundário)', configKey: 'drone2' },
];

export const ADDITIONAL_DRONES: DroneDefinition[] = [
  { id: 3, name: 'Drone Charlie (Monitoramento)' },
  { id: 4, name: 'Drone Delta (Reserva)' },
];