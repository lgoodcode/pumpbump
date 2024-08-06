import { connect } from "redis";

import { env } from "@/utils/env.ts";

export const createClient = () =>
  connect({
    hostname: env("REDIS_HOST"),
    port: Number(env("REDIS_PORT")),
    password: env("REDIS_PASSWORD"),
  });
