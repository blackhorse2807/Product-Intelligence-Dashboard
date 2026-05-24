import api from "./api";

export const productService = {
  getAll: () => api.get("/products"),
  getById: (id) => api.get(`/products/${id}`),
  create: (payload) => api.post("/products", payload),
  update: (id, payload) => api.patch(`/products/${id}`, payload),
  enhanceTitle: (id) => api.post(`/products/${id}/enhance-title`),
  setTitleSource: (id, source) => api.patch(`/products/${id}/title-source`, { source }),
  getCompetitorPrices: (id) => api.get(`/products/${id}/competitor-prices`),
  downloadReport: async (id, format = "csv") => {
    const res = await api.get(`/products/${id}/report`, {
      params: { format },
      responseType: "blob",
    });
    const disposition = res.headers["content-disposition"] || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] || `product-report-${id}.${format}`;
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
