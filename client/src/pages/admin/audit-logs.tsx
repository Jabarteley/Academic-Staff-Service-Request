import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileSearch } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import type { AuditLog } from "@shared/schema";

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs", { search: searchQuery, action: actionFilter }],
  });

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (action.includes('delete')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (action.includes('update') || action.includes('approve')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete audit trail of all system actions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, action, or resource..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-logs"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-action-filter">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                    <TableCell className="text-sm">
                      {log.createdAt && format(new Date(log.createdAt), 'PPp')}
                    </TableCell>
                    <TableCell className="text-sm">{log.userId || 'System'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.resourceType && log.resourceId 
                        ? `${log.resourceType}/${log.resourceId.slice(0, 8)}...`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.ipAddress || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileSearch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No audit logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
