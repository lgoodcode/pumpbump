import { Redis } from "redis";

import { IS_PROD } from "@/constants/index.ts";

export class Queue<T> {
  private redis: Redis;
  private queueKey: string;

  constructor(redis: Redis, queueKey: string) {
    this.redis = redis;
    this.queueKey = IS_PROD ? queueKey : `test:${queueKey}`;
  }

  async enqueue(item: T): Promise<void> {
    await this.redis.rpush(this.queueKey, JSON.stringify(item));
  }

  async dequeue(): Promise<T | null> {
    const result = await this.redis.lpop(this.queueKey);
    return result ? JSON.parse(result) : null;
  }

  async peek(): Promise<T | null> {
    const result = await this.redis.lindex(this.queueKey, 0);
    return result ? JSON.parse(result) : null;
  }

  async size(): Promise<number> {
    return await this.redis.llen(this.queueKey);
  }

  async clear(): Promise<void> {
    await this.redis.del(this.queueKey);
  }

  async isEmpty(): Promise<boolean> {
    return await this.size() === 0;
  }

  async values(): Promise<T[]> {
    const results = await this.redis.lrange(this.queueKey, 0, -1);
    return results.map((result) => JSON.parse(result));
  }
}
