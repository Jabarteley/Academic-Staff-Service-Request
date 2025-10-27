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
import { CheckSquare, Search, Eye, Calendar, Clock, User } from "lucide-react";
import type { Request } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";

export default function Approvals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: pendingRequests, isLoading } = useQuery<Request[]>({
    queryKey: ["/api/approvals/pending", { search: searchQuery, type: typeFilter }],
  });

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Pending Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Requests awaiting your approval
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
                placeholder="Search by title, request number, requestor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-approvals"
              />
            </div>
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
      ) : pendingRequests && pendingRequests.length > 0 ? (
        <div className="space-y-3">
          {pendingRequests.map((request) => (
            <Card key={request.id} className="hover-elevate" data-testid={`card-approval-${request.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-base">
                        {request.title}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {getTypeLabel(request.requestType)}
                      </Badge>
                      {request.priority && request.priority !== 'normal' && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(request.priority)}`}
                        >
                          {request.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {request.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Requestor ID: {request.requestorId}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Submitted {request.submittedAt && formatDistanceToNow(new Date(request.submittedAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Stage {(request.workflowStage || 0) + 1}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/requests/${request.id}`}>
                    <Button data-testid={`button-review-${request.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Review
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pending approvals</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'All requests have been processed'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
