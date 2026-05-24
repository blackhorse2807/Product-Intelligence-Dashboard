import api from "./api";

export const uploadService = {
  uploadVideo: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("video", file);
    return api.post("/upload-video", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
  },
  uploadCsv: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("csvFile", file);
    return api.post("/upload-products-csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
  },
};
