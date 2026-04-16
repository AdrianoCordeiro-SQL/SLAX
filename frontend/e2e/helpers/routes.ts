export const routes = {
  authLogin: "**/auth/login*",
  authMe: "**/auth/me*",
  users: "**/users*",
  usersById: "**/users/*",
  stats: "**/stats*",
  sparklines: "**/stats/sparklines*",
  activity: "**/activity*",
  reports: "**/reports/**",
  alertRules: "**/alerts/rules*",
  alertFirings: "**/alerts/firings?*",
  alertEvaluate: "**/alerts/evaluate*",
};

export function isApiRequest(resourceType: string) {
  return resourceType === "fetch" || resourceType === "xhr";
}

