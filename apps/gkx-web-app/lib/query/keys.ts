export const queryKeys = {
  me: ["me"] as const,
  users: ["users"] as const,
  goalkeepers: ["goalkeepers"] as const,
  coaches: ["coaches"] as const,
  teams: ["teams"] as const,
  trainingLines: ["training-lines"] as const,
  trainingContents: (filters: { trainingLineId?: string; level?: string; search?: string } = {}) =>
    ["training-contents", filters] as const,
  exercises: (filters: { trainingContentId?: string; difficulty?: string; search?: string } = {}) =>
    ["exercises", filters] as const,
  dashboardKpis: ["dashboard", "kpis"] as const,
  dashboardHealth: ["dashboard", "health"] as const,
};
