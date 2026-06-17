import { trpc } from "@/providers/trpc";
import { Bell, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: notifications, isLoading } = trpc.notification.myNotifications.useQuery();
  const utils = trpc.useUtils();
  const markAsRead = trpc.notification.markAsRead.useMutation();
  const markAllRead = trpc.notification.markAllRead.useMutation();

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkRead = async (id: number) => {
    await markAsRead.mutateAsync({ id });
    utils.notification.myNotifications.invalidate();
  };

  const handleMarkAllRead = async () => {
    await markAllRead.mutateAsync();
    utils.notification.myNotifications.invalidate();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "booking": return "text-blue-400";
      case "offer": return "text-amber-400";
      case "reminder": return "text-green-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-amber-400 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-zinc-900 border border-amber-500/20 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/10">
            <h3 className="text-sm font-bold text-amber-400">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading && (
              <div className="p-4 text-center text-gray-500 text-sm">
                جاري التحميل...
              </div>
            )}

            {!isLoading && notifications?.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد إشعارات</p>
              </div>
            )}

            {notifications?.map((notif) => (
              <div
                key={notif.id}
                className={`px-4 py-3 border-b border-amber-500/5 hover:bg-zinc-800/50 transition-colors ${
                  !notif.isRead ? "bg-amber-500/5" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${getTypeColor(notif.type)}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString("ar-EG", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="text-gray-500 hover:text-amber-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
