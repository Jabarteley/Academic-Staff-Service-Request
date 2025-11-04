import { Switch, Route, Redirect, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Requests from "@/pages/requests";
import NewRequest from "@/pages/new-request";
import RequestDetail from "@/pages/request-detail";
import Notifications from "@/pages/notifications";
import Approvals from "@/pages/approvals";
import Users from "@/pages/admin/users";
import Departments from "@/pages/admin/departments";
import Faculties from "@/pages/admin/faculties";
import Reports from "@/pages/admin/reports";
import Workflows from "@/pages/admin/workflows";
import AuditLogs from "@/pages/admin/audit-logs";
import SystemSettings from "@/pages/admin/settings";
import ForgotPassword from "@/pages/forgot-password";
import NotFound from "@/pages/not-found";
import { USER_ROLES } from "@shared/schema";

function ProtectedRoute({ 
  component: Component, 
  allowedRoles 
}: { 
  component: React.ComponentType; 
  allowedRoles?: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  // Check role authorization if roles are specified
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Link href="/dashboard">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
              Go to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return <Component />;
}

function Router() {
  const { user } = useAuth();
  const adminRoles = [USER_ROLES.SYS_ADMIN];
  const approverRoles = [USER_ROLES.ADMIN_OFFICER, USER_ROLES.DEAN, USER_ROLES.REGISTRAR, USER_ROLES.SYS_ADMIN];

  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/requests" component={() => <ProtectedRoute component={Requests} />} />
      <Route path="/requests/new" component={() => <ProtectedRoute component={NewRequest} />} />
      <Route path="/requests/:id" component={() => <ProtectedRoute component={RequestDetail} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
      <Route path="/approvals" component={() => <ProtectedRoute component={Approvals} allowedRoles={approverRoles} />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={Users} allowedRoles={adminRoles} />} />
      <Route path="/admin/faculties" component={() => <ProtectedRoute component={Faculties} allowedRoles={adminRoles} />} />
      <Route path="/admin/departments" component={() => <ProtectedRoute component={Departments} allowedRoles={adminRoles} />} />
      <Route path="/admin/workflows" component={() => <ProtectedRoute component={Workflows} allowedRoles={adminRoles} />} />
      <Route path="/admin/reports" component={() => <ProtectedRoute component={Reports} allowedRoles={adminRoles} />} />
      <Route path="/admin/audit" component={() => <ProtectedRoute component={AuditLogs} allowedRoles={adminRoles} />} />
      <Route path="/admin/settings" component={() => <ProtectedRoute component={SystemSettings} allowedRoles={adminRoles} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (!user) {
    return <Router />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
