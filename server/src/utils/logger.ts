import { ConsoleHandler, Logger } from "logger";

const IS_PROD = Deno.env.get("DENO_ENV") === "production";

export const logger = new Logger("server", IS_PROD ? "INFO" : "DEBUG", {
  handlers: [
    new ConsoleHandler(IS_PROD ? "INFO" : "DEBUG", {
      useColors: true,
      formatter: (record) => {
        let msg =
          `${record.datetime.toISOString()} [${record.levelName}] ${record.msg}`;

        // If it's an error log and has an associated error object with a stack
        if (
          record.level === 40 && record.args[0] instanceof Error &&
          record.args[0].stack
        ) {
          msg += `\n${record.args[0].stack}`;
        }

        return msg;
      },
    }),
  ],
});
