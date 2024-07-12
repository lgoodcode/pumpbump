import { Hono as _Hono } from "hono";

import { RouteData } from "@/constants/types.ts";

/**
 * This wraps the Hono class to provide type safety for the data object
 * and infer the property exists on the context object.
 */
export const Hono = _Hono<{ Variables: { data: RouteData } }>;
