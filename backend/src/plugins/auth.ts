import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import keycloakAdapter, { KeycloakOptions } from "fastify-keycloak-adapter";
import { config } from "../config/config.js";

export default fp(async (fastify: FastifyInstance) => {

  const opts: KeycloakOptions = {
    appOrigin: config.app.url,
    keycloakSubdomain: `${config.keycloak.domain.replace(/^https?:\/\//, "")}/realms/${config.keycloak.realm}`,
    useHttps: config.keycloak.domain.startsWith("https"),
    clientId: config.keycloak.clientId,
    clientSecret: config.keycloak.clientSecret,
    excludedPatterns: [
      "/crondiwa/api/health",
      "/crondiwa/api/login",
    ],
    unauthorizedHandler: (request, reply) => {
      reply.status(401).send({
        error: "Unauthorized",
        message:
          "Access denied. You are not authorized to perform this action.",
      });
    },
  };

  await fastify.register(keycloakAdapter.default, opts);
});
