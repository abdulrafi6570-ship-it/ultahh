/**
 * IndexedDB-based audio storage so uploaded audio persists across page refreshes.
 * Object URLs are ephemeral (lost on refresh), but ArrayBuffers in IDB survive.
 */

const DB_NAME = "birthdayos_audio";
const STORE = "audio";
const KEY = "main_audio";
const META_KEY = "main_audio_name";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAudioToIDB(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.put(buffer, KEY);
    store.put(file.name, META_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  // Return a fresh blob URL from the just-saved buffer
  const blob = new Blob([buffer], { type: file.type });
  return URL.createObjectURL(blob);
}

export async function loadAudioFromIDB(): Promise<{ url: string; name: string } | null> {
  try {
    const db = await openDB();
    const [buffer, name] = await new Promise<[ArrayBuffer | undefined, string | undefined]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const req1 = store.get(KEY);
      const req2 = store.get(META_KEY);
      tx.oncomplete = () => resolve([req1.result, req2.result]);
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    if (!buffer) return null;
    const blob = new Blob([buffer]);
    return { url: URL.createObjectURL(blob), name: (name as string) || "audio" };
  } catch {
    return null;
  }
}

export async function clearAudioFromIDB(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.delete(KEY);
      store.delete(META_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {}
}
