import api from "./api";

export const productService = {
  getAll: () => api.get("/products"),
  getById: (id) => api.get(`/products/${id}`),
  create: (payload) => api.post("/products", payload),
  update: (id, payload) => api.patch(`/products/${id}`, payload),
  enhanceTitle: (id) => api.post(`/products/${id}/enhance-title`),
  setTitleSource: (id, source) => api.patch(`/products/${id}/title-source`, { source }),
  getCompetitorPrices: (id) => api.get(`/products/${id}/competitor-prices`),
};
