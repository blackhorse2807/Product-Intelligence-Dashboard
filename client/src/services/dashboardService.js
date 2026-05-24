import api from "./api";

export const dashboardService = {
  getQualitySummary: () => api.get("/dashboard/quality-summary"),
};
