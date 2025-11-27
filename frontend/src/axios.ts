import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000", // your Django backend
  withCredentials: false,
});

// Auto-attach token
api.interceptors.request.use(config => {
  const access = localStorage.getItem("access");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Auto-refresh token
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refresh = localStorage.getItem("refresh");
      if (!refresh) return Promise.reject(err);

      try {
        const res = await api.post("/api/token/refresh/", { refresh });

        localStorage.setItem("access", res.data.access);
        original.headers["Authorization"] = `Bearer ${res.data.access}`;

        return api(original);
      } catch (e) {
        localStorage.clear();
        return Promise.reject(e);
      }
    }

    return Promise.reject(err);
  }
);

export default api;
