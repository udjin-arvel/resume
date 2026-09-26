import type { Notification } from "@/lib/worker-notifications";
import {
  getNotificationIconClassName,
  getNotificationIconType,
  isReportReminderNotification,
} from "@/lib/worker-notifications";

type NotificationIconProps = {
  type: string;
};

export function NotificationIcon({ type }: NotificationIconProps) {
  const Icon = getNotificationIconType(type);
  return <Icon className={`h-4 w-4 ${getNotificationIconClassName(type)}`} />;
}

type NotificationCardProps = {
  notification: Notification;
  onClick?: () => void;
};

export function NotificationCard({ notification, onClick }: NotificationCardProps) {
  const unread = !notification.readAt;
  const isReminder = isReportReminderNotification(notification.notificationType);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`card-hover flex w-full items-start gap-3 rounded-[12px] border p-3 text-left ${
        isReminder
          ? unread
            ? "border-red-300 bg-red-50 shadow-[0_0_0_1px_rgba(220,38,38,0.12)]"
            : "border-red-200 bg-red-50/20"
          : unread
            ? "border-blue-100 bg-blue-50/40"
            : "border-gray-100 bg-white"
      }`}
    >
      <div
        className={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[8px] ${
          isReminder ? "bg-red-100" : "bg-slate-100"
        }`}
      >
        <NotificationIcon type={notification.notificationType} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[14px] leading-snug ${
            isReminder ? "font-semibold text-red-800" : "text-[#0F172B]"
          }`}
        >
          {notification.title}
        </p>
        {notification.body ? (
          <p className={`mt-1 line-clamp-2 text-[12px] ${isReminder ? "text-red-700/80" : "text-slate-500"}`}>
            {notification.body}
          </p>
        ) : null}
        <p className={`mt-1 text-[12px] ${isReminder ? "text-red-600/70" : "text-slate-500"}`}>
          {formatNotificationDate(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}

function formatNotificationDate(value: string): string {
  const d = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function NotificationCardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-[70%] animate-pulse rounded-md bg-gray-200" />
        <div className="h-3 w-[30%] animate-pulse rounded-md bg-gray-200" />
      </div>
    </div>
  );
}
