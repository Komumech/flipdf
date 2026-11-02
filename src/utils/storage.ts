import { FlipbookPage, DocumentInfo, ViewMode, BgmTrack } from '../types';

export interface SavedWorkspace {
  documentInfo: DocumentInfo;
  pages: FlipbookPage[];
  currentPage: number;
  viewMode: ViewMode;
  soundEnabled: boolean;
  bgmTrack: BgmTrack;
  customBgmUrl?: string;
  customBgmName?: string;
  zoom: number;
  savedAt: number;
}

const DB_NAME = 'FlipDF_DB';
const DB_VERSION = 1;
const STORE_NAME = 'workspace';
const KEY_NAME = 'current_workspace';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Persists the entire active FlipDF book, including pages, per-page audio,
 * and view settings into IndexedDB so it survives page reloads completely intact.
 */
export async function saveWorkspace(data: SavedWorkspace): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, KEY_NAME);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Also persist reading position and lightweight state in localStorage for instant access
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`flipdf_pos_${data.documentInfo.id}`, String(data.currentPage));
        localStorage.setItem('flipdf_last_doc_id', data.documentInfo.id);
      } catch {}
    }
  } catch (err) {
    console.warn('FlipDF: Could not save workspace to IndexedDB:', err);
  }
}

/**
 * Loads the saved workspace from IndexedDB if one exists.
 */
export async function loadWorkspace(): Promise<SavedWorkspace | null> {
  try {
    const db = await openDatabase();
    return await new Promise<SavedWorkspace | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_NAME);

      req.onsuccess = () => {
        resolve((req.result as SavedWorkspace) || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('FlipDF: Could not load workspace from IndexedDB:', err);
    return null;
  }
}

/**
 * Clears the persisted workspace if the user chooses to start fresh.
 */
export async function clearWorkspace(): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY_NAME);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('FlipDF: Could not clear workspace:', err);
  }
}

/**
 * Fast sync for reading position to localStorage
 */
export function saveReadingPosition(docId: string, pageNumber: number): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`flipdf_pos_${docId}`, String(pageNumber));
  } catch {}
}

export function getSavedReadingPosition(docId: string): number | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const val = localStorage.getItem(`flipdf_pos_${docId}`);
    return val ? parseInt(val, 10) : null;
  } catch {
    return null;
  }
}
