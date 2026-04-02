import { z } from "zod";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const sparklinePointSchema = z.object({
  date: z.string(),
  value: z.number(),
});

export const sparklinesSchema = z.object({
  users: z.array(sparklinePointSchema),
  requests: z.array(sparklinePointSchema),
  revenue: z.array(sparklinePointSchema),
  health: z.array(sparklinePointSchema),
});

export type Sparklines = z.infer<typeof sparklinesSchema>;
export type SparklinePoint = z.infer<typeof sparklinePointSchema>;

export async function fetchSparklines(): Promise<Sparklines> {
  const res = await fetch(`${API_BASE}/stats/sparklines`);
  if (!res.ok) throw new Error(`Failed to fetch sparklines: HTTP ${res.status}`);
  const data = await res.json();
  return sparklinesSchema.parse(data);
}
