import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

export default function Notifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", "/api/notifications/mark-all-read", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "All notifications marked as read",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/notifications/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notification deleted",
      });
    },
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`hover-elevate ${!notification.isRead ? 'border-primary/50' : ''}`}
              data-testid={`notification-${notification.id}`}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`rounded-full p-2 ${!notification.isRead ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Bell className={`h-4 w-4 ${!notification.isRead ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <Badge variant="secondary" className="text-xs ml-2">New</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => markReadMutation.mutate(notification.id)}
                            data-testid={`button-mark-read-${notification.id}`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => deleteMutation.mutate(notification.id)}
                          data-testid={`button-delete-${notification.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {notification.createdAt && format(new Date(notification.createdAt), 'PPp')}
                      </span>
                      {notification.link && (
                        <Link href={notification.link}>
                          <Button variant="link" size="sm" className="h-auto p-0">
                            View details
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              You're all caught up! We'll notify you when there's something new.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
