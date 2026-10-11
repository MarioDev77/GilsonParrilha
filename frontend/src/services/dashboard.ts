import type { DashboardData } from "@/types";
import { request } from "./http";

export const dashboardService = {
  get: (days: number, signal?: AbortSignal) =>
    request<DashboardData>("/admin/dashboard", { admin: true, query: { days }, signal }),
};
