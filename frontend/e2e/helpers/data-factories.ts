export function makeAccount() {
  return {
    id: 1,
    email: "admin@email.com",
    name: "Admin SLAX",
    avatar_url: null,
  };
}

export function makeUser(id: number, name: string) {
  return {
    id,
    name,
    last_name: null,
    email: null,
    avatar_url: null,
    product: null,
    product_value: null,
    created_at: "2026-01-10T10:00:00Z",
  };
}

export function makeStats() {
  return {
    total_users: 2,
    users_change: "+5%",
    api_requests: 12,
    requests_change: "+8%",
    revenue: 2000,
    revenue_change: "+10%",
    returns_count: 1,
    returns_lost_value: 120,
    profit: 1880,
    monthly_avg_profit: 1600,
  };
}

export function makeSparklines() {
  return {
    users: [{ date: "2026-01-01", value: 2 }],
    requests: [{ date: "2026-01-01", value: 12 }],
    revenue: [{ date: "2026-01-01", value: 2000 }],
    health: [{ date: "2026-01-01", value: 90 }],
  };
}

