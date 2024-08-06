import { Redis } from "redis";
import { IS_PROD } from "@/constants/index.ts";

export class TaskRunTracker {
  private redis: Redis;
  private processingRunsKey = IS_PROD
    ? `processing_runs`
    : `test:processing_runs`;
  private totalRunsKey = IS_PROD ? `total_runs` : `test:total_runs`;
  private stoppingTasksKey = IS_PROD ? `tasks:stopping` : `test:tasks:stopping`;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  private getProcessingRunsKey(taskId: string): string {
    return `${this.processingRunsKey}:${taskId}`;
  }

  private getTotalRunsKey(taskId: string): string {
    return `${this.totalRunsKey}:${taskId}`;
  }

  async add(taskId: string, runId: string, runCount: number): Promise<void> {
    this.redis.multi();
    this.redis.hset(
      this.getProcessingRunsKey(taskId),
      runId,
      runCount.toString(),
    );
    this.redis.incr(this.getTotalRunsKey(taskId));
    await this.redis.exec();
  }

  async removeRun(taskId: string, runId: string): Promise<void> {
    await this.redis.hdel(this.getProcessingRunsKey(taskId), runId);
  }

  async hasProcessingRuns(taskId: string): Promise<boolean> {
    const count = await this.redis.hlen(this.getProcessingRunsKey(taskId));
    return count > 0;
  }

  async getProcessingRunCount(taskId: string): Promise<number> {
    return await this.redis.hlen(this.getProcessingRunsKey(taskId));
  }

  async getTotalRunCount(taskId: string): Promise<number> {
    const count = await this.redis.get(this.getTotalRunsKey(taskId));
    return count ? parseInt(count, 10) : 0;
  }

  async getProcessingRuns(taskId: string): Promise<string[]> {
    return await this.redis.hkeys(this.getProcessingRunsKey(taskId));
  }

  async clearProcessingRuns(taskId: string): Promise<void> {
    await this.redis.del(this.getProcessingRunsKey(taskId));
  }

  async clearTotalRuns(taskId: string): Promise<void> {
    await this.redis.del(this.getTotalRunsKey(taskId));
  }

  async delete(taskId: string): Promise<void> {
    this.redis.multi();
    this.redis.del(this.getProcessingRunsKey(taskId));
    this.redis.del(this.getTotalRunsKey(taskId));
    this.redis.srem(this.stoppingTasksKey, taskId);
    await this.redis.exec();
  }

  async clear(): Promise<void> {
    const groupKeys = await Promise.all([
      this.redis.keys(`${this.processingRunsKey}:*`),
      this.redis.keys(`${this.totalRunsKey}:*`),
    ]);

    for (const keys of groupKeys) {
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
    await this.redis.del(this.stoppingTasksKey);
  }

  async markTaskAsStopping(taskId: string): Promise<void> {
    await this.redis.sadd(this.stoppingTasksKey, taskId);
  }

  async removeTaskFromStopping(taskId: string): Promise<void> {
    await this.redis.srem(this.stoppingTasksKey, taskId);
  }

  async isTaskStopping(taskId: string): Promise<boolean> {
    return await this.redis.sismember(this.stoppingTasksKey, taskId) === 1;
  }

  async markTasksAsStopping(taskIds: string[]): Promise<void> {
    await this.redis.sadd(this.stoppingTasksKey, ...taskIds);
  }

  async getStoppingTasks(): Promise<string[]> {
    return await this.redis.smembers(this.stoppingTasksKey);
  }

  async isTaskCompletable(taskId: string): Promise<boolean> {
    this.redis.multi();
    this.redis.sismember(this.stoppingTasksKey, taskId);
    this.redis.hlen(this.getProcessingRunsKey(taskId));
    const [isStopping, processingRuns] = await this.redis.exec();
    return isStopping === 0 && processingRuns === 0;
  }
}
