import type { DashboardData } from "@/types";
import { request } from "./http";
import { toOrderStatus } from "./mappers";

export const dashboardService = {
  get: async (days: number, signal?: AbortSignal): Promise<DashboardData> => {
    const data = await request<DashboardData>("/admin/dashboard", { admin: true, query: { days }, signal });
    const byStatus: DashboardData["byStatus"] = {};
    for (const [status, count] of Object.entries(data.byStatus ?? {})) byStatus[toOrderStatus(status)] = count;
    return { ...data, byStatus };
  },
};
