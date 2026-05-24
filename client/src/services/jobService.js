import api from "./api";

export const jobService = {
  getAll: () => api.get("/jobs"),
  getById: (id) => api.get(`/jobs/${id}`),
};
