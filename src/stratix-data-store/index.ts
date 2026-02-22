import { StratixDataStore } from './StratixDataStore';
import { TemplateLibrary } from './TemplateLibrary';
import { LogStore } from './LogStore';
import { BackupManager } from './BackupManager';

export { StratixDataStore, TemplateLibrary, LogStore, BackupManager };
export * from './types';

export function createDataStore(dataDir?: string): {
  store: StratixDataStore;
  templates: TemplateLibrary;
  logs: LogStore;
  backup: BackupManager;
} {
  const store = new StratixDataStore(dataDir);
  const templates = new TemplateLibrary(store);
  const logs = new LogStore(store);
  const backup = new BackupManager(store);
  
  return { store, templates, logs, backup };
}

export async function initializeDataStore(dataDir?: string): Promise<{
  store: StratixDataStore;
  templates: TemplateLibrary;
  logs: LogStore;
  backup: BackupManager;
}> {
  const instance = createDataStore(dataDir);
  await instance.store.initialize();
  await instance.templates.initialize();
  return instance;
}
