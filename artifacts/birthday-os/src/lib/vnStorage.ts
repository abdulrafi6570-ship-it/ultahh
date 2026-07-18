/**
 * IndexedDB storage for multiple Voice Note clips.
 * Clips are stored as ArrayBuffers under keys like "vn_<id>".
 * An index JSON under "vn_index" tracks metadata.
 */

const DB_NAME = "birthdayos_audio";
const STORE = "audio";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface VNMeta { id: string; label: string; fileName: string }

async function getIndex(db: IDBDatabase): Promise<VNMeta[]> {
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get("vn_index");
    tx.oncomplete = () => res(req.result ? JSON.parse(req.result) : []);
    tx.onerror = () => rej(tx.error);
  });
}

async function setIndex(db: IDBDatabase, index: VNMeta[]): Promise<void> {
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(JSON.stringify(index), "vn_index");
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export async function saveVN(file: File, label: string): Promise<{ meta: VNMeta; url: string }> {
  const buffer = await file.arrayBuffer();
  const db = await openDB();
  const index = await getIndex(db);
  const id = `vn_${Date.now()}`;
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(buffer, id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  const meta: VNMeta = { id, label, fileName: file.name };
  await setIndex(db, [...index, meta]);
  db.close();
  const blob = new Blob([buffer]);
  return { meta, url: URL.createObjectURL(blob) };
}

export async function loadAllVNs(): Promise<{ meta: VNMeta; url: string }[]> {
  try {
    const db = await openDB();
    const index = await getIndex(db);
    const results: { meta: VNMeta; url: string }[] = [];
    for (const meta of index) {
      const buffer: ArrayBuffer = await new Promise((res, rej) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(meta.id);
        tx.oncomplete = () => res(req.result);
        tx.onerror = () => rej(tx.error);
      });
      if (buffer) {
        const blob = new Blob([buffer]);
        results.push({ meta, url: URL.createObjectURL(blob) });
      }
    }
    db.close();
    return results;
  } catch { return []; }
}

export async function deleteVN(id: string): Promise<void> {
  try {
    const db = await openDB();
    const index = await getIndex(db);
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    await setIndex(db, index.filter(m => m.id !== id));
    db.close();
  } catch {}
}
