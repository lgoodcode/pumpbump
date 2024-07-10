// import { Context, Next } from "hono";
// import { logger } from "@/utils/logger.ts";
// import Redis from "ioredis";

// const redis = new Redis(); // Assumes a local Redis instance. Adjust as needed.

// async function rateLimitMiddleware(c: Context, next: Next) {
//   const ip = c.req.header("x-forwarded-for") || "unknown";
//   const key = `ratelimit:${ip}`;
//   const limit = 100;
//   const window = 60;

//   const [current, ttl] = await redis.multi()
//     .incr(key)
//     .ttl(key)
//     .exec() as [number, number][];

//   if (current[1] === 1) {
//     await redis.expire(key, window);
//   }

//   c.header("X-RateLimit-Limit", limit.toString());
//   c.header("X-RateLimit-Remaining", Math.max(0, limit - current[1]).toString());
//   c.header("X-RateLimit-Reset", (ttl[1] > 0 ? ttl[1] : window).toString());

//   if (current[1] > limit) {
//     logger.warn(`Rate limit exceeded for IP: ${ip}`);
//     return c.json({ error: "Too many requests" }, 429);
//   }

//   await next();
// }
