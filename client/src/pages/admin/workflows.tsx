import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus } from "lucide-react";

export default function Workflows() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Workflow Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure approval workflows for different request types
          </p>
        </div>
        <Button data-testid="button-new-workflow">
          <Plus className="mr-2 h-4 w-4" />
          New Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Leave Requests</CardTitle>
              <Badge variant="secondary">Default</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-xs font-semibold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">HOD Approval</p>
                  <p className="text-xs text-muted-foreground">Department Head</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-xs font-semibold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Dean Approval</p>
                  <p className="text-xs text-muted-foreground">Faculty Dean</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-xs font-semibold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Registrar Approval</p>
                  <p className="text-xs text-muted-foreground">Final Approval</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Conference/Training</CardTitle>
              <Badge variant="secondary">Default</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-xs font-semibold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">HOD Approval</p>
                  <p className="text-xs text-muted-foreground">Department Head</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-xs font-semibold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Dean Approval</p>
                  <p className="text-xs text-muted-foreground">Faculty Dean</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-xs font-semibold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Registrar Approval</p>
                  <p className="text-xs text-muted-foreground">Final Approval</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Resource Requisition</CardTitle>
              <Badge variant="secondary">Default</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-xs font-semibold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">HOD Approval</p>
                  <p className="text-xs text-muted-foreground">Department Head</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-xs font-semibold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Registrar Approval</p>
                  <p className="text-xs text-muted-foreground">Final Approval</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Generic Requests</CardTitle>
              <Badge variant="secondary">Default</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="text-xs font-semibold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">HOD Approval</p>
                  <p className="text-xs text-muted-foreground">Department Head</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
