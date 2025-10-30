import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { USER_ROLES, REQUEST_TYPES } from "../../../../shared/schema";

interface WorkflowStep {
  id: number;
  stepName: string; // Changed from 'name' to 'stepName' to match backend
  role: string;
}

interface Workflow {
  _id: string; // Changed from 'id' to '_id' to match MongoDB
  requestType: string; // Changed from 'name' to 'requestType'
  isDefault: boolean; // Use isDefault directly from backend
  stages: WorkflowStep[]; // Changed from 'steps' to 'stages'
}

interface UserRoleOption {
  value: string;
  label: string;
}

const userRoleOptions: UserRoleOption[] = Object.entries(USER_ROLES).map(([key, value]) => ({
  value: value,
  label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Format for display
}));

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [editingStages, setEditingStages] = useState<WorkflowStep[]>([]);
  const [availableRoles, setAvailableRoles] = useState<UserRoleOption[]>(userRoleOptions);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch("/api/workflows");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const formattedWorkflows: Workflow[] = data.map((wf: any) => ({
        _id: wf._id,
        requestType: wf.requestType,
        isDefault: wf.isDefault,
        stages: wf.stages.map((stage: any, index: number) => ({
          id: index + 1,
          stepName: stage.stepName,
          role: stage.role,
        })),
      }));
      setWorkflows(formattedWorkflows);
    } catch (error) {
      console.error("Error fetching workflows:", error);
    }
  };

  useEffect(() => {
    if (selectedWorkflow) {
      setEditingStages(selectedWorkflow.stages);
    } else {
      setEditingStages([]);
    }
  }, [selectedWorkflow]);

  const handleConfigureClick = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setIsConfigDialogOpen(true);
  };

  const handleStageChange = (id: number, field: keyof WorkflowStep, value: string) => {
    setEditingStages((prevStages) =>
      prevStages.map((stage) => (stage.id === id ? { ...stage, [field]: value } : stage))
    );
  };

  const handleAddStage = () => {
    setEditingStages((prevStages) => [
      ...prevStages,
      { id: prevStages.length > 0 ? Math.max(...prevStages.map((s) => s.id)) + 1 : 1, stepName: "", role: USER_ROLES.ADMIN_OFFICER },
    ]);
  };

  const handleRemoveStage = (id: number) => {
    setEditingStages((prevStages) => prevStages.filter((stage) => stage.id !== id));
  };

  const handleSaveChanges = async () => {
    if (selectedWorkflow) {
      try {
        const response = await fetch(`/api/workflows/${selectedWorkflow._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestType: selectedWorkflow.requestType,
            isDefault: selectedWorkflow.isDefault,
            stages: editingStages.map(stage => ({ stepName: stage.stepName, role: stage.role }))
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        fetchWorkflows();
        setIsConfigDialogOpen(false);
      } catch (error) {
        console.error("Error saving workflow changes:", error);
      }
    }
  };

  const handleNewWorkflow = async () => {
    const newWorkflowData = {
      requestType: "New Workflow " + (workflows.length + 1),
      isDefault: false,
      stages: [{ stepName: "New Step", role: USER_ROLES.ADMIN_OFFICER }],
    };

    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newWorkflowData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchWorkflows();
    } catch (error) {
      console.error("Error creating new workflow:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Workflow Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure approval workflows for different request types
          </p>
        </div>
        <Button data-testid="button-new-workflow" onClick={handleNewWorkflow}>
          <Plus className="mr-2 h-4 w-4" />
          New Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workflows.map((workflow) => (
          <Card key={workflow._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{workflow.requestType}</CardTitle>
                <Badge variant="secondary">{workflow.isDefault ? "Default" : "Custom"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflow.stages.map((stage) => (
                  <div key={stage.id} className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <span className="text-xs font-semibold text-primary">{stage.id}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{stage.stepName}</p>
                      <p className="text-xs text-muted-foreground">
                        {userRoleOptions.find(role => role.value === stage.role)?.label || stage.role}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleConfigureClick(workflow)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configure {selectedWorkflow?.requestType}</DialogTitle>
            <DialogDescription>
              Edit the approval stages for the {selectedWorkflow?.requestType} workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingStages.map((stage) => (
              <div key={stage.id} className="flex items-end gap-2">
                <div className="grid gap-2 flex-grow">
                  <Label htmlFor={`stage-name-${stage.id}`}>Stage {stage.id} Name</Label>
                  <Input
                    id={`stage-name-${stage.id}`}
                    value={stage.stepName}
                    onChange={(e) => handleStageChange(stage.id, "stepName", e.target.value)}
                  />
                </div>
                <div className="grid gap-2 flex-grow">
                  <Label htmlFor={`stage-role-${stage.id}`}>Approver Role</Label>
                  <Select
                    value={stage.role}
                    onValueChange={(value) => handleStageChange(stage.id, "role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="destructive" size="icon" onClick={() => handleRemoveStage(stage.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={handleAddStage}>
              <Plus className="mr-2 h-4 w-4" />
              Add Stage
            </Button>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
            <Button type="submit" onClick={handleSaveChanges}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
