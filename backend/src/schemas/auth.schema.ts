import { JSONSchemaType } from "ajv";

export interface LoginBody {
  username: string;
  password: string;
}

export const loginBodySchema: JSONSchemaType<LoginBody> = {
  type: "object",
  required: ["username", "password"],
  properties: {
    username: { type: "string", minLength: 1 },
    password: { type: "string", minLength: 1 },
  },
  additionalProperties: false,
};

// ---- Response Schema ----
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope: string;
}

export const loginResponseSchema: JSONSchemaType<LoginResponse> = {
  type: "object",
  required: [
    "access_token",
    "refresh_token",
    "expires_in",
    "refresh_expires_in",
    "token_type",
    "scope",
  ],
  properties: {
    access_token: { type: "string" },
    refresh_token: { type: "string" },
    expires_in: { type: "number" },
    refresh_expires_in: { type: "number" },
    token_type: { type: "string" },
    scope: { type: "string" },
  },
  additionalProperties: true,
};
