import * as path from "node:path";
import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import { FastifyPluginAsync } from "fastify";
import { fileURLToPath } from "node:url";
import { initCronSystem } from "./utils/cron.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type AppOptions = {
  // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>;

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, "plugins"),
    options: opts,
    forceESM: true,
  });

  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, "routes"),
    options: { prefix: "/api", ...opts },
    forceESM: true,
  });

  fastify.addHook("onReady", async () => {
    try {
      initCronSystem(fastify.log)
    } catch (err) {
      fastify.log.error("Cron init failed:", err);
      throw err;
    }
  });

};
export default app;
export { app, options };
