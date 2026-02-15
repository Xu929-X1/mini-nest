interface CacheEntry {
    value: any;
    expiresAt: number;
}

class CacheManager {
    private cache = new Map<string, CacheEntry>();

    get<T>(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.value as T;
    }

    set(key: string, value: any, ttlSeconds: number): void {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }
}

export const cacheManager = new CacheManager();