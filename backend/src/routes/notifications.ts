import { Router } from "express";
import { authorize } from "../middleware/auth";
import { Role } from "@prisma/client";
import { createNotification } from "../utils/notifications";
import { z } from "zod";

const router = Router();

router.post("/test", authorize(Role.supervisor, Role.teacher), async (req, res, next) => {
  try {
    const schema = z.object({ userId: z.string(), title: z.string(), body: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "common.errors.unexpected", details: parsed.error.flatten() });
    }
    const notification = await createNotification({ ...parsed.data, allowWebPush: true });
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
});

export default router;
