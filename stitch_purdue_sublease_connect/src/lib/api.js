const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

async function request(path, options = {}, accessToken) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    const error = new Error(payload.error?.message || "Request failed");
    error.code = payload.error?.code || "request_failed";
    error.details = payload.error?.details;
    throw error;
  }

  return payload.data;
}

export const api = {
  auth: {
    signup: (body) => request("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
    verifyEmail: (body) => request("/auth/verify-email", { method: "POST", body: JSON.stringify(body) }),
    sendPhoneOtp: (body, accessToken) =>
      request("/auth/phone/send-otp", { method: "POST", body: JSON.stringify(body) }, accessToken),
    verifyPhone: (body) => request("/auth/verify-phone", { method: "POST", body: JSON.stringify(body) }),
    login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    logout: (accessToken) => request("/auth/logout", { method: "POST" }, accessToken),
    me: (accessToken) => request("/auth/me", { method: "GET" }, accessToken),
    resendEmailOtp: (body) => request("/auth/resend-email-otp", { method: "POST", body: JSON.stringify(body) }),
    resendPhoneOtp: (body) => request("/auth/resend-phone-otp", { method: "POST", body: JSON.stringify(body) }),
  },
  users: {
    getById: (id, accessToken) => request(`/users/${id}`, { method: "GET" }, accessToken),
    updateMe: (body, accessToken) => request("/users/me", { method: "PATCH", body: JSON.stringify(body) }, accessToken),
  },
  listings: {
    list: (params, accessToken) => {
      const query = new URLSearchParams();
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.set(key, String(value));
        }
      });
      const suffix = query.toString() ? `?${query}` : "";
      return request(`/listings${suffix}`, { method: "GET" }, accessToken);
    },
    getById: (id, accessToken) => request(`/listings/${id}`, { method: "GET" }, accessToken),
    create: (body, accessToken) => request("/listings", { method: "POST", body: JSON.stringify(body) }, accessToken),
    update: (id, body, accessToken) =>
      request(`/listings/${id}`, { method: "PATCH", body: JSON.stringify(body) }, accessToken),
    delete: (id, accessToken) => request(`/listings/${id}`, { method: "DELETE" }, accessToken),
  },
};

export { BASE_URL };
