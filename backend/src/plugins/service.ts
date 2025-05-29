import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { CronService } from "../domains/cron/cron.service.js";
import { RevisionService } from "../domains/revision/revision.service.js";

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate("cronService", new CronService(fastify));
  fastify.decorate("revisionService", new RevisionService(fastify));
});

declare module "fastify" {
  interface FastifyInstance {
    cronService: CronService;
    revisionService: RevisionService;
  }
}