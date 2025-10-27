import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Shield, Mail, FileText, Clock, Database } from "lucide-react";

export default function SystemSettings() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure system-wide settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Security Settings</CardTitle>
          </div>
          <CardDescription>
            Manage authentication and security policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require 2FA for all admin users
              </p>
            </div>
            <Switch data-testid="switch-2fa" />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
              <Input
                id="max-login-attempts"
                type="number"
                defaultValue="5"
                data-testid="input-max-login-attempts"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lockout-duration">Lockout Duration (minutes)</Label>
              <Input
                id="lockout-duration"
                type="number"
                defaultValue="30"
                data-testid="input-lockout-duration"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
            <Input
              id="session-timeout"
              type="number"
              defaultValue="24"
              data-testid="input-session-timeout"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>Email Settings</CardTitle>
          </div>
          <CardDescription>
            Configure email notifications and SMTP settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send email notifications for request updates
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-email-notifications" />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="smtp-host">SMTP Host</Label>
            <Input
              id="smtp-host"
              placeholder="smtp.example.com"
              data-testid="input-smtp-host"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input
                id="smtp-port"
                placeholder="587"
                data-testid="input-smtp-port"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-from">From Email</Label>
              <Input
                id="smtp-from"
                placeholder="noreply@fuwukari.edu.ng"
                data-testid="input-smtp-from"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>File Upload Settings</CardTitle>
          </div>
          <CardDescription>
            Configure file upload limits and allowed types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-file-size">Max File Size (MB)</Label>
              <Input
                id="max-file-size"
                type="number"
                defaultValue="10"
                data-testid="input-max-file-size"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-total-size">Max Total Size (MB)</Label>
              <Input
                id="max-total-size"
                type="number"
                defaultValue="50"
                data-testid="input-max-total-size"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="allowed-types">Allowed File Types</Label>
            <Input
              id="allowed-types"
              defaultValue="pdf, doc, docx, jpg, jpeg, png, xls, xlsx"
              data-testid="input-allowed-types"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Workflow Settings</CardTitle>
          </div>
          <CardDescription>
            Configure workflow timeouts and escalation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Escalation</Label>
              <p className="text-sm text-muted-foreground">
                Automatically escalate pending approvals
              </p>
            </div>
            <Switch data-testid="switch-auto-escalation" />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="escalation-days">Escalation After (days)</Label>
            <Input
              id="escalation-days"
              type="number"
              defaultValue="7"
              data-testid="input-escalation-days"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Data Retention</CardTitle>
          </div>
          <CardDescription>
            Configure data retention policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="audit-retention">Audit Logs Retention (years)</Label>
              <Input
                id="audit-retention"
                type="number"
                defaultValue="5"
                data-testid="input-audit-retention"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachment-retention">Attachment Retention (years)</Label>
              <Input
                id="attachment-retention"
                type="number"
                defaultValue="7"
                data-testid="input-attachment-retention"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Reset to Defaults</Button>
        <Button data-testid="button-save-settings">Save Settings</Button>
      </div>
    </div>
  );
}
