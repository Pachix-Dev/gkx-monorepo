export const queryKeys = {
  me: ["me"] as const,
  users: ["users"] as const,
  goalkeepers: ["goalkeepers"] as const,
  teams: ["teams"] as const,
  trainingLines: ["training-lines"] as const,
  trainingContents: (filters: { trainingLineId?: string; level?: string; search?: string } = {}) =>
    ["training-contents", filters] as const,
  exercises: (filters: { trainingContentId?: string; difficulty?: string; search?: string } = {}) =>
    ["exercises", filters] as const,
  trainingSessions: ["training-sessions"] as const,
  trainingSession: (id: string) => ["training-sessions", id] as const,
  sessionContents: (sessionId?: string) => ["session-contents", sessionId ?? "all"] as const,
  sessionExercises: (sessionId?: string) => ["session-exercises", sessionId ?? "all"] as const,
  dashboardKpis: ["dashboard", "kpis"] as const,
  dashboardHealth: ["dashboard", "health"] as const,
};
