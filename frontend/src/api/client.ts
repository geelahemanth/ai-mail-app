import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export const emailApi = {
  getEmails: (params?: { days?: number; sender?: string; unread?: boolean; q?: string }) =>
    api.get("/emails", { params }).then((r) => r.data),

  getEmail: (id: string) =>
    api.get(`/emails/${id}`).then((r) => r.data),

  getSentEmails: () =>
    api.get("/emails/sent").then((r) => r.data),

  sendEmail: (to: string, subject: string, body: string) =>
    api.post("/emails/send", null, { params: { to, subject, body } }).then((r) => r.data),
};