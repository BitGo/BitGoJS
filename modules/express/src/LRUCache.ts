export interface LRUCacheOptions {
  // maximum number of records this cache can hold
  maxSize: number;

  // duration in milliseconds after which a record is considered expired
  ttl: number;
}

export default class LRUCache<K, V> {
  private cache: Map<K, { value: V; expiry: number }>;
  private readonly maxSize: number;
  private readonly ttl: number;

  /**
   * Creates a new LRU cache
   * @param options configurable options for this cache
   */
  constructor(options: LRUCacheOptions = { maxSize: 10, ttl: 60000 }) {
    this.cache = new Map();
    this.maxSize = options.maxSize;
    this.ttl = options.ttl;
  }

  /**
   * Retrieves value from cache if it exists and has not expired
   * @param key key
   */
  get(key: K): V | undefined {
    const cacheItem = this.cache.get(key);
    if (cacheItem) {
      // If expired, delete the cache item
      if (Date.now() > cacheItem.expiry) {
        this.cache.delete(key);
        return undefined;
      }

      // Move the item to the end to mark it as recently used
      this.cache.delete(key);
      this.cache.set(key, cacheItem);
      return cacheItem.value;
    }
    return undefined;
  }

  /**
   * Adds a new item to the cache.
   * If the cache is full, it will try to evict expired items first.
   * If no expired items are found, it will evict the least recently used item.
   *
   * @param key key
   * @param value value
   */
  set(key: K, value: V): void {
    const expiry = Date.now() + this.ttl;

    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // If cache is full, remove expired items, then remove the least recently used (LRU) item
    if (this.cache.size >= this.maxSize) {
      const numExpiredEvicted = this.cleanUpExpiredItems();
      if (numExpiredEvicted === 0) {
        const firstKey = this.cache.keys().next().value; // Get the first key (LRU)
        this.cache.delete(firstKey);
      }
    }

    // Add the new item to the cache
    this.cache.set(key, { value, expiry });
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  // Check if an item has expired
  private cleanUpExpiredItems(): number {
    const now = Date.now();

    let numDeleted = 0;
    for (const [key, { expiry }] of this.cache.entries()) {
      if (now > expiry) {
        this.cache.delete(key);
        numDeleted++;
      }
    }

    return numDeleted;
  }
}
