import { expect } from 'chai';
import { IndexedDbTokenStore } from '../src/indexedDbTokenStore';
import type { CryptoSigning } from '../src/types';

/**
 * Minimal IndexedDB mock.
 * Models a simple in-memory key-value store backed by a plain object.
 */
function makeIndexedDbMock() {
  const store: Record<string, unknown> = {};

  function makeRequest<T>(fn: () => T): IDBRequest<T> {
    const req = {} as IDBRequest<T>;
    Promise.resolve().then(() => {
      try {
        (req as unknown as { result: T }).result = fn();
        req.onsuccess?.({ target: req } as unknown as Event);
      } catch (e) {
        (req as unknown as { error: DOMException }).error = e as DOMException;
        req.onerror?.({ target: req } as unknown as Event);
      }
    });
    return req;
  }

  function makeTransaction(): IDBTransaction {
    const objectStore: Partial<IDBObjectStore> = {
      put: (value: unknown, key: IDBValidKey) =>
        makeRequest(() => {
          store[key as string] = value;
          return key;
        }),
      get: (key: IDBValidKey) => makeRequest(() => store[key as string] as CryptoSigning | undefined),
      delete: (key: IDBValidKey) =>
        makeRequest(() => {
          delete store[key as string];
          return undefined;
        }),
    };

    const tx = {} as IDBTransaction;
    (tx as unknown as Record<string, unknown>).objectStore = () => objectStore;
    // Fire oncomplete after the request promise chain settles
    Promise.resolve()
      .then(() => Promise.resolve())
      .then(() => {
        tx.oncomplete?.({} as Event);
      });
    return tx;
  }

  const db: Partial<IDBDatabase> = {
    objectStoreNames: { contains: () => true } as unknown as DOMStringList,
    transaction: (_name: string) => makeTransaction(),
    close: () => undefined,
    createObjectStore: () => ({} as IDBObjectStore),
  };

  return {
    open: (_name: string, _version?: number) => {
      const openRequest = {} as IDBOpenDBRequest;
      Promise.resolve().then(() => {
        (openRequest as unknown as { result: IDBDatabase }).result = db as IDBDatabase;
        openRequest.onsuccess?.({ target: openRequest } as unknown as Event);
      });
      return openRequest;
    },
    store,
  };
}

function setIndexedDB(value: unknown) {
  Object.defineProperty(globalThis, 'indexedDB', { value, writable: true, configurable: true });
}

describe('IndexedDbTokenStore', () => {
  let mockSigning: CryptoSigning;

  before(async () => {
    const rawKey = new TextEncoder().encode('test-token-key');
    const cryptoKey = await crypto.subtle.importKey('raw', rawKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    mockSigning = { cryptoKey, tokenHash: 'abc123' };
  });

  afterEach(() => {
    setIndexedDB(undefined);
  });

  it('save then load returns the stored CryptoSigning', async () => {
    setIndexedDB(makeIndexedDbMock());

    const tokenStore = new IndexedDbTokenStore();
    await tokenStore.save(mockSigning);
    const loaded = await tokenStore.load();

    expect(loaded).to.deep.equal(mockSigning);
  });

  it('load returns null when nothing is stored', async () => {
    setIndexedDB(makeIndexedDbMock());

    const tokenStore = new IndexedDbTokenStore();
    const loaded = await tokenStore.load();

    expect(loaded).to.be.null;
  });

  it('remove clears the stored value', async () => {
    setIndexedDB(makeIndexedDbMock());

    const tokenStore = new IndexedDbTokenStore();
    await tokenStore.save(mockSigning);
    await tokenStore.remove();
    const loaded = await tokenStore.load();

    expect(loaded).to.be.null;
  });

  it('save is a no-op when indexedDB is unavailable', async () => {
    setIndexedDB(undefined);

    const tokenStore = new IndexedDbTokenStore();
    await tokenStore.save(mockSigning);
  });

  it('load returns null when indexedDB is unavailable', async () => {
    setIndexedDB(undefined);

    const tokenStore = new IndexedDbTokenStore();
    const loaded = await tokenStore.load();

    expect(loaded).to.be.null;
  });

  it('remove is a no-op when indexedDB is unavailable', async () => {
    setIndexedDB(undefined);

    const tokenStore = new IndexedDbTokenStore();
    await tokenStore.remove();
  });
});
