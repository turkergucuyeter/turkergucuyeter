import express from "express";
import cors from "cors";
import { env } from "./config/env";
import authRoutes from "./routes/auth";
import supervisorRoutes from "./routes/supervisor";
import teacherRoutes from "./routes/teacher";
import studentRoutes from "./routes/student";
import notificationRoutes from "./routes/notifications";
import { authenticate } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";
import { prisma } from "./config/prisma";
import path from "node:path";
import fs from "node:fs";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/docs/openapi.json", (_req, res) => {
  const filePath = path.join(process.cwd(), "docs/openapi.json");
  const file = fs.readFileSync(filePath, "utf-8");
  res.setHeader("Content-Type", "application/json");
  res.send(file);
});

app.use("/auth", authRoutes);
app.use(authenticate);
app.use("/supervisor", supervisorRoutes);
app.use("/teacher", teacherRoutes);
app.use("/student", studentRoutes);
app.use("/notifications", notificationRoutes);

app.use(errorHandler);

const server = app.listen(env.port, () => {
  console.log(`Attendance API running on port ${env.port}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});
