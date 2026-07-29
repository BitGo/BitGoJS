import type { CryptoSigning, ITokenStore } from './types';

const CRYPTO_DB_NAME = 'bitgo-auth';
const CRYPTO_STORE_NAME = 'crypto-signing';
const CRYPTO_RECORD_KEY = 'current';

function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openCryptoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CRYPTO_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CRYPTO_STORE_NAME)) {
        db.createObjectStore(CRYPTO_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withDb<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  const db = await openCryptoDb();
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

async function persistCryptoSigning(signing: CryptoSigning): Promise<void> {
  if (!hasIndexedDB()) return;
  await withDb(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(CRYPTO_STORE_NAME, 'readwrite');
        tx.objectStore(CRYPTO_STORE_NAME).put(signing, CRYPTO_RECORD_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

async function loadCryptoSigning(): Promise<CryptoSigning | null> {
  if (!hasIndexedDB()) return null;
  return withDb(
    (db) =>
      new Promise<CryptoSigning | null>((resolve, reject) => {
        const tx = db.transaction(CRYPTO_STORE_NAME, 'readonly');
        const request = tx.objectStore(CRYPTO_STORE_NAME).get(CRYPTO_RECORD_KEY);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
      })
  );
}

async function removeCryptoSigning(): Promise<void> {
  if (!hasIndexedDB()) return;
  await withDb(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(CRYPTO_STORE_NAME, 'readwrite');
        tx.objectStore(CRYPTO_STORE_NAME).delete(CRYPTO_RECORD_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

/**
 * Persists {@link CryptoSigning} material in the browser's IndexedDB.
 * The raw bearer token is never stored — only the non-extractable CryptoKey
 * and the SHA-256 token hash are persisted via the structured clone algorithm.
 */
export class IndexedDbTokenStore implements ITokenStore {
  async save(signing: CryptoSigning): Promise<void> {
    await persistCryptoSigning(signing);
  }

  async load(): Promise<CryptoSigning | null> {
    return loadCryptoSigning();
  }

  async remove(): Promise<void> {
    await removeCryptoSigning();
  }
}
