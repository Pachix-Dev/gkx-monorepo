export const queryKeys = {
  me: ["me"] as const,
  users: ["users"] as const,
  goalkeepers: ["goalkeepers"] as const,
  teams: ["teams"] as const,
  trainingLines: ["training-lines"] as const,
  trainingContents: (
    filters: { trainingLineId?: string; search?: string } = {},
  ) => ["training-contents", filters] as const,
  exercises: (
    filters: {
      trainingContentId?: string;
      difficulty?: string;
      search?: string;
    } = {},
  ) => ["exercises", filters] as const,
  trainingSessions: ["training-sessions"] as const,
  trainingSession: (id: string) => ["training-sessions", id] as const,
  attendance: ["attendance"] as const,
  attendanceBySession: (sessionId?: string) =>
    ["attendance", "session", sessionId ?? "all"] as const,
  evaluations: ["evaluations"] as const,
  evaluationsBySession: (sessionId?: string) =>
    ["evaluations", "session", sessionId ?? "all"] as const,
  sessionContents: (sessionId?: string) =>
    ["session-contents", sessionId ?? "all"] as const,
  sessionExercises: (sessionId?: string) =>
    ["session-exercises", sessionId ?? "all"] as const,
  dashboardKpis: ["dashboard", "kpis"] as const,
  dashboardTrends: ["dashboard", "trends"] as const,
  dashboardHealth: ["dashboard", "health"] as const,
  planUsage: ["plan-limits", "usage"] as const,
  subscriptionsByTenant: (tenantId?: string) =>
    ["subscriptions", "tenant", tenantId ?? "none"] as const,
  activeSubscriptionByTenant: (tenantId?: string) =>
    ["subscriptions", "tenant", tenantId ?? "none", "active"] as const,
  subscriptions: ["subscriptions"] as const,
  planOffers: ["subscriptions", "plans"] as const,
  myPlanChangeRequests: ["subscriptions", "change-requests", "my"] as const,
  planChangeRequests: (status?: string) =>
    ["subscriptions", "change-requests", status ?? "all"] as const,
  dashboardAlerts: ["dashboard", "alerts"] as const,
};
