import type { AppConfig } from './types';

const STORAGE_KEY = 'planning-calendar-config-v1';

const DEFAULT_CONFIG: AppConfig = {
  owner: '',
  repo: '',
  token: '',
  demoMode: true,
};

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return {
      owner: parsed.owner ?? '',
      repo: parsed.repo ?? '',
      token: parsed.token ?? '',
      demoMode: parsed.demoMode ?? !parsed.token,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: AppConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
