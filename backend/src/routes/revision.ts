import { FastifyPluginAsync } from "fastify";

const revisionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { table_name: string; record_id: string } }>(
    "/revisions/:table_name/:record_id",
    async (request, reply) => {
      const { table_name, record_id } = request.params;
      if (table_name === undefined || record_id === undefined) {
        reply
          .code(400)
          .send({ error: "Table name and record id are required" });
        return;
      }

      const revisions = await fastify.revisionService.list(
        table_name as string,
        record_id as string
      );
      const total = await fastify.revisionService.count(
        table_name as string,
        record_id as string
      );

      reply.code(200).send({ total, revisions });
    }
  );
};

export default revisionRoutes;
