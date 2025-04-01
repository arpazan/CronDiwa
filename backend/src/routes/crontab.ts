import { FastifyPluginAsync } from "fastify";
import { Crontab } from "../types/type.js";
import {
  removeCrontabFile,
  testCrontabCommand,
  writeCrontabFile,
} from "../utils/cron.js";

const crontabRoutes: FastifyPluginAsync = async (fastify) => {
  // await initCronSystem(fastify.log);

  // Get all crontabs
  fastify.get(
    "/crontabs",
    {
      preHandler: fastify.basicAuth,
    },
    async () => {
      const stmt = await fastify.db.prepare(
        "SELECT * FROM crontabs ORDER BY id"
      );
      const crontabs = (await stmt.all()) as Crontab[];
      return { crontabs };
    }
  );

  // Get single crontab
  fastify.get<{ Params: { id: string } }>(
    "/crontabs/:id",
    {
      preHandler: fastify.basicAuth,
    },
    async (request, reply) => {
      const stmt = await fastify.db.prepare(
        "SELECT * FROM crontabs WHERE id = ?"
      );
      const crontab = (await stmt.get(request.params.id)) as Crontab;

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
    {
      preHandler: fastify.basicAuth,
    },
    async (request, reply) => {
      const { name, schedule, command, active = 1 } = request.body;

      const insertStmt = await fastify.db.prepare(
        "INSERT INTO crontabs (name, schedule, command, active) VALUES (?, ?, ?, ?)"
      );
      const result = await insertStmt.run(name, schedule, command, active);

      const getStmt = await fastify.db.prepare(
        "SELECT * FROM crontabs WHERE id = ?"
      );
      const crontab = await getStmt.get(result.lastID);

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
    {
      preHandler: fastify.basicAuth,
    },
    async (request, reply) => {
      const { id } = request.params;
      const { name, schedule, command, active } = request.body;

      const getStmt = await fastify.db.prepare(
        "SELECT * FROM crontabs WHERE id = ?"
      );
      const crontab = (await getStmt.get(id)) as Crontab;

      if (!crontab) {
        reply.code(404).send({ error: "Crontab not found" });
        return;
      }

      const updateStmt = await fastify.db.prepare(`
      UPDATE crontabs 
      SET 
        name = COALESCE(?, name),
        schedule = COALESCE(?, schedule),
        command = COALESCE(?, command),
        active = COALESCE(?, active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

      await updateStmt.run(
        name !== undefined ? name : null,
        schedule !== undefined ? schedule : null,
        command !== undefined ? command : null,
        active !== undefined ? active : null,
        id
      );

      const getUpdatedStmt = await fastify.db.prepare(
        "SELECT * FROM crontabs WHERE id = ?"
      );
      const updatedCrontab = await getUpdatedStmt.get<Crontab>(id);

      return { crontab: updatedCrontab };
    }
  );

  // Delete crontab
  fastify.delete<{ Params: { id: string } }>(
    "/crontabs/:id",
    {
      preHandler: fastify.basicAuth,
    },
    async (request, reply) => {
      const { id } = request.params;

      const getStmt = await fastify.db.prepare(
        "SELECT * FROM crontabs WHERE id = ?"
      );
      const crontab = (await getStmt.get(id)) as Crontab;

      if (!crontab) {
        reply.code(404).send({ error: "Crontab not found" });
        return;
      }

      const deleteStmt = await fastify.db.prepare(
        "DELETE FROM crontabs WHERE id = ?"
      );
      await deleteStmt.run(id);

      reply.code(204).send();
    }
  );

  // Toggle crontab active status
  fastify.patch<{ Params: { id: string } }>(
    "/crontabs/:id/toggle",
    {
      preHandler: fastify.basicAuth,
    },
    async (request, reply) => {
      const { id } = request.params;
      const getStmt = await fastify.db.prepare(
        "SELECT * FROM crontabs WHERE id = ?"
      );
      const crontab = (await getStmt.get(id)) as Crontab;

      if (!crontab) {
        reply.code(404).send({ error: "Crontab not found" });
        return;
      }

      // Toggle active status
      const newActive = crontab.active === 1 ? 0 : 1;

      const updateStmt = await fastify.db.prepare(`
      UPDATE crontabs 
      SET active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
      await updateStmt.run(newActive, id);

      const getUpdatedStmt = await fastify.db.prepare(
        "SELECT * FROM crontabs WHERE id = ?"
      );
      const updatedCrontab = (await getUpdatedStmt.get(id)) as Crontab;

      if (newActive === 1) {
        // If activated, write the crontab file
        await writeCrontabFile(updatedCrontab, fastify.log);
      } else {
        // If deactivated, remove the crontab file
        await removeCrontabFile(parseInt(id), fastify.log);
      }

      return { crontab: updatedCrontab };
    }
  );

  fastify.post(
    "/crontabs/test-command",
    {
      preHandler: fastify.basicAuth,
    },
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
};

export default crontabRoutes;
