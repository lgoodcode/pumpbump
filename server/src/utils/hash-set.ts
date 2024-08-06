import { Redis } from "redis";

import { IS_PROD } from "@/constants/index.ts";

export class HashSet<T> {
  private redis: Redis;
  private hashKey: string;

  constructor(redis: Redis, hashKey: string) {
    this.redis = redis;
    this.hashKey = IS_PROD ? hashKey : `test:${hashKey}`;
  }

  async set(key: string, value: T): Promise<void> {
    await this.redis.hset(this.hashKey, key, JSON.stringify(value));
  }

  async get(key: string): Promise<T | null> {
    const result = await this.redis.hget(this.hashKey, key);
    return result ? JSON.parse(result) : null;
  }

  async delete(key: string): Promise<void> {
    await this.redis.hdel(this.hashKey, key);
  }

  async has(key: string): Promise<boolean> {
    return await this.redis.hexists(this.hashKey, key) === 1;
  }

  async update(key: string, value: T): Promise<void> {
    if (await this.has(key)) {
      await this.set(key, value);
    }
  }

  async stop(key: string): Promise<void> {
    await this.redis.hset(
      this.hashKey,
      key,
      JSON.stringify({ status: "stopped" }),
    );
  }

  async clear(): Promise<void> {
    await this.redis.del(this.hashKey);
  }

  async size(): Promise<number> {
    return await this.redis.hlen(this.hashKey);
  }

  async isEmpty(): Promise<boolean> {
    return (await this.size()) === 0;
  }

  async keys(): Promise<string[]> {
    return await this.redis.hkeys(this.hashKey);
  }

  async values(): Promise<T[]> {
    const values = await this.redis.hvals(this.hashKey) as string[];
    return values.map((value) => JSON.parse(value));
  }

  async entries(): Promise<[string, T][]> {
    const entries = await this.redis.hgetall(
      this.hashKey,
    );

    if (!entries) {
      return [];
    }

    return Object.entries(entries).map((
      [key, value],
    ) => [key, JSON.parse(value)]);
  }

  async forEach(callback: (value: T, key: string) => void): Promise<void> {
    const entries = await this.entries();
    entries.forEach(([key, value]) => callback(value, key));
  }

  async filter(
    callback: (value: T, key: string) => boolean,
  ): Promise<[string, T][]> {
    const entries = await this.entries();
    return entries.filter(([key, value]) => callback(value, key));
  }

  async map<U>(callback: (key: string, value: T) => U): Promise<U[]> {
    const entries = await this.entries();
    return entries.map(([key, value]) => callback(key, value));
  }

  async keyMap<U>(
    callback: (key: string) => U,
  ): Promise<U[]> {
    const keys = await this.keys();
    return keys.map((key) => callback(key));
  }

  async valueMap<U>(
    callback: (value: T) => U,
  ): Promise<U[]> {
    const values = await this.values();
    return values.map((value) => callback(value));
  }
}
