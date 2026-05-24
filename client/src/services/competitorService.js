import api from "./api";

export const competitorService = {
  refresh: (productId) => api.post(`/competitor-prices/refresh/${productId}`),
  getPricing: (productId) => api.get(`/competitor-prices/${productId}`),
};
