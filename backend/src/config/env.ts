import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

required.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`Environment variable ${key} is not set. Using default placeholder.`);
  }
});

export const env = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  databaseUrl: process.env.DATABASE_URL ?? 'file:./dev.db',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
  accessTokenTtlMinutes: parseInt(process.env.JWT_ACCESS_TTL_MIN ?? '30', 10),
  refreshTokenTtlDays: parseInt(process.env.JWT_REFRESH_TTL_DAYS ?? '7', 10),
  allowWebPush: (process.env.ALLOW_WEB_PUSH ?? 'false').toLowerCase() === 'true',
  attendanceGraceMinutes: parseInt(process.env.ATTENDANCE_GRACE_MINUTES ?? '0', 10),
};
