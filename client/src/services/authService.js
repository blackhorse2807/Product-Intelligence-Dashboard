import api from "./api";

export const authService = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  me: () => api.get("/auth/me"),
  updateProfile: (payload) => api.patch("/auth/profile", payload),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append("avatar", file);
    return api.post("/auth/profile/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (payload) => api.post("/auth/reset-password", payload),
};
