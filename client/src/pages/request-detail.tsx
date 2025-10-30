import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Edit,
  Download,
  Clock,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import type { Request, RequestTimeline as TimelineType, Attachment, USER_ROLES } from "@shared/schema";

export default function RequestDetail() {
  const [, params] = useRoute("/requests/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: request, isLoading } = useQuery<Request>({
    queryKey: ["/api/requests", params?.id],
    enabled: !!params?.id,
  });

  const { data: timeline } = useQuery<TimelineType[]>({
    queryKey: ["/api/requests", params?.id, "timeline"],
    enabled: !!params?.id,
  });

  const { data: attachments } = useQuery<Attachment[]>({
    queryKey: ["/api/requests", params?.id, "attachments"],
    enabled: !!params?.id,
  });

  const approveMutation = useMutation({
    mutationFn: async (data: { action: string; comment: string }) => {
      return apiRequest("POST", `/api/requests/${params?.id}/action`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({
        title: "Action completed",
        description: "The request has been updated.",
      });
      setComment("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process action",
        variant: "destructive",
      });
    },
  });

  const handleAction = (action: string) => {
    if (!comment && (action === "reject" || action === "request_modification")) {
      toast({
        title: "Comment required",
        description: "Please provide a comment for this action",
        variant: "destructive",
      });
      return;
    }

    approveMutation.mutate({ action, comment });
  };

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
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const canApprove = user && request && request.currentApproverId === user.id;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Request not found</p>
            <Button className="mt-4" onClick={() => setLocation("/requests")}>
              Back to Requests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/requests")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold" data-testid="text-request-title">
            {request.title}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge
              variant="outline"
              className={`text-xs ${getStatusColor(request.status || '')}`}
              data-testid="badge-status"
            >
              {request.status && request.status.replace(/_/g, ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">
              #{request.requestNumber}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList>
              <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
              <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
              <TabsTrigger value="attachments" data-testid="tab-attachments">
                Attachments {attachments && `(${attachments.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Request Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Request Type</p>
                      <p className="font-medium capitalize">
                        {request.requestType && request.requestType.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Priority</p>
                      <p className="font-medium capitalize">{request.priority}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Created</p>
                      <p className="font-medium">
                        {request.createdAt && format(new Date(request.createdAt), 'PPP')}
                      </p>
                    </div>
                    {request.submittedAt && (
                      <div>
                        <p className="text-muted-foreground mb-1">Submitted</p>
                        <p className="font-medium">
                          {format(new Date(request.submittedAt), 'PPP')}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium mb-2">Description</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {request.description}
                    </p>
                  </div>

                  {request.requestType === 'leave' && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-sm font-medium">Leave Details</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">Leave Type</p>
                            <p className="font-medium capitalize">{request.leaveType}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Substitute Staff</p>
                            <p className="font-medium">{request.substituteStaffName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Start Date</p>
                            <p className="font-medium">
                              {request.startDate && format(new Date(request.startDate), 'PPP')}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">End Date</p>
                            <p className="font-medium">
                              {request.endDate && format(new Date(request.endDate), 'PPP')}
                            </p>
                          </div>
                          {request.totalWorkingDays && (
                            <div>
                              <p className="text-muted-foreground mb-1">Working Days</p>
                              <p className="font-medium">{request.totalWorkingDays}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {request.requestType === 'conference_training' && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-sm font-medium">Conference/Training Details</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">Event Name</p>
                            <p className="font-medium">{request.eventName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Organizer</p>
                            <p className="font-medium">{request.organizer}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Event Dates</p>
                            <p className="font-medium">{request.eventDates}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Location</p>
                            <p className="font-medium">{request.location}</p>
                          </div>
                          {request.estimatedCost && (
                            <div>
                              <p className="text-muted-foreground mb-1">Estimated Cost</p>
                              <p className="font-medium">{request.estimatedCost}</p>
                            </div>
                          )}
                        </div>
                        {(request.conferencePaper || request.travelRequest) && (
                          <div className="flex gap-3 mt-3">
                            {request.conferencePaper && (
                              <Badge variant="secondary">Presenting Paper</Badge>
                            )}
                            {request.travelRequest && (
                              <Badge variant="secondary">Travel Support Requested</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {request.requestType === 'resource_requisition' && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-sm font-medium">Resource Requisition Details</p>
                        {request.itemList && (
                          <div className="border rounded-md p-3">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2">Item</th>
                                  <th className="text-left py-2">Quantity</th>
                                  <th className="text-left py-2">Estimated Cost</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(request.itemList as any[]).map((item: any, index: number) => (
                                  <tr key={index} className="border-b last:border-0">
                                    <td className="py-2">{item.name}</td>
                                    <td className="py-2">{item.qty}</td>
                                    <td className="py-2">{item.cost}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">Delivery Location</p>
                            <p className="font-medium">{request.deliveryLocation}</p>
                          </div>
                          {request.budgetCode && (
                            <div>
                              <p className="text-muted-foreground mb-1">Budget Code</p>
                              <p className="font-medium">{request.budgetCode}</p>
                            </div>
                          )}
                        </div>
                        {request.justification && (
                          <div>
                            <p className="text-muted-foreground mb-1">Justification</p>
                            <p className="text-sm">{request.justification}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Request Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {timeline && timeline.length > 0 ? (
                    <div className="space-y-4">
                      {timeline.map((event, index) => (
                        <div key={event.id} className="flex gap-4" data-testid={`timeline-event-${index}`}>
                          <div className="flex flex-col items-center">
                            <div className="rounded-full bg-primary p-2">
                              <Clock className="h-3 w-3 text-primary-foreground" />
                            </div>
                            {index < timeline.length - 1 && (
                              <div className="w-px flex-1 bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">{event.action}</p>
                              <span className="text-xs text-muted-foreground">
                                {event.createdAt && format(new Date(event.createdAt), 'PPp')}
                              </span>
                            </div>
                            {event.comment && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No timeline events yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  {attachments && attachments.length > 0 ? (
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                          data-testid={`attachment-${attachment.id}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {attachment.originalFilename}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(attachment.fileSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No attachments
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          {canApprove && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    id="comment"
                    placeholder="Add your comment here..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-2"
                    data-testid="textarea-approval-comment"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    * Required for reject and modification requests
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => handleAction("approve")}
                    disabled={approveMutation.isPending}
                    data-testid="button-approve"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleAction("reject")}
                    disabled={approveMutation.isPending}
                    data-testid="button-reject"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleAction("request_modification")}
                    disabled={approveMutation.isPending}
                    data-testid="button-request-modification"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Request Modification
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Request Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Status</p>
                <Badge className={getStatusColor(request.status)}>
                  {request.status && request.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              {request.workflowStage !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Workflow Stage</p>
                  <p className="text-sm font-medium">Stage {request.workflowStage + 1}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
