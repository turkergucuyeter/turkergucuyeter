import dotenv from "dotenv";

dotenv.config();

const requiredEnv = ["DATABASE_URL", "JWT_SECRET"] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d",
  port: Number(process.env.PORT ?? 4000),
  gracePeriodMinutes: Number(process.env.GRACE_PERIOD_MINUTES ?? 10),
  freeWebPush: (process.env.FREE_WEB_PUSH ?? "true").toLowerCase() === "true",
};
