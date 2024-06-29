import type { MiddlewareHandler } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { z } from "zod";

import spec from "../spec.json" with { type: "json" };
import { IS_PROD } from "../constants/index.ts";
import { env, logger } from "../utils/index.ts";

export const logging: MiddlewareHandler = async (ctx, next) => {
  logger.info(`${ctx.req.method} - ${ctx.req.url}`);
  return await next();
};

export const authentication: MiddlewareHandler = async (ctx, next) => {
  if (ctx.req.path === "/docs" && !IS_PROD) {
    return await next();
  }

  const secret = ctx.req.header("Authorization")?.split("Bearer ")[1];
  if (!secret || env("AUTH_TOKEN") !== secret) {
    logger.error("Unauthorized");
    ctx.status(401);
    return ctx.json({ error: "Unauthorized" });
  }
  return await next();
};

export const swagger: MiddlewareHandler = (ctx, next) => {
  return swaggerUI({
    spec,
    url: "/docs",
  })(ctx, next);
};

export const validate = (schemas: {
  body?: z.Schema;
  params?: Record<string, z.Schema>;
  query?: Record<string, z.Schema>;
}): MiddlewareHandler =>
async (ctx, next) => {
  const errors: Record<string, { _errors: string[] }> = {};

  if (schemas.body) {
    try {
      const body = await ctx.req.json();
      schemas.body.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors["body"] = error.format();
      } else {
        throw error;
      }
    }
  }

  if (schemas.params) {
    for (const [param, schema] of Object.entries(schemas.params)) {
      const value = ctx.req.param(param);
      try {
        schema.parse(value);
      } catch (error) {
        if ((error instanceof z.ZodError)) {
          errors[param] = error.format();
        } else {
          throw error;
        }
      }
    }
  }

  if (schemas.query) {
    for (const [query, schema] of Object.entries(schemas.query)) {
      const value = ctx.req.query(query);
      try {
        schema.parse(value);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors[query] = error.format();
        } else {
          throw error;
        }
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return ctx.json({ errors }, 400);
  }

  await next();
};
