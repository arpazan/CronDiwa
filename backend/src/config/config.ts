import dotenv from "dotenv";
import path from "path";

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });


export const config = {
  app: {
    url: process.env.APP_URL || "http://localhost:3000",
    port: parseInt(process.env.APP_PORT || "3000", 10),
    env: process.env.NODE_ENV || "development",
  },
  keycloak: {
    domain: process.env.KEYCLOAK_DOMAIN || "http://localhost:8080",
    realm: process.env.KEYCLOAK_REALM || "default",
    clientId: process.env.KEYCLOAK_CLIENT_ID || "myclient",
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "secret",
  },
};
