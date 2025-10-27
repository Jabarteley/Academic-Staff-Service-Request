import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { USER_ROLES } from "@shared/schema";

// Session user type
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

// Helper to get current user from session
async function getCurrentUser(req: Request) {
  if (!req.session.userId) return null;
  return await storage.getUser(req.session.userId);
}

// Auth middleware
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Admin middleware
async function requireAdmin(req: Request, res: Response, next: Function) {
  const user = await getCurrentUser(req);
  if (!user || user.role !== USER_ROLES.SYS_ADMIN) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ==================== Authentication Routes ====================
  
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({ message: "Identifier and password are required" });
      }

      // Find user by email or staff number
      let user = await storage.getUserByEmail(identifier);
      if (!user) {
        user = await storage.getUserByStaffNumber(identifier);
      }

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check account status
      if (user.status !== 'active') {
        return res.status(401).json({ message: "Account is inactive" });
      }

      // Check account lockout
      if (user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date()) {
        return res.status(401).json({ message: "Account is locked. Please try again later." });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        // Increment failed login attempts
        await storage.updateUser(user.id, {
          failedLoginAttempts: (user.failedLoginAttempts || 0) + 1,
          accountLockedUntil: (user.failedLoginAttempts || 0) >= 4 
            ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
            : null
        });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Reset failed attempts and update last login
      await storage.updateUser(user.id, {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLogin: new Date(),
      });

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: 'login',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: req.ip || null,
        userAgent: req.get('user-agent') || null,
      });

      // Set session
      req.session.userId = user.id;

      // Don't send password in response
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (userId) {
      await storage.createAuditLog({
        userId,
        action: 'logout',
        resourceType: 'user',
        resourceId: userId,
        ipAddress: req.ip || null,
      });
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // ==================== Dashboard Routes ====================

  app.get("/api/dashboard/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const allRequests = await storage.getRequestsByUser(user.id);
      const pendingApprovals = await storage.getPendingApprovals(user.id);
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const approvedThisMonth = allRequests.filter(r => 
        r.status === 'approved' && 
        r.completedAt && 
        new Date(r.completedAt) >= startOfMonth
      ).length;

      const rejectedThisMonth = allRequests.filter(r => 
        r.status === 'rejected' && 
        r.updatedAt && 
        new Date(r.updatedAt) >= startOfMonth
      ).length;

      // Get recent requests (limit to 5)
      const recentRequests = allRequests
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Admin-specific stats
      let totalUsers;
      if (user.role === USER_ROLES.SYS_ADMIN) {
        const users = await storage.getAllUsers();
        totalUsers = users.filter(u => u.status === 'active').length;
      }

      res.json({
        myRequests: allRequests.length,
        pendingApprovals: pendingApprovals.length,
        approvedThisMonth,
        rejectedThisMonth,
        totalUsers,
        recentRequests,
      });
    } catch (error: any) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== Request Routes ====================

  app.get("/api/requests", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const { search, status, type } = req.query;
      
      const userRequests = await storage.getRequestsByUser(user.id);
      let filteredRequests = userRequests;

      // Apply filters
      if (search) {
        const lowerSearch = (search as string).toLowerCase();
        filteredRequests = filteredRequests.filter(r => 
          r.title.toLowerCase().includes(lowerSearch) ||
          r.requestNumber.toLowerCase().includes(lowerSearch) ||
          r.description.toLowerCase().includes(lowerSearch)
        );
      }

      if (status && status !== 'all') {
        filteredRequests = filteredRequests.filter(r => r.status === status);
      }

      if (type && type !== 'all') {
        filteredRequests = filteredRequests.filter(r => r.requestType === type);
      }

      res.json(filteredRequests);
    } catch (error: any) {
      console.error("Get requests error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/requests/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const request = await storage.getRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Check authorization
      const canView = request.requestorId === user.id || 
                     request.currentApproverId === user.id ||
                     user.role === USER_ROLES.SYS_ADMIN;

      if (!canView) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(request);
    } catch (error: any) {
      console.error("Get request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/requests", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const requestData = {
        ...req.body,
        requestorId: user.id,
        status: 'submitted',
        departmentId: user.departmentId,
      };

      const newRequest = await storage.createRequest(requestData);

      // Add timeline entry
      await storage.addTimelineEntry({
        requestId: newRequest.id,
        userId: user.id,
        action: 'Request created and submitted',
        ipAddress: req.ip || null,
      });

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: 'create_request',
        resourceType: 'request',
        resourceId: newRequest.id,
        details: { requestType: newRequest.requestType },
        ipAddress: req.ip || null,
      });

      // TODO: Create notification for approver
      // TODO: Send email notification

      res.status(201).json(newRequest);
    } catch (error: any) {
      console.error("Create request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/requests/:id/action", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const { action, comment } = req.body;
      const request = await storage.getRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Check authorization
      if (request.currentApproverId !== user.id) {
        return res.status(403).json({ message: "Not authorized to approve this request" });
      }

      let newStatus = request.status;
      let timelineAction = '';

      switch (action) {
        case 'approve':
          newStatus = 'approved';
          timelineAction = 'Request approved';
          break;
        case 'reject':
          newStatus = 'rejected';
          timelineAction = 'Request rejected';
          break;
        case 'request_modification':
          newStatus = 'modification_requested';
          timelineAction = 'Modification requested';
          break;
        default:
          return res.status(400).json({ message: "Invalid action" });
      }

      // Update request
      await storage.updateRequest(request.id, {
        status: newStatus,
        currentApproverId: null, // Clear current approver
      });

      // Add timeline entry
      await storage.addTimelineEntry({
        requestId: request.id,
        userId: user.id,
        action: timelineAction,
        comment: comment || null,
        ipAddress: req.ip || null,
      });

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: `${action}_request`,
        resourceType: 'request',
        resourceId: request.id,
        ipAddress: req.ip || null,
      });

      // Create notification for requestor
      await storage.createNotification({
        userId: request.requestorId,
        requestId: request.id,
        type: action,
        title: `Request ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Modification Requested'}`,
        message: `Your request "${request.title}" has been ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'returned for modification'}.`,
        link: `/requests/${request.id}`,
      });

      res.json({ message: "Action completed successfully" });
    } catch (error: any) {
      console.error("Request action error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/requests/:id/timeline", requireAuth, async (req: Request, res: Response) => {
    try {
      const timeline = await storage.getRequestTimeline(req.params.id);
      res.json(timeline);
    } catch (error: any) {
      console.error("Get timeline error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/requests/:id/attachments", requireAuth, async (req: Request, res: Response) => {
    try {
      const attachments = await storage.getRequestAttachments(req.params.id);
      res.json(attachments);
    } catch (error: any) {
      console.error("Get attachments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== Approval Routes ====================

  app.get("/api/approvals/pending", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const { search, type } = req.query;
      
      let pendingRequests = await storage.getPendingApprovals(user.id);

      // Apply filters
      if (search) {
        const lowerSearch = (search as string).toLowerCase();
        pendingRequests = pendingRequests.filter(r => 
          r.title.toLowerCase().includes(lowerSearch) ||
          r.requestNumber.toLowerCase().includes(lowerSearch)
        );
      }

      if (type && type !== 'all') {
        pendingRequests = pendingRequests.filter(r => r.requestType === type);
      }

      res.json(pendingRequests);
    } catch (error: any) {
      console.error("Get pending approvals error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== Notification Routes ====================

  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const notifications = await storage.getUserNotifications(user.id);
      res.json(notifications);
    } catch (error: any) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/mark-all-read", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      await storage.markAllNotificationsRead(user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.json({ message: "Notification deleted" });
    } catch (error: any) {
      console.error("Delete notification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== Department Routes ====================

  app.get("/api/departments", requireAuth, async (req: Request, res: Response) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error: any) {
      console.error("Get departments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/departments", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const department = await storage.createDepartment(req.body);

      await storage.createAuditLog({
        userId: user.id,
        action: 'create_department',
        resourceType: 'department',
        resourceId: department.id,
        ipAddress: req.ip || null,
      });

      res.status(201).json(department);
    } catch (error: any) {
      console.error("Create department error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== Admin Routes ====================

  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { search } = req.query;
      
      let users;
      if (search) {
        users = await storage.searchUsers(search as string);
      } else {
        users = await storage.getAllUsers();
      }

      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/users", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) return res.status(401).json({ message: "Unauthorized" });

      // Hash password
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const userData = {
        ...req.body,
        password: hashedPassword,
      };

      const newUser = await storage.createUser(userData);

      await storage.createAuditLog({
        userId: currentUser.id,
        action: 'create_user',
        resourceType: 'user',
        resourceId: newUser.id,
        ipAddress: req.ip || null,
      });

      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/reports", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Mock report data for now
      res.json({
        requestsByType: [
          { type: 'Leave', count: 45 },
          { type: 'Conference/Training', count: 23 },
          { type: 'Resource Requisition', count: 18 },
          { type: 'Generic', count: 12 },
        ],
        requestsByDepartment: [
          { department: 'Computer Science', count: 32 },
          { department: 'Mathematics', count: 28 },
          { department: 'Physics', count: 21 },
          { department: 'Chemistry', count: 17 },
        ],
        requestsByStatus: [
          { status: 'Approved', count: 58 },
          { status: 'Pending', count: 25 },
          { status: 'Rejected', count: 10 },
          { status: 'Draft', count: 5 },
        ],
        averageApprovalTime: 3.5,
      });
    } catch (error: any) {
      console.error("Get reports error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/audit-logs", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Return empty array for now - storage doesn't have getAllAuditLogs yet
      res.json([]);
    } catch (error: any) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
