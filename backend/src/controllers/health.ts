import type { Request, Response } from "express";
import { getSupabase, isSupabaseConfigured } from "../db/supabase.client.js";

function timestamp(): string {
  return new Date().toISOString();
}

export async function testDbConnection(_req: Request, res: Response): Promise<void> {
  const ts = timestamp();

  if (!isSupabaseConfigured()) {
    res.status(503).json({
      status: "error",
      data: {
        connection: "inactive",
        timestamp: ts,
        db_schema: "unknown",
      },
      error: "Supabase no configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env",
    });
    return;
  }

  try {
    const supabase = getSupabase();

    const [deposits, logs, plans] = await Promise.all([
      supabase.from("deposits").select("fid").limit(1),
      supabase.from("deposit_state_logs").select("id").limit(1),
      supabase.from("savings_plans").select("user_id").limit(1),
    ]);

    const schemaOk =
      !deposits.error && !logs.error && !plans.error;

    if (!schemaOk) {
      res.status(500).json({
        status: "error",
        data: {
          connection: "degraded",
          timestamp: ts,
          db_schema: "incomplete",
        },
        error: [
          deposits.error?.message,
          logs.error?.message,
          plans.error?.message,
        ]
          .filter(Boolean)
          .join("; "),
      });
      return;
    }

    res.json({
      status: "success",
      data: {
        connection: "active",
        timestamp: ts,
        db_schema: "confirmed",
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      data: {
        connection: "inactive",
        timestamp: ts,
        db_schema: "unknown",
      },
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
