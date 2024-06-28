import { ConsoleHandler, Logger } from "logger";

const IS_PROD = Deno.env.get("DENO_ENV") === "production";

export const logger = new Logger("server", IS_PROD ? "INFO" : "DEBUG", {
  handlers: [
    new ConsoleHandler(IS_PROD ? "INFO" : "DEBUG", {
      useColors: true,
      formatter: (record) =>
        `[${record.datetime.toISOString()}] ${record.levelName} ${record.msg}`,
    }),
  ],
});
