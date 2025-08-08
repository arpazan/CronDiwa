import fp from "fastify-plugin";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import keycloakAdapter, { KeycloakOptions } from "fastify-keycloak-adapter";
import { config } from "../config/config.js";

declare module "fastify" {
  interface FastifyRequest {
    session?: {
      user?: {
        account: string;
        name: string;
      };
    };
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const unauthorizedHandler = (_: FastifyRequest, reply: FastifyReply) => {
    reply.status(401).send(`Invalid request`);
  };
  const opts: KeycloakOptions = {
    appOrigin: config.app.url,
    keycloakSubdomain: `${config.keycloak.domain.replace(
      /^https?:\/\//,
      ""
    )}/realms/${config.keycloak.realm}`,
    useHttps: config.keycloak.domain.startsWith("https"),
    clientId: config.keycloak.clientId,
    clientSecret: config.keycloak.clientSecret,
    excludedPatterns: ["/crondiwa/api/health", "/crondiwa/api/auth/login"],
    unauthorizedHandler,
  };

  await fastify.register(keycloakAdapter.default, opts);
});
