import { apiClient } from "./client";
import { notificationSchema } from "./schemas";
import { z } from "zod";

export async function fetchNotifications() {
  const { data } = await apiClient.get("/notifications");
  return z.array(notificationSchema).parse(data);
}

export async function markNotificationRead(id: string) {
  const { data } = await apiClient.put(`/notifications/${id}/read`);
  return notificationSchema.parse(data);
}

export async function sendNotification(payload: {
  userId: string;
  title: string;
  body: string;
  link?: string;
}) {
  const { data } = await apiClient.post("/notifications/send", payload);
  return notificationSchema.parse(data);
}
