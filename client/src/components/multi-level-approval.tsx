import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Edit } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Request } from "@shared/schema";

interface MultiLevelApprovalProps {
  request: Request;
  currentStage: number;
  canApprove: boolean;
  onActionSuccess?: () => void;
}

export function MultiLevelApproval({ request, currentStage, canApprove, onActionSuccess }: MultiLevelApprovalProps) {
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const approveMutation = useMutation({
    mutationFn: async (data: { action: string; comment: string }) => {
      return apiRequest("POST", `/api/requests/${request.id}/action`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Action completed",
        description: "The request has been updated.",
      });
      
      setComment("");
      if (onActionSuccess) {
        onActionSuccess();
      }
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

  if (!canApprove) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stage {currentStage + 1} Approval</CardTitle>
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
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Approve Stage {currentStage + 1}
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => handleAction("reject")}
            disabled={approveMutation.isPending}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleAction("request_modification")}
            disabled={approveMutation.isPending}
          >
            <Edit className="mr-2 h-4 w-4" />
            Request Modification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}