import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Home,
  FileText,
  CheckSquare,
  Users,
  Settings,
  BarChart3,
  Bell,
  FolderKanban,
  Shield,
  FileSearch,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { USER_ROLES } from "@shared/schema";

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeText = (role: string) => {
    switch (role) {
      case USER_ROLES.ACADEMIC_STAFF:
        return 'Staff';
      case USER_ROLES.ADMIN_OFFICER:
        return 'Officer';
      case USER_ROLES.DEAN:
        return 'Dean';
      case USER_ROLES.REGISTRAR:
        return 'Registrar';
      case USER_ROLES.SYS_ADMIN:
        return 'Admin';
      default:
        return 'User';
    }
  };

  const staffMenuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "My Requests", url: "/requests", icon: FileText },
    { title: "New Request", url: "/requests/new", icon: FileText },
    { title: "Notifications", url: "/notifications", icon: Bell },
  ];

  const approverMenuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "My Requests", url: "/requests", icon: FileText },
    { title: "Pending Approvals", url: "/approvals", icon: CheckSquare },
    { title: "New Request", url: "/requests/new", icon: FileText },
    { title: "Notifications", url: "/notifications", icon: Bell },
  ];

  const adminMenuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "User Management", url: "/admin/users", icon: Users },
    { title: "Departments", url: "/admin/departments", icon: FolderKanban },
    { title: "Workflows", url: "/admin/workflows", icon: Settings },
    { title: "Reports", url: "/admin/reports", icon: BarChart3 },
    { title: "Audit Logs", url: "/admin/audit", icon: FileSearch },
    { title: "System Settings", url: "/admin/settings", icon: Shield },
  ];

  const isApprover = [USER_ROLES.ADMIN_OFFICER, USER_ROLES.DEAN, USER_ROLES.REGISTRAR].includes(user.role as any);
  const isAdmin = user.role === USER_ROLES.SYS_ADMIN;

  const menuItems = isAdmin ? adminMenuItems : isApprover ? approverMenuItems : staffMenuItems;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wide px-4 py-2">
            FUW Portal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 rounded-md border p-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-username">
              {user.fullName}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {getRoleBadgeText(user.role)}
              </Badge>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
