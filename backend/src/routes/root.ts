import { FastifyPluginAsync } from "fastify";

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/health", async () => {
    return { status: "ok", timestamp: new Date() };
  });
};

export default root;
