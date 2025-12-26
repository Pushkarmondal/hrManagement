import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "../generated/prisma/client";
import { DATABASE_URL } from "../config/connections";

export const prisma = new PrismaClient({
  accelerateUrl: DATABASE_URL as string,
}).$extends(withAccelerate());