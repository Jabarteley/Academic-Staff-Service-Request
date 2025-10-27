import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { USER_ROLES, type Request } from "@shared/schema";
import { format } from "date-fns";

interface DashboardStats {
  myRequests: number;
  pendingApprovals: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  totalUsers?: number;
  recentRequests: Request[];
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const isAdmin = user?.role === USER_ROLES.SYS_ADMIN;
  const isApprover = [USER_ROLES.ADMIN_OFFICER, USER_ROLES.DEAN, USER_ROLES.REGISTRAR].includes(user?.role as any);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {user?.fullName}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-my-requests-count">
              {stats?.myRequests || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total submissions
            </p>
          </CardContent>
        </Card>

        {isApprover && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Approvals
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-pending-approvals-count">
                {stats?.pendingApprovals || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting your action
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats?.approvedThisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {stats?.rejectedThisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active accounts
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-1">
          <div>
            <CardTitle>Recent Requests</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Latest request activity
            </p>
          </div>
          <Link href="/requests">
            <Button variant="ghost" size="sm" data-testid="link-view-all-requests">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats?.recentRequests && stats.recentRequests.length > 0 ? (
            <div className="space-y-3">
              {stats.recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                  data-testid={`card-request-${request.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {request.title}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(request.status)}`}
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>#{request.requestNumber}</span>
                      <span>{request.requestType.replace('_', ' ')}</span>
                      {request.createdAt && (
                        <span>{format(new Date(request.createdAt), 'MMM dd, yyyy')}</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/requests/${request.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No recent requests</p>
              <Link href="/requests/new">
                <Button className="mt-4" data-testid="button-create-first-request">
                  Create your first request
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
