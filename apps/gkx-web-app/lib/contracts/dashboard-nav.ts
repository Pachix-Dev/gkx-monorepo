import { UserRole } from "@/lib/auth/types";

export type DashboardNavItem = {
  href: string;
  label: string;
  section: "core" | "phase-1" | "training" | "system";
  roles?: UserRole[];
  implemented: boolean;
  openapiPath?: string;
};

// Source of truth: openapi.json paths + product route structure.
export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    section: "core",
    implemented: true,
  },
  {
    href: "/users",
    label: "Users",
    section: "phase-1",
    roles: ["SUPER_ADMIN", "TENANT_ADMIN"],
    implemented: true,
    openapiPath: "/api/users",
  },
  {
    href: "/goalkeepers",
    label: "Goalkeepers",
    section: "phase-1",
    roles: ["SUPER_ADMIN", "TENANT_ADMIN", "COACH", "ASSISTANT_COACH", "READONLY"],
    implemented: true,
    openapiPath: "/api/goalkeepers",
  },
  {
    href: "/coaches",
    label: "Coaches",
    section: "phase-1",
    roles: ["SUPER_ADMIN", "TENANT_ADMIN", "COACH", "ASSISTANT_COACH", "READONLY"],
    implemented: true,
    openapiPath: "/api/coaches",
  },
  {
    href: "/teams",
    label: "Teams",
    section: "phase-1",
    roles: ["SUPER_ADMIN", "TENANT_ADMIN", "COACH", "ASSISTANT_COACH", "READONLY"],
    implemented: true,
    openapiPath: "/api/teams",
  },
  {
    href: "/training-lines",
    label: "Training Lines",
    section: "training",
    roles: ["SUPER_ADMIN", "TENANT_ADMIN", "COACH", "ASSISTANT_COACH", "READONLY"],
    implemented: true,
    openapiPath: "/api/training-lines",
  },
  {
    href: "/training-contents",
    label: "Training Contents",
    section: "training",
    roles: ["SUPER_ADMIN", "TENANT_ADMIN", "COACH", "ASSISTANT_COACH", "READONLY"],
    implemented: true,
    openapiPath: "/api/training-contents",
  },
  {
    href: "/exercises",
    label: "Exercises",
    section: "training",
    roles: ["SUPER_ADMIN", "TENANT_ADMIN", "COACH", "ASSISTANT_COACH", "READONLY"],
    implemented: true,
    openapiPath: "/api/exercises",
  },
  {
    href: "/training-sessions",
    label: "Training Sessions",
    section: "training",
    roles: ["SUPER_ADMIN", "TENANT_ADMIN", "COACH", "ASSISTANT_COACH", "READONLY"],
    implemented: true,
    openapiPath: "/api/training-sessions",
  },
  {
    href: "/tactical-editor",
    label: "Tactical Editor",
    section: "training",
    roles: ["SUPER_ADMIN", "TENANT_ADMIN", "COACH", "ASSISTANT_COACH", "READONLY"],
    implemented: true,
  },
  {
    href: "/attendance",
    label: "Attendance",
    section: "training",
    roles: ["SUPER_ADMIN", "TENANT_ADMIN", "COACH", "ASSISTANT_COACH", "READONLY"],
    implemented: true,
    openapiPath: "/api/attendance",
  },
  {
    href: "/evaluations",
    label: "Evaluations",
    section: "training",
    roles: ["SUPER_ADMIN", "TENANT_ADMIN", "COACH", "ASSISTANT_COACH", "READONLY"],
    implemented: true,
    openapiPath: "/api/evaluations",
  },
  {
    href: "/tenants",
    label: "Tenants",
    section: "system",
    roles: ["SUPER_ADMIN"],
    implemented: true,
    openapiPath: "/api/tenants",
  },
  {
    href: "/settings",
    label: "Settings",
    section: "system",
    roles: ["SUPER_ADMIN", "TENANT_ADMIN", "COACH", "ASSISTANT_COACH", "READONLY"],
    implemented: true,
  },
];

export const DASHBOARD_NAV_SECTIONS: Array<{ key: DashboardNavItem["section"]; label: string }> = [
  { key: "core", label: "Core" },
  { key: "phase-1", label: "Phase 1" },
  { key: "training", label: "Training" },
  { key: "system", label: "System" },
];
