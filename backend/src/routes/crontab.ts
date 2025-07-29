import { FastifyPluginAsync } from "fastify";
import { Crontab } from "../types/type.js";
import {
  clearCrontabLogs,
  readCrontabLogs,
  removeCrontabFile,
  testCrontabCommand,
  writeCrontabFile,
} from "../utils/cron.js";
import { Action } from "../domains/revision/type.js";

const crontabRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all crontabs
  fastify.get(
    "/crontabs",
    async () => {
      const crontabs = await fastify.cronService.list();
      return { crontabs };
    }
  );

  // Get single crontab
  fastify.get<{ Params: { id: string } }>(
    "/crontabs/:id",
    async (request, reply) => {
      const crontab = await fastify.cronService.get(parseInt(request.params.id));

      if (!crontab) {
        reply.code(404).send({ error: "Crontab not found" });
        return;
      }

      return { crontab };
    }
  );

  // Create new crontab
  fastify.post<{
    Body: { name: string; schedule: string; command: string; active?: number };
  }>(
    "/crontabs",
    async (request, reply) => {
      const { name, schedule, command, active = 0 } = request.body;

      const result = await fastify.cronService.create({ name, schedule, command, active } as Crontab);

      const crontab = await fastify.cronService.get(result.lastID as number);

      reply.code(201).send({ crontab });
    }
  );

  // Update crontab
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      schedule?: string;
      command?: string;
      active?: number;
    };
  }>(
    "/crontabs/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { name, schedule, command, active } = request.body;

      const crontab = await fastify.cronService.get(parseInt(id));
      if (!crontab) {
        reply.code(404).send({ error: "Crontab not found" });
        return;
      }

      const result = await fastify.cronService.update(parseInt(id), { name, schedule, command, active } as Crontab);

      if (result.changes === 0) {
        reply.code(400).send({ error: "Failed to update crontab" });
        return;
      }

      await fastify.revisionService.create("crontabs", Action.UPDATE, crontab);

      return { crontab: crontab };
    }
  );

  // Delete crontab
  fastify.delete<{ Params: { id: string } }>(
    "/crontabs/:id",
    async (request, reply) => {
      const { id } = request.params;

      const crontab = await fastify.cronService.get(parseInt(id));

      if (!crontab) {
        reply.code(404).send({ error: "Crontab not found" });
        return;
      }

      await fastify.cronService.delete(parseInt(id));
      await fastify.revisionService.create("crontabs", Action.DELETE, crontab);
      await removeCrontabFile(parseInt(id), fastify.log);
      reply.code(204).send();
    }
  );

  // Toggle crontab active status
  fastify.patch<{ Params: { id: string } }>(
    "/crontabs/:id/toggle",
    async (request, reply) => {
      const { id } = request.params;
      const crontab = await fastify.cronService.get(parseInt(id));

      if (!crontab) {
        reply.code(404).send({ error: "Crontab not found" });
        return;
      }

      // Toggle active status
      const newActive = crontab.active === 1 ? 0 : 1;

      const result = await fastify.cronService.update(parseInt(id), { ...crontab, active: newActive } as Crontab);

      const updatedCrontab = await fastify.cronService.get(parseInt(id));

      if (result.changes === 0) {
        reply.code(400).send({ error: "Failed to update crontab" });
        return;
      }

      if (newActive === 1) {
        // If activated, write the crontab file
        await writeCrontabFile(updatedCrontab as Crontab, fastify.log);
      } else {
        // If deactivated, remove the crontab file
        await removeCrontabFile(parseInt(id), fastify.log);
      }

      return { crontab: updatedCrontab };
    }
  );

  fastify.post(
    "/crontabs/test-command",
    async (request, reply) => {
      const { command } = request.body as { command: string };

      if (!command) {
        reply.code(400).send({ error: "Command is required" });
        return;
      }

      try {
        const result = await testCrontabCommand(command, fastify.log);
        return result;
      } catch (error) {
        fastify.log.error(`Error testing command: ${error}`);
        reply.code(500).send({ error: `Failed to test command: ${error}` });
      }
    }
  );

  fastify.get<{ Params: { id: string } }>(
    "/crontabs/:id/logs",
    async (request, reply) => {
      const { id } = request.params;

      try {
        // Check if the crontab exists
        const crontab = await fastify.cronService.get(parseInt(id));

        if (!crontab) {
          reply.code(404).send({ error: "Crontab not found" });
          return;
        }

        const logs = await readCrontabLogs(parseInt(id), fastify.log);

        return {
          crontab: { id: crontab.id, name: crontab.name },
          logs,
        };
      } catch (error) {
        fastify.log.error(`Error fetching logs for crontab ${id}: ${error}`);
        reply.code(500).send({ error: `Failed to fetch logs: ${error}` });
      }
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/crontabs/:id/logs",
    async (request, reply) => {
      const { id } = request.params;

      try {
        // Check if the crontab exists
        const crontab = await fastify.cronService.get(parseInt(id));

        if (!crontab) {
          reply.code(404).send({ error: "Crontab not found" });
          return;
        }

        await clearCrontabLogs(parseInt(id), fastify.log);

        return { success: true };
      } catch (error) {
        fastify.log.error(`Error clearing logs for crontab ${id}: ${error}`);
        reply.code(500).send({ error: `Failed to clear logs: ${error}` });
      }
    }
  );
};

export default crontabRoutes;
