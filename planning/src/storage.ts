import type { AppConfig } from './types';

const STORAGE_KEY = 'planning-calendar-config-v1';

const DEFAULT_ASSETS_OWNER = 'ivano82ff-eng';
const DEFAULT_ASSETS_REPO = 'hello-bot';

const DEFAULT_CONFIG: AppConfig = {
  owner: '',
  repo: '',
  token: '',
  demoMode: true,
  assetsOwner: DEFAULT_ASSETS_OWNER,
  assetsRepo: DEFAULT_ASSETS_REPO,
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
      assetsOwner: parsed.assetsOwner ?? DEFAULT_ASSETS_OWNER,
      assetsRepo: parsed.assetsRepo ?? DEFAULT_ASSETS_REPO,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: AppConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
