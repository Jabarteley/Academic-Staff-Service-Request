import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Calendar,
} from "lucide-react";
import type { Request } from "@shared/schema";
import { format } from "date-fns";

export default function Requests() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: requests, isLoading } = useQuery<Request[]>({
    queryKey: ["/api/requests", { search: searchQuery, status: statusFilter, type: typeFilter }],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'pending':
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'modification_requested':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">My Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage your service requests
          </p>
        </div>
        <Link href="/requests/new">
          <Button data-testid="button-new-request">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </Link>
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
                placeholder="Search by title, request number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-requests"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="modification_requested">Modification Requested</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-type-filter">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
                <SelectItem value="conference_training">Conference/Training</SelectItem>
                <SelectItem value="resource_requisition">Resource Requisition</SelectItem>
                <SelectItem value="generic">Generic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id} className="hover-elevate" data-testid={`card-request-${request.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-base truncate">
                        {request.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(request.status)}`}
                      >
                        {request.status.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {getTypeLabel(request.requestType)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {request.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>#{request.requestNumber}</span>
                      </div>
                      {request.createdAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created {format(new Date(request.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      {request.priority && (
                        <span className="capitalize">Priority: {request.priority}</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/requests/${request.id}`}>
                    <Button variant="outline" size="sm" data-testid={`button-view-${request.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests found</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first request'}
              </p>
              <Link href="/requests/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
