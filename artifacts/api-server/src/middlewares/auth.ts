import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../lib/jwt.js";
import { db, ranchUsersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { role: string };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: true, message: "Authorization token required" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);

    const [ranchUser] = await db
      .select({ role: ranchUsersTable.role })
      .from(ranchUsersTable)
      .where(and(eq(ranchUsersTable.userId, payload.userId), eq(ranchUsersTable.ranchId, payload.ranchId)))
      .limit(1);

    const rawRole = ranchUser?.role ?? "owner";
    const role = rawRole === "member" ? "ranch_hand" : rawRole;

    req.user = { ...payload, role };
    next();
  } catch {
    res.status(401).json({ error: true, message: "Invalid or expired token" });
  }
}

export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "owner") {
    res.status(403).json({ error: true, message: "Owner access required" });
    return;
  }
  next();
}

export function requireNotViewer(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role === "viewer") {
    res.status(403).json({ error: true, message: "Viewers have read-only access" });
    return;
  }
  next();
}
