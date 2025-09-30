import jwt, { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "../config/env";
import { Role } from "@prisma/client";

export const signAccessToken = (userId: string, role: Role) => {
  const expiresIn = env.jwtExpiresIn as StringValue;
  const options: SignOptions = { subject: userId, expiresIn };
  return jwt.sign({ role }, env.jwtSecret, options);
};

export const signRefreshToken = (userId: string, role: Role) => {
  const expiresIn = env.refreshTokenExpiresIn as StringValue;
  const options: SignOptions = { subject: userId, expiresIn };
  return jwt.sign({ role, type: "refresh" }, env.jwtSecret, options);
};
