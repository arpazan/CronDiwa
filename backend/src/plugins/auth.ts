import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import basicAuth from "@fastify/basic-auth";

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Validate function for basic auth
  const validate = async (username: string, password: string) => {
    const validUsername = process.env.AUTH_USERNAME || "admin";
    const validPassword = process.env.AUTH_PASSWORD || "password";

    if (username !== validUsername || password !== validPassword) {
      throw new Error("Invalid credentials");
    }
  };

  // Register basic auth plugin
  fastify.register(basicAuth, {
    validate,
    authenticate: { realm: "Crontab API" },
  });

  // Add auth decorator for protected routes
  fastify.decorate("authenticate", async (request: any, reply: any) => {
    try {
      await request.basicAuth();
    } catch (err) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });
};

export default fp(authPlugin);
