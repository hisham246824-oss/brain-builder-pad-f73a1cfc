// Offline cache keys
const CACHE_KEYS = {
  MATERIALS: 'offline_materials_cache',
  VOCABULARY: 'offline_vocabulary_cache',
  VOCABULARY_GROUPS: 'offline_vocabulary_groups_cache',
  TODOS: 'offline_todos_cache',
  LAST_SYNC: 'offline_last_sync',
  PENDING_ACTIONS: 'offline_pending_actions',
  SYNC_STATUS: 'offline_sync_status',
} as const;

export type SyncStatus = 'synced' | 'pending' | 'syncing';

function emitCacheUpdate(key: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('offline-cache-update', { detail: { key } }));
}

export interface PendingAction {
  id: string;
  type: 'add' | 'update' | 'delete';
  table: 'study_materials' | 'lessons' | 'vocabulary' | 'vocabulary_groups' | 'material_files' | 'todos' | 'page_visits';
  data: any;
  timestamp: number;
}

// --- Sync Status ---
export function getSyncStatus(): SyncStatus {
  const pending = getPendingActions();
  if (pending.length > 0) return 'pending';
  return (localStorage.getItem(CACHE_KEYS.SYNC_STATUS) as SyncStatus) || 'synced';
}

export function setSyncStatus(status: SyncStatus) {
  localStorage.setItem(CACHE_KEYS.SYNC_STATUS, status);
  // Dispatch custom event so components can react
  window.dispatchEvent(new CustomEvent('sync-status-change', { detail: status }));
}

// --- Materials ---
export function cacheMaterials(materials: any[]) {
  try {
    localStorage.setItem(CACHE_KEYS.MATERIALS, JSON.stringify(materials));
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Error caching materials:', error);
  }
}

export function getCachedMaterials(): any[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.MATERIALS);
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
}

// --- Vocabulary ---
export function cacheVocabulary(words: any[]) {
  try {
    localStorage.setItem(CACHE_KEYS.VOCABULARY, JSON.stringify(words));
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
    emitCacheUpdate(CACHE_KEYS.VOCABULARY);
  } catch (error) {
    console.error('Error caching vocabulary:', error);
  }
}

export function getCachedVocabulary(): any[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.VOCABULARY);
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
}

// --- Vocabulary Groups ---
export function cacheVocabularyGroups(groups: any[]) {
  try {
    localStorage.setItem(CACHE_KEYS.VOCABULARY_GROUPS, JSON.stringify(groups));
    emitCacheUpdate(CACHE_KEYS.VOCABULARY_GROUPS);
  } catch (error) {
    console.error('Error caching vocabulary groups:', error);
  }
}

export function getCachedVocabularyGroups(): any[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.VOCABULARY_GROUPS);
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
}
export function cacheTodos(todos: any[]) {
  try {
    localStorage.setItem(CACHE_KEYS.TODOS, JSON.stringify(todos));
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Error caching todos:', error);
  }
}

export function getCachedTodos(): any[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.TODOS);
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
}

// --- Last Sync ---
export function getLastSyncTime(): string | null {
  return localStorage.getItem(CACHE_KEYS.LAST_SYNC);
}

// --- Pending Actions Queue ---
export function addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp'>) {
  try {
    const pending = getPendingActions();
    const newAction: PendingAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    pending.push(newAction);
    localStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(pending));
    setSyncStatus('pending');
    return newAction;
  } catch (error) {
    console.error('Error adding pending action:', error);
    return null;
  }
}

export function getPendingActions(): PendingAction[] {
  try {
    const pending = localStorage.getItem(CACHE_KEYS.PENDING_ACTIONS);
    return pending ? JSON.parse(pending) : [];
  } catch { return []; }
}

export function removePendingAction(actionId: string) {
  try {
    const pending = getPendingActions();
    const filtered = pending.filter(a => a.id !== actionId);
    localStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(filtered));
    if (filtered.length === 0) setSyncStatus('synced');
  } catch (error) {
    console.error('Error removing pending action:', error);
  }
}

export function clearPendingActions() {
  localStorage.removeItem(CACHE_KEYS.PENDING_ACTIONS);
  setSyncStatus('synced');
}

// --- Clear All ---
export function clearOfflineCache() {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}
