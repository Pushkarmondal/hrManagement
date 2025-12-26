import type { Request, Response } from "express";
import { prisma } from "../../db/db";

export async function healthCheck(req: Request, res: Response) {
  const startDate = new Date();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const totalTime = Number(Date.now() - startDate.getTime());

    res.status(200).json({
      status: "ok",
      db: "connected",
      totalTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "degraded",
      db: "disconnected",
      error: "Database unreachable",
      timestamp: new Date().toISOString(),
    });
  }
}
