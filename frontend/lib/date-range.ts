const DAY_MS = 86_400_000;

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Today and 365 days ago (UTC date parts), for report/log filters. */
export function getDefaultReportDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(Date.now() - 365 * DAY_MS);
  return { start: toISODate(start), end: toISODate(end) };
}
