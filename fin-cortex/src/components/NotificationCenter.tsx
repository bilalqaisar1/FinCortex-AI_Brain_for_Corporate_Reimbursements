"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Check, CheckCheck, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface Notification {
    notification_id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error" | "action_required";
    category: string;
    is_read: boolean;
    action_url?: string;
    related_id?: string;
    created_at: string;
}

export function NotificationCenter() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/v1/notifications?user_id=${user.id}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Failed to fetch: ${response.statusText}`);
            }

            const data = await response.json();
            setNotifications(data || []);
            setUnreadCount(data?.filter((n: Notification) => !n.is_read).length || 0);
        } catch (error: any) {
            // Silently handle fetch failures — notifications are non-critical
            console.warn("Notification fetch skipped:", error.message || "Unknown error");
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchNotifications();

        // Subscribe to real-time updates
        if (user?.id) {
            // SOTA Fix for React StrictMode: Ensure the channel name is 100% unique per-mount
            // to prevent pulling an already-subscribed channel from the Supabase client cache.
            const channelName = `notifications-${user.id}-${Date.now()}`;
            
            const channel = supabase
                .channel(channelName)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "in_app_notifications",
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        setNotifications((prev) => [payload.new as Notification, ...prev]);
                        setUnreadCount((prev) => prev + 1);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user?.id, fetchNotifications]);

    const markAsRead = async (notificationId: string) => {
        try {
            const response = await fetch('/api/v1/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'mark_read',
                    notification_id: notificationId
                })
            });

            if (!response.ok) throw new Error('Failed to update status');

            setNotifications((prev) =>
                prev.map((n) =>
                    n.notification_id === notificationId ? { ...n, is_read: true } : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        if (!user?.id) return;

        try {
            const response = await fetch('/api/v1/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'mark_all_read',
                    user_id: user.id
                })
            });

            if (!response.ok) throw new Error('Failed to update status');

            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const getTypeStyles = (type: Notification["type"]) => {
        switch (type) {
            case "success":
                return "bg-green-500/10 border-green-500/30 text-green-400";
            case "warning":
                return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
            case "error":
                return "bg-red-500/10 border-red-500/30 text-red-400";
            case "action_required":
                return "bg-orange-500/10 border-orange-500/30 text-orange-400";
            default:
                return "bg-blue-500/10 border-blue-500/30 text-blue-400";
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return "Just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-slate-800"
                >
                    <Bell className="h-5 w-5 text-slate-400" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 p-0 bg-slate-900 border-slate-700"
                align="end"
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h3 className="font-semibold text-white">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-cyan-400 hover:text-cyan-300"
                            onClick={markAllAsRead}
                        >
                            <CheckCheck className="h-4 w-4 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                            <Bell className="h-8 w-8 mb-2 opacity-50" />
                            <p>No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.notification_id}
                                    className={`p-4 hover:bg-slate-800/50 transition-colors ${!notification.is_read ? "bg-slate-800/30" : ""
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.is_read ? "bg-cyan-500" : "bg-transparent"
                                                }`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full border ${getTypeStyles(
                                                        notification.type
                                                    )}`}
                                                >
                                                    {notification.type.replace("_", " ")}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {formatTimeAgo(notification.created_at)}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-medium text-white truncate">
                                                {notification.title}
                                            </h4>
                                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                {notification.action_url && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-xs text-cyan-400 hover:text-cyan-300 p-0"
                                                        onClick={() => {
                                                            window.location.href = notification.action_url!;
                                                            markAsRead(notification.notification_id);
                                                        }}
                                                    >
                                                        View <ExternalLink className="h-3 w-3 ml-1" />
                                                    </Button>
                                                )}
                                                {!notification.is_read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-xs text-slate-400 hover:text-white p-0"
                                                        onClick={() =>
                                                            markAsRead(notification.notification_id)
                                                        }
                                                    >
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Mark read
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
