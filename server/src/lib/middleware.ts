import type { MiddlewareHandler } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { z } from "zod";

import spec from "@/spec.json" with { type: "json" };
import { RouteSchema } from "@/constants/types.ts";
import { IS_PROD } from "@/constants/index.ts";
import { env } from "@/utils/env.ts";
import { logger } from "@/utils/logger.ts";

export const logging: MiddlewareHandler = async (ctx, next) => {
  const start = performance.now();
  await next();

  const duration = performance.now() - start;
  let time = "";
  if (duration > 1000) {
    time = `${duration / 1000}s`;
  } else {
    time = `${duration}ms`;
  }

  logger.info(`${ctx.req.method} ${ctx.req.url} - ${time}`);
};

export const authentication: MiddlewareHandler = async (ctx, next) => {
  if (ctx.req.path === "/docs" && !IS_PROD) {
    return await next();
  }

  const secret = ctx.req.header("Authorization")?.split("Bearer ")[1];
  console.log("secret", secret);
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
    // @ts-ignore - This is fine
  })(ctx, next);
};

/**
 * Parses and validates the request body, params, and queries against the provided
 * schemas and sets the parsed values on the context object under the "data" key.
 * @param schemas
 */
export const validate =
  (schemas: RouteSchema): MiddlewareHandler => async (ctx, next) => {
    if (!Object.keys(schemas).length) {
      console.warn("No schemas provided to validate middleware");
      return await next();
    }

    const contentType = ctx.req.header("Content-Type");
    if (schemas.body && contentType !== "application/json") {
      return ctx.json({ error: "Invalid Content-Type" }, 400);
    }

    const errors: Record<string, { _errors: string[] }> = {};
    const params: Record<string, any> = {};
    const queries: Record<string, any> = {};
    let body = {};

    if (schemas.body) {
      try {
        body = await ctx.req.json();
      } catch (_) {
        return ctx.json({
          errors: {
            body: {
              body: {
                _errors: ["Invalid JSON"],
              },
            },
          },
        }, 400);
      }

      try {
        body = schemas.body.parse(body);
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
          params[param] = value;
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
          queries[query] = value;
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

    ctx.set("data", {
      body,
      params,
      queries,
    });

    await next();
  };
