export function getChangeBadgeClasses(change: string): string {
  if (change.startsWith("+")) return "bg-green-100 text-green-700";
  if (change.startsWith("-")) return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-600";
}

export function getChangeSparklineColor(change: string): string {
  if (change.startsWith("+")) return "#16a34a";
  if (change.startsWith("-")) return "#dc2626";
  return "#6b7280";
}
