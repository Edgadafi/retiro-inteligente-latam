export interface ProjectionResult {
  cetes: {
    finalFund: number;
    totalContributed: number;
    totalYield: number;
    annualRate: number;
  };
  afore: {
    finalFund: number;
    totalContributed: number;
    totalYield: number;
    annualRate: number;
  };
  advantageMxnb: number;
  advantagePercent: number;
}

export async function fetchProjection(params: {
  contributionPerPeriod: number;
  periods: number;
  frequency: "daily" | "weekly";
}): Promise<ProjectionResult> {
  const res = await fetch("/api/projection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Error al calcular proyección");
  return res.json() as Promise<ProjectionResult>;
}
