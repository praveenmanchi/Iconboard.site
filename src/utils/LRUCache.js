/**
 * LRU (Least Recently Used) Cache implementation
 * Optimized for chunk caching with memory management
 */
class LRUCache {
  constructor(maxSize = 10) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.accessOrder = []; // Track access order for LRU eviction
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      this.moveToEnd(key);
      return this.cache.get(key);
    }
    return undefined;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      // Update existing key
      this.cache.set(key, value);
      this.moveToEnd(key);
    } else {
      // Add new key
      if (this.cache.size >= this.maxSize) {
        // Evict least recently used
        const lru = this.accessOrder.shift();
        this.cache.delete(lru);
        console.log(`🗑️ LRU Cache: Evicted chunk ${lru} (cache full)`);
      }
      
      this.cache.set(key, value);
      this.accessOrder.push(key);
      console.log(`💾 LRU Cache: Stored chunk ${key} (${this.cache.size}/${this.maxSize})`);
    }
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      return true;
    }
    return false;
  }

  moveToEnd(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      // Remove from current position
      this.accessOrder.splice(index, 1);
    }
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  size() {
    return this.cache.size;
  }

  // Iterator methods to match Map interface (fixes runtime crashes in api.js)
  entries() {
    return this.cache.entries();
  }

  values() {
    return this.cache.values();
  }

  keys() {
    return this.cache.keys();
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: ((this.cache.size / this.maxSize) * 100).toFixed(1) + '%',
      keys: Array.from(this.cache.keys())
    };
  }
}

export default LRUCache;