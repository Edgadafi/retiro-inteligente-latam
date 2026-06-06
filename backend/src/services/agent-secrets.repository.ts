import { getSupabase, isSupabaseConfigured } from "../db/supabase.client.js";

export interface AgentSecretRow {
  id: string;
  encryptedExport: string;
  networkId: string;
  walletAddress?: string;
  updatedAt?: string;
}

class AgentSecretsRepository {
  async findById(id: string): Promise<AgentSecretRow | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await getSupabase()
      .from("agent_secrets")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      if (error.code === "42P01") return null;
      throw new Error(`Supabase agent_secrets: ${error.message}`);
    }
    if (!data) return null;

    return {
      id: String(data.id),
      encryptedExport: String(data.encrypted_export),
      networkId: String(data.network_id),
      walletAddress:
        data.wallet_address != null ? String(data.wallet_address) : undefined,
      updatedAt: data.updated_at != null ? String(data.updated_at) : undefined,
    };
  }

  async upsert(row: AgentSecretRow): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase requerido para persistir agent_secrets.");
    }

    const { error } = await getSupabase().from("agent_secrets").upsert(
      {
        id: row.id,
        encrypted_export: row.encryptedExport,
        network_id: row.networkId,
        wallet_address: row.walletAddress ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) throw new Error(`Supabase upsert agent_secrets: ${error.message}`);
  }
}

export const agentSecretsRepository = new AgentSecretsRepository();
