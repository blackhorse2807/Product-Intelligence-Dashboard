import api from "./api";

export const alertService = {
  getAll: () => api.get("/alerts"),
};
