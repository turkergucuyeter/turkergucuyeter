import { Router } from "express";
import { prisma } from "../config/prisma";
import { comparePassword } from "../utils/password";
import { signAccessToken, signRefreshToken } from "../utils/token";
import { z } from "zod";
import { createAuditLog } from "../utils/audit";
import { t } from "../utils/i18n";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "common.errors.unexpected", details: result.error.flatten() });
  }

  const { email, password } = result.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "auth.login.invalidCredentials" });
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: "auth.login.invalidCredentials" });
  }

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id, user.role);

  await createAuditLog({
    userId: user.id,
    action: "login",
    entity: "user",
    entityId: user.id,
    meta: { email },
  });

  return res.json({
    message: t("auth.login.success"),
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
      },
    },
  });
});

export default router;
