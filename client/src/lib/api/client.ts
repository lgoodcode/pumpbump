import createClient from "openapi-fetch";
import type { paths } from "./routes";

if (!process.env.SERVER_URL) {
  throw new Error("Missing SERVER_URL");
}

export const client = createClient<paths>({
  baseUrl: process.env.SERVER_URL!,
  headers: {
    "Authorization": `Bearer ${process.env.AUTH_TOKEN}`,
  },
});
