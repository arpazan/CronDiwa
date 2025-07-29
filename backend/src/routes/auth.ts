import { FastifyPluginAsync } from "fastify";
import axios from "axios";
import {
  LoginBody,
  loginBodySchema,
  loginResponseSchema,
} from "../schemas/auth.schema.js";
import { config } from "../config/config.js";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const KEYCLOAK_ISSUER = `${config.keycloak.domain}/realms/${config.keycloak.realm}`;
  const KEYCLOAK_CLIENT_ID = config.keycloak.clientId;
  const KEYCLOAK_CLIENT_SECRET = config.keycloak.clientSecret;
  fastify.post<{ Body: LoginBody }>(
    "/auth/login",
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
          `${KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
          new URLSearchParams({
            grant_type: "password",
            client_id: KEYCLOAK_CLIENT_ID,
            client_secret: KEYCLOAK_CLIENT_SECRET,
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

  fastify.get("/auth/me", async (request, reply) => {
    const user = request.session?.user;
    return reply.status(200).send({ user });
  });

  fastify.post("/auth/refresh", async (request, reply) => {
    const { refresh_token } = request.body as { refresh_token: string };

    if (!refresh_token) {
      return reply.status(400).send({ error: "Missing refresh token" });
    }

    try {
      // If using Keycloak token endpoint
      const tokenEndpoint = `${KEYCLOAK_ISSUER}/protocol/openid-connect/token`;

      const res = await axios.post(
        tokenEndpoint,
        new URLSearchParams({
          client_id: KEYCLOAK_CLIENT_ID,
          client_secret: KEYCLOAK_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      return {
        access_token: res.data.access_token,
        refresh_token: res.data.refresh_token,
        expires_in: res.data.expires_in,
      };
    } catch (err: any) {
      console.error("Refresh token failed", err.response?.data || err.message);
      return reply.status(401).send({ error: "Invalid refresh token" });
    }
  });
};

export default authRoutes;
