class MemoryCache {
  constructor() {
    this.cache = {};
  }

  get(key) {
    return this.cache[key] || null;
  }

  set(key, value) {
    this.cache[key] = value;
  }

  clear(key) {
    if (key) {
      delete this.cache[key];
    } else {
      this.cache = {};
    }
  }
}

const cacheInstance = new MemoryCache();
export default cacheInstance;
