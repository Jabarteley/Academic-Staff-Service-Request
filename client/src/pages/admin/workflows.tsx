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

interface WorkflowStep {
  id: number;
  name: string;
  description: string;
}

interface Workflow {
  id: string;
  name: string;
  type: string;
  steps: WorkflowStep[];
}

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: "1",
      name: "Leave Requests",
      type: "Default",
      steps: [
        { id: 1, name: "HOD Approval", description: "Department Head" },
        { id: 2, name: "Dean Approval", description: "Faculty Dean" },
        { id: 3, name: "Registrar Approval", description: "Final Approval" },
      ],
    },
    {
      id: "2",
      name: "Conference/Training",
      type: "Default",
      steps: [
        { id: 1, name: "HOD Approval", description: "Department Head" },
        { id: 2, name: "Dean Approval", description: "Faculty Dean" },
        { id: 3, name: "Registrar Approval", description: "Final Approval" },
      ],
    },
    {
      id: "3",
      name: "Resource Requisition",
      type: "Default",
      steps: [
        { id: 1, name: "HOD Approval", description: "Department Head" },
        { id: 2, name: "Registrar Approval", description: "Final Approval" },
      ],
    },
    {
      id: "4",
      name: "Generic Requests",
      type: "Default",
      steps: [
        { id: 1, name: "HOD Approval", description: "Department Head" },
      ],
    },
  ]);

  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [editingSteps, setEditingSteps] = useState<WorkflowStep[]>([]);

  useEffect(() => {
    if (selectedWorkflow) {
      setEditingSteps(selectedWorkflow.steps);
    } else {
      setEditingSteps([]);
    }
  }, [selectedWorkflow]);

  const handleConfigureClick = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setIsConfigDialogOpen(true);
  };

  const handleStepChange = (id: number, field: keyof WorkflowStep, value: string) => {
    setEditingSteps((prevSteps) =>
      prevSteps.map((step) => (step.id === id ? { ...step, [field]: value } : step))
    );
  };

  const handleAddStep = () => {
    setEditingSteps((prevSteps) => [
      ...prevSteps,
      { id: prevSteps.length > 0 ? Math.max(...prevSteps.map((s) => s.id)) + 1 : 1, name: "", description: "" },
    ]);
  };

  const handleRemoveStep = (id: number) => {
    setEditingSteps((prevSteps) => prevSteps.filter((step) => step.id !== id));
  };

  const handleSaveChanges = () => {
    if (selectedWorkflow) {
      setWorkflows((prevWorkflows) =>
        prevWorkflows.map((workflow) =>
          workflow.id === selectedWorkflow.id ? { ...workflow, steps: editingSteps } : workflow
        )
      );
    }
    setIsConfigDialogOpen(false);
  };

  const handleNewWorkflow = () => {
    const newWorkflow: Workflow = {
      id: String(workflows.length + 1),
      name: "New Workflow",
      type: "Custom",
      steps: [{ id: 1, name: "", description: "" }],
    };
    setWorkflows((prevWorkflows) => [...prevWorkflows, newWorkflow]);
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
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{workflow.name}</CardTitle>
                <Badge variant="secondary">{workflow.type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflow.steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <span className="text-xs font-semibold text-primary">{step.id}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{step.name}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
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
            <DialogTitle>Configure {selectedWorkflow?.name}</DialogTitle>
            <DialogDescription>
              Edit the approval steps for the {selectedWorkflow?.name} workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingSteps.map((step) => (
              <div key={step.id} className="flex items-end gap-2">
                <div className="grid gap-2 flex-grow">
                  <Label htmlFor={`step-name-${step.id}`}>Step {step.id} Name</Label>
                  <Input
                    id={`step-name-${step.id}`}
                    value={step.name}
                    onChange={(e) => handleStepChange(step.id, "name", e.target.value)}
                  />
                </div>
                <div className="grid gap-2 flex-grow">
                  <Label htmlFor={`step-description-${step.id}`}>Description</Label>
                  <Input
                    id={`step-description-${step.id}`}
                    value={step.description}
                    onChange={(e) => handleStepChange(step.id, "description", e.target.value)}
                  />
                </div>
                <Button variant="destructive" size="icon" onClick={() => handleRemoveStep(step.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={handleAddStep}>
              <Plus className="mr-2 h-4 w-4" />
              Add Step
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
