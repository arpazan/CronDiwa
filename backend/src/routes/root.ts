import axios from "axios";
import { FastifyPluginAsync } from "fastify";
import {
  LoginBody,
  loginBodySchema,
  loginResponseSchema,
} from "../schemas/auth.schema.js";
import { config } from "../config/config.js";

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post<{ Body: LoginBody }>(
    "/login",
    {
      schema: {
        body: loginBodySchema,
        response: {
          200: loginResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { username, password } = request.body;

      try {
        const tokenRes = await axios.post(
          `${config.keycloak.domain}/realms/${config.keycloak.realm}/protocol/openid-connect/token`,
          new URLSearchParams({
            grant_type: "password",
            client_id: config.keycloak.clientId,
            client_secret: config.keycloak.clientSecret,
            username,
            password,
          }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        return tokenRes.data; // contains access_token, refresh_token, etc.
      } catch (err: any) {
        fastify.log.error(err.response?.data || err.message);
        return reply.code(401).send({ error: "Invalid credentials" });
      }
    }
  );
  fastify.get("/health", async () => {
    return { status: "ok", timestamp: new Date() };
  });
};

export default root;
