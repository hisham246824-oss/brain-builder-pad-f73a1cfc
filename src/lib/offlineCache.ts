// Offline cache keys
const CACHE_KEYS = {
  MATERIALS: 'offline_materials_cache',
  VOCABULARY: 'offline_vocabulary_cache',
  LAST_SYNC: 'offline_last_sync',
  PENDING_ACTIONS: 'offline_pending_actions',
} as const;

export interface PendingAction {
  id: string;
  type: 'add' | 'update' | 'delete';
  table: 'study_materials' | 'lessons' | 'vocabulary' | 'material_files';
  data: any;
  timestamp: number;
}

// Cache materials data
export function cacheMaterials(materials: any[]) {
  try {
    localStorage.setItem(CACHE_KEYS.MATERIALS, JSON.stringify(materials));
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Error caching materials:', error);
  }
}

// Get cached materials
export function getCachedMaterials(): any[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.MATERIALS);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error getting cached materials:', error);
    return null;
  }
}

// Cache vocabulary data
export function cacheVocabulary(words: any[]) {
  try {
    localStorage.setItem(CACHE_KEYS.VOCABULARY, JSON.stringify(words));
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Error caching vocabulary:', error);
  }
}

// Get cached vocabulary
export function getCachedVocabulary(): any[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.VOCABULARY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error getting cached vocabulary:', error);
    return null;
  }
}

// Get last sync time
export function getLastSyncTime(): string | null {
  return localStorage.getItem(CACHE_KEYS.LAST_SYNC);
}

// Add pending action for sync when online
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
    return newAction;
  } catch (error) {
    console.error('Error adding pending action:', error);
    return null;
  }
}

// Get pending actions
export function getPendingActions(): PendingAction[] {
  try {
    const pending = localStorage.getItem(CACHE_KEYS.PENDING_ACTIONS);
    return pending ? JSON.parse(pending) : [];
  } catch (error) {
    console.error('Error getting pending actions:', error);
    return [];
  }
}

// Remove pending action after sync
export function removePendingAction(actionId: string) {
  try {
    const pending = getPendingActions();
    const filtered = pending.filter(a => a.id !== actionId);
    localStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing pending action:', error);
  }
}

// Clear all pending actions
export function clearPendingActions() {
  localStorage.removeItem(CACHE_KEYS.PENDING_ACTIONS);
}

// Clear all cache (on logout)
export function clearOfflineCache() {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}
