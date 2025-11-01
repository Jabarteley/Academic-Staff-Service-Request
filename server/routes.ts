import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { USER_ROLES, REQUEST_TYPES, InsertUser, LEAVE_TYPES } from "@shared/schema";
import crypto from "crypto";
import nodemailer from "nodemailer";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import { Request as RequestModel, Department as DepartmentModel } from "./models";

// Find user by role and faculty
async function findUserByRoleAndFaculty(role: string, faculty: string) {
  return await storage.getUserByRoleAndFaculty(role, faculty);
}

// Find user by role only
async function findUserByRole(role: string) {
  return await storage.getUserByRole(role);
}

// Helper function to determine the next approver based on role and department
async function determineNextApprover(role: string, department: any): Promise<string | null> {
  if (!department) return null;
  
  switch (role) {
    case USER_ROLES.ADMIN_OFFICER:
      // For ADMIN_OFFICER role (like HOD), use department's hodId, or find any ADMIN_OFFICER if not set
      return department.hodId || (await findUserByRole(USER_ROLES.ADMIN_OFFICER))?.id || null;
    case USER_ROLES.DEAN:
      // Find Dean for the faculty
      let dean = await findUserByRoleAndFaculty(USER_ROLES.DEAN, department.faculty);
      if (!dean) {
        // If no faculty-specific Dean is found, try to find any user with DEAN role as fallback
        // This handles cases where the dean user doesn't have faculty field set
        dean = await findUserByRole(USER_ROLES.DEAN);
      }
      if (!dean) {
        // If still no dean found, try to find any SYS_ADMIN as fallback
        dean = await findUserByRole(USER_ROLES.SYS_ADMIN);
      }
      return dean?.id || null;
    case USER_ROLES.REGISTRAR:
      // Find Registrar
      let registrar = await findUserByRole(USER_ROLES.REGISTRAR);
      if (!registrar) {
        // If no Registrar is found, try to find any SYS_ADMIN as fallback
        registrar = await findUserByRole(USER_ROLES.SYS_ADMIN);
      }
      return registrar?.id || null;
    case USER_ROLES.SYS_ADMIN:
      // Find System Administrator
      return await findUserByRole(USER_ROLES.SYS_ADMIN);
    default:
      // For other roles, try to find any SYS_ADMIN as a general fallback
      const sysAdmin = await findUserByRole(USER_ROLES.SYS_ADMIN);
      return sysAdmin?.id || null;
  }
}

// Mock email sending function for password reset
async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `http://localhost:5000/reset-password?token=${token}`;
  console.log(`
============== PASSWORD RESET EMAIL ===============`);
  console.log(`To: ${email}`);
  console.log(`Subject: Password Reset Request`);
  console.log(`
Click the link below to reset your password:`);
  console.log(resetLink);
  console.log(`
This link will expire in 1 hour.`);
  console.log(`=================================================
`);
}

// Function to send notification emails for request actions
async function sendRequestActionEmail(user: any, request: any, action: string, comment?: string) {
  console.log(`
============== NOTIFICATION EMAIL ===============`);
  console.log(`To: ${user.email}`);
  console.log(`Subject: Request ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Modification Requested'}`);
  console.log(`
Your request "${request.title}" has been ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'returned for modification'}.

Request ID: ${request.requestNumber}
Request Type: ${request.requestType}
Status: ${request.status}

${comment ? `Comment: ${comment}` : ''}

View your request at: http://localhost:5000/requests/${request.id}
`);
  console.log(`=================================================
`);
}


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
  // Function to ensure default workflows exist
  async function ensureDefaultWorkflows() {
    // Check for a default 'generic' workflow (without departmentId)
    let genericWorkflow = await storage.getWorkflowConfig(REQUEST_TYPES.GENERIC, undefined);

    if (!genericWorkflow) {
      console.log("Creating default 'generic' workflow...");
      await storage.createWorkflowConfig({
        requestType: REQUEST_TYPES.GENERIC,
        isDefault: true,
        stages: [
          { role: USER_ROLES.ADMIN_OFFICER, stepName: "Department Head Approval" },
          { role: USER_ROLES.DEAN, stepName: "Dean's Approval" },
        ],
      });
      console.log("Default 'generic' workflow created.");
    }

    // Check for a default 'leave' workflow
    let leaveWorkflow = await storage.getWorkflowConfig(REQUEST_TYPES.LEAVE, undefined);
    if (!leaveWorkflow) {
      console.log("Creating default 'leave' workflow...");
      await storage.createWorkflowConfig({
        requestType: REQUEST_TYPES.LEAVE,
        isDefault: true,
        stages: [
          { role: USER_ROLES.ADMIN_OFFICER, stepName: "Department Head Approval" },
          { role: USER_ROLES.DEAN, stepName: "Dean's Approval" },
        ],
      });
      console.log("Default 'leave' workflow created.");
    }

    // Check for a default 'conference_training' workflow
    let conferenceWorkflow = await storage.getWorkflowConfig(REQUEST_TYPES.CONFERENCE_TRAINING, undefined);
    if (!conferenceWorkflow) {
      console.log("Creating default 'conference_training' workflow...");
      await storage.createWorkflowConfig({
        requestType: REQUEST_TYPES.CONFERENCE_TRAINING,
        isDefault: true,
        stages: [
          { role: USER_ROLES.ADMIN_OFFICER, stepName: "Department Head Approval" },
          { role: USER_ROLES.DEAN, stepName: "Dean's Approval" },
          { role: USER_ROLES.REGISTRAR, stepName: "Registrar's Approval" },
        ],
      });
      console.log("Default 'conference_training' workflow created.");
    }

    // Check for a default 'resource_requisition' workflow
    let resourceWorkflow = await storage.getWorkflowConfig(REQUEST_TYPES.RESOURCE_REQUISITION, undefined);
    if (!resourceWorkflow) {
      console.log("Creating default 'resource_requisition' workflow...");
      await storage.createWorkflowConfig({
        requestType: REQUEST_TYPES.RESOURCE_REQUISITION,
        isDefault: true,
        stages: [
          { role: USER_ROLES.ADMIN_OFFICER, stepName: "Department Head Approval" },
          { role: USER_ROLES.SYS_ADMIN, stepName: "System Admin Approval" },
        ],
      });
      console.log("Default 'resource_requisition' workflow created.");
    }

    // Ensure at least one ADMIN_OFFICER exists for workflow assignment
    let adminOfficer = await storage.findUserByRole(USER_ROLES.ADMIN_OFFICER);
    if (!adminOfficer) {
      console.log("No ADMIN_OFFICER found. Creating a default one...");
      const hashedPassword = await bcrypt.hash("password123", 10); // Default password
      const defaultAdminOfficer: InsertUser = {
        staffNumber: "AO001",
        email: "admin.officer@example.com",
        password: hashedPassword,
        fullName: "Default Admin Officer",
        role: USER_ROLES.ADMIN_OFFICER,
        status: "active",
      };
      adminOfficer = await storage.createUser(defaultAdminOfficer);
      console.log(`Default ADMIN_OFFICER created: ${adminOfficer.email}`);
    }
  }

  // Call this function when the server starts
  await ensureDefaultWorkflows();

  const upload = multer({ storage: multer.memoryStorage() });
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

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        // Don't reveal that the user doesn't exist
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      // Generate token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 3600000); // 1 hour

      await storage.setPasswordResetToken(user.id, token, expires);

      // Send email
      await sendPasswordResetEmail(user.email, token);

      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      const user = await storage.getUserByPasswordResetToken(token);

      if (!user) {
        return res.status(400).json({ message: "Password reset token is invalid or has expired." });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password and clear reset token
      await storage.updateUser(user.id, { password: hashedPassword });
      await storage.clearPasswordResetToken(user.id);

      // Log audit event
      await storage.createAuditLog({
        userId: user.id,
        action: 'reset_password',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: req.ip || null,
      });

      res.json({ message: "Password has been reset successfully." });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== Dashboard Routes ====================

  app.get("/api/dashboard/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      console.log("Dashboard user:", user.id);
      const allRequests = await storage.getRequestsByUser(user.id);
      console.log("Dashboard requests:", allRequests);

      const pendingApprovals = await storage.getPendingApprovals(user);
      
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
                     user.role === USER_ROLES.SYS_ADMIN ||
                     (user.role === USER_ROLES.ADMIN_OFFICER && user.departmentId === request.departmentId) ||
                     user.role === USER_ROLES.DEAN ||
                     user.role === USER_ROLES.REGISTRAR;

      if (!canView) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(request);
    } catch (error: any) {
      console.error("Get request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/requests", requireAuth, upload.any(), async (req: Request, res: Response) => {
    try {
      console.log("Received request body:", req.body);
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      // Validate required fields
      const { requestType, title, description } = req.body;
      
      if (!requestType || !Object.values(REQUEST_TYPES).includes(requestType)) {
        return res.status(400).json({ message: "Valid request type is required" });
      }
      
      if (!title || title.trim().length === 0) {
        return res.status(400).json({ message: "Title is required" });
      }
      
      if (!description || description.trim().length === 0) {
        return res.status(400).json({ message: "Description is required" });
      }

      // Get the department of the requesting user
      const department = await storage.getDepartment(user.departmentId as string);
      if (!department) {
        return res.status(400).json({ message: "User's department not found." });
      }

      // Get the workflow configuration
      let workflow = await storage.getWorkflowConfig(requestType, department.id);
      if (!workflow) {
        // Fallback to default workflow if department-specific not found
        workflow = await storage.getWorkflowConfig(requestType, undefined);
      }

      if (!workflow || workflow.stages.length === 0) {
        return res.status(400).json({ message: "No workflow configured for this request type." });
      }

      // Determine the first approver
      let currentApproverId: string | null = null;
      const firstStage = workflow.stages[0];

      if (firstStage.role === USER_ROLES.ADMIN_OFFICER) {
        // First try to get the HOD if set
        currentApproverId = department.hodId || null;
        
        // If no HOD is set for the department, try to find any ADMIN_OFFICER
        if (!currentApproverId) {
          const adminOfficer = await storage.findUserByRole(firstStage.role);
          currentApproverId = adminOfficer?.id || null;
        }
      } else if (firstStage.role === USER_ROLES.DEAN) {
        const deanUser = await storage.findUserByRoleAndFaculty(firstStage.role, department.faculty);
        currentApproverId = deanUser?.id || null;
      } else if (firstStage.role === USER_ROLES.REGISTRAR) {
        const registrarUser = await storage.findUserByRole(firstStage.role);
        currentApproverId = registrarUser?.id || null;
      } else {
        // For other roles, try to find a user with that role
        const roleUser = await storage.findUserByRole(firstStage.role);
        currentApproverId = roleUser?.id || null;
      }

      if (!currentApproverId) {
        console.error("Failed to determine currentApproverId for new request.");
        return res.status(400).json({ message: "Could not determine the first approver for this request." });
      }
      console.log("Determined currentApproverId for new request:", currentApproverId);

      // Prepare request data with additional validation
      const requestData = {
        ...req.body,
        requestorId: user.id,
        status: 'pending', // Status is pending when it's assigned to an approver
        departmentId: user.departmentId,
        currentApproverId: currentApproverId,
        workflowStage: 0, // Start at the first stage
        submittedAt: new Date(), // Mark when the request was submitted
      };

      // For leave requests, validate required fields
      if (requestType === REQUEST_TYPES.LEAVE) {
        if (!req.body.leaveType || !Object.values(LEAVE_TYPES).includes(req.body.leaveType)) {
          return res.status(400).json({ message: "Valid leave type is required for leave requests" });
        }
        if (!req.body.startDate || !req.body.endDate) {
          return res.status(400).json({ message: "Start and end dates are required for leave requests" });
        }
        if (!req.body.substituteStaffName || req.body.substituteStaffName.trim().length === 0) {
          return res.status(400).json({ message: "Substitute staff name is required for leave requests" });
        }
      }

      // For conference/training requests, validate required fields
      if (requestType === REQUEST_TYPES.CONFERENCE_TRAINING) {
        if (!req.body.eventName || req.body.eventName.trim().length === 0) {
          return res.status(400).json({ message: "Event name is required for conference/training requests" });
        }
        if (!req.body.eventDates || req.body.eventDates.trim().length === 0) {
          return res.status(400).json({ message: "Event dates are required for conference/training requests" });
        }
      }

      // For resource requisition requests, validate required fields
      if (requestType === REQUEST_TYPES.RESOURCE_REQUISITION) {
        if (req.body.itemList && typeof req.body.itemList === 'string') {
          try {
            req.body.itemList = JSON.parse(req.body.itemList);
          } catch (error) {
            return res.status(400).json({ message: "Invalid item list format" });
          }
        }
        if (!req.body.itemList || !Array.isArray(req.body.itemList) || req.body.itemList.length === 0) {
          return res.status(400).json({ message: "Item list is required for resource requisition requests" });
        }
      }

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

      // Handle attachments
      if (req.files) {
        const files = req.files as Express.Multer.File[];
        for (const file of files) {
          // TODO: Upload file to a persistent storage (e.g., S3, Google Cloud Storage)
          const storedFilename = `${crypto.randomBytes(16).toString("hex")}-${file.originalname}`;
          await storage.createAttachment({
            requestId: newRequest.id,
            uploaderId: user.id,
            originalFilename: file.originalname,
            storedFilename: storedFilename,
            fileSize: file.size,
            mimeType: file.mimetype,
            storageKey: "local", // This should be the key from the storage service
          });
        }
      }

      // Create notification for the assigned approver
      if (currentApproverId) {
        const approver = await storage.getUser(currentApproverId);
        if (approver) {
          await storage.createNotification({
            userId: currentApproverId,
            requestId: newRequest.id,
            type: 'assignment',
            title: 'New Request Assigned for Review',
            message: `A new request "${newRequest.title}" has been assigned to you for review.`,
            link: `/requests/${newRequest.id}`,
          });

          // Send email notification to approver
          await sendRequestActionEmail(approver, newRequest, 'assignment');
        }
      }

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
      
      // Validate action parameter
      if (!action || !['approve', 'reject', 'request_modification'].includes(action)) {
        return res.status(400).json({ message: "Action is required and must be one of: approve, reject, request_modification" });
      }
      
      // Validate comment requirement
      if ((action === 'reject' || action === 'request_modification') && (!comment || comment.trim().length === 0)) {
        return res.status(400).json({ message: "Comment is required for reject and request modification actions" });
      }

      const request = await storage.getRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Check if request is already completed
      if (['approved', 'rejected', 'completed'].includes(request.status)) {
        return res.status(400).json({ message: "Request has already been processed and cannot be modified." });
      }

      // Check authorization - user must be the current approver
      if (request.currentApproverId !== user.id) {
        console.log("Unauthorized approval attempt:", { 
          userId: user.id, 
          currentApproverId: request.currentApproverId,
          requestStatus: request.status
        });
        return res.status(403).json({ message: "Not authorized to approve this request" });
      }
      
      console.log("Current approver ID before action:", request.currentApproverId);

      let newStatus = request.status;
      let timelineAction = '';
      let updatedCurrentApproverId: string | null = null;
      let updatedWorkflowStage: number = request.workflowStage || 0;
      let completedAt: Date | null = null;

      // Get the workflow configuration
      const requestorDepartment = await storage.getDepartment(request.departmentId as string);
      let workflow = await storage.getWorkflowConfig(request.requestType, requestorDepartment?.id);
      if (!workflow) {
        // Fallback to default workflow if department-specific not found
        workflow = await storage.getWorkflowConfig(request.requestType, undefined);
      }

      if (!workflow || workflow.stages.length === 0) {
        return res.status(400).json({ message: "No workflow configured for this request type." });
      }

      switch (action) {
        case 'approve':
          const nextStageIndex = (request.workflowStage || 0) + 1;
          if (nextStageIndex < workflow.stages.length) {
            // Move to next stage
            const nextStage = workflow.stages[nextStageIndex];
            updatedWorkflowStage = nextStageIndex;

            console.log(`Determining next approver for role: ${nextStage.role}, department: ${requestorDepartment?.name}, faculty: ${requestorDepartment?.faculty}`);
            
            // Determine next approver based on role and department
            updatedCurrentApproverId = await determineNextApprover(nextStage.role, requestorDepartment);

            console.log(`Next approver determined: ${updatedCurrentApproverId}`);

            if (!updatedCurrentApproverId) {
              // If we can't find an approver for this role, try to find any sys admin as fallback
              const sysAdmin = await storage.findUserByRole(USER_ROLES.SYS_ADMIN);
              if (sysAdmin) {
                updatedCurrentApproverId = sysAdmin.id;
                console.log(`Using sysadmin as fallback approver: ${updatedCurrentApproverId}`);
              } else {
                return res.status(400).json({ 
                  message: `No approver found for role ${nextStage.role} in ${requestorDepartment?.name || 'department'}.` 
                });
              }
            }

            newStatus = 'pending'; // Still pending, but with a new approver
            timelineAction = `Request approved by ${user.fullName}, forwarded to ${nextStage.role} (Stage ${nextStageIndex + 1})`;
          } else {
            // Workflow completed
            newStatus = 'approved';
            completedAt = new Date();
            timelineAction = 'Request fully approved';
            updatedCurrentApproverId = null;
          }
          break;
        case 'reject':
          newStatus = 'rejected';
          timelineAction = 'Request rejected';
          updatedCurrentApproverId = null;
          completedAt = new Date();
          break;
        case 'request_modification':
          newStatus = 'modification_requested';
          timelineAction = 'Modification requested';
          updatedCurrentApproverId = request.requestorId; // Return to requestor
          break;
        default:
          return res.status(400).json({ message: "Invalid action" });
      }

      // Update request
      const updatedRequest = await storage.updateRequest(request.id, {
        status: newStatus,
        currentApproverId: updatedCurrentApproverId,
        workflowStage: updatedWorkflowStage,
        completedAt: completedAt,
      });

      if (!updatedRequest) {
        return res.status(500).json({ message: "Failed to update request status" });
      }

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
        details: { 
          previousStatus: request.status, 
          newStatus, 
          action,
          comment: comment || null
        },
        ipAddress: req.ip || null,
      });

      // Get requestor details for notification
      const requestor = await storage.getUser(request.requestorId);
      
      if (requestor) {
        // Create notification for requestor
        await storage.createNotification({
          userId: request.requestorId,
          requestId: request.id,
          type: action,
          title: `Request ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Modification Requested'}`,
          message: `Your request "${request.title}" has been ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'returned for modification'}.`,
          link: `/requests/${request.id}`,
        });

        // Send email notification to requestor
        await sendRequestActionEmail(requestor, request, action, comment);
      }

      // If action is request_modification, also notify the current approver that it's been returned
      if (action === 'request_modification') {
        await storage.createNotification({
          userId: user.id,
          requestId: request.id,
          type: action,
          title: 'Request Returned for Modification',
          message: `The request "${request.title}" has been returned to the requestor for modifications.`,
          link: `/requests/${request.id}`,
        });
      }

      res.json({ 
        message: "Action completed successfully",
        request: {
          ...updatedRequest,
          status: newStatus,
          currentApproverId: updatedCurrentApproverId,
          workflowStage: updatedWorkflowStage,
        }
      });
    } catch (error: any) {
      console.error("Request action error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/requests/:id/timeline", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      // Check authorization to access this request data
      const request = await storage.getRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      const canView = request.requestorId === user.id || 
                     request.currentApproverId === user.id ||
                     user.role === USER_ROLES.SYS_ADMIN ||
                     (user.role === USER_ROLES.ADMIN_OFFICER && user.departmentId === request.departmentId) ||
                     user.role === USER_ROLES.DEAN ||
                     user.role === USER_ROLES.REGISTRAR;

      if (!canView) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const timeline = await storage.getRequestTimeline(req.params.id);
      res.json(timeline);
    } catch (error: any) {
      console.error("Get timeline error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/requests/:id/attachments", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      // Check authorization to access this request data
      const request = await storage.getRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      const canView = request.requestorId === user.id || 
                     request.currentApproverId === user.id ||
                     user.role === USER_ROLES.SYS_ADMIN ||
                     (user.role === USER_ROLES.ADMIN_OFFICER && user.departmentId === request.departmentId) ||
                     user.role === USER_ROLES.DEAN ||
                     user.role === USER_ROLES.REGISTRAR;

      if (!canView) {
        return res.status(403).json({ message: "Forbidden" });
      }

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

      let pendingRequests = await storage.getPendingApprovals(user);

      const { search, type } = req.query; // Extract search and type from query parameters

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
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      // Verify that the notification belongs to the user
      const notification = await storage.getNotification(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      if (notification.userId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

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
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      // Verify that the notification belongs to the user
      const notification = await storage.getNotification(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      if (notification.userId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

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

      let userData = {
        ...req.body,
        password: hashedPassword,
      };

      // Set appropriate faculty for DEAN role if not provided
      if (userData.role === USER_ROLES.DEAN && !userData.faculty && userData.departmentId) {
        // If creating a dean and faculty is not provided but department is, 
        // get the faculty from the department
        const department = await storage.getDepartment(userData.departmentId);
        if (department && department.faculty) {
          userData.faculty = department.faculty;
        }
      }

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
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/users/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) return res.status(401).json({ message: "Unauthorized" });

      const userId = req.params.id;
      const userData = req.body;

      const updatedUser = await storage.updateUser(userId, userData);

      await storage.createAuditLog({
        userId: currentUser.id,
        action: 'update_user',
        resourceType: 'user',
        resourceId: userId,
        ipAddress: req.ip || null,
      });

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/users/bulk", requireAuth, requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      const users: any[] = [];
      const readable = new Readable();
      readable._read = () => {}; // _read is required but you can noop it
      readable.push(req.file.buffer);
      readable.push(null);

      readable
        .pipe(csv())
        .on('data', (data) => users.push(data))
        .on('end', async () => {
          try {
            for (const user of users) {
              const hashedPassword = await bcrypt.hash(user.password, 10);
              await storage.createUser({ ...user, password: hashedPassword });
            }
            res.status(201).json({ message: `${users.length} users created successfully.` });
          } catch (error: any) {
            console.error("Bulk create user error:", error);
            res.status(500).json({ message: "Error processing CSV file." });
          }
        });
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/reports", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const requestsByType = await RequestModel.aggregate([
        { $group: { _id: "$requestType", count: { $sum: 1 } } },
        { $project: { type: "$_id", count: 1, _id: 0 } },
      ]);

      const requestsByStatus = await RequestModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } },
      ]);

      const requestsByDepartment = await RequestModel.aggregate([
        { $lookup: { from: "departments", localField: "departmentId", foreignField: "_id", as: "department" } },
        { $unwind: "$department" },
        { $group: { _id: "$department.name", count: { $sum: 1 } } },
        { $project: { department: "$_id", count: 1, _id: 0 } },
      ]);

      const approvalTimeResult = await RequestModel.aggregate([
        { $match: { status: "approved", submittedAt: { $ne: null }, completedAt: { $ne: null } } },
        { $project: { approvalTime: { $subtract: ["$completedAt", "$submittedAt"] } } },
        { $group: { _id: null, avgApprovalTime: { $avg: "$approvalTime" } } },
      ]);

      const averageApprovalTimeInMs = approvalTimeResult[0]?.avgApprovalTime || 0;
      const averageApprovalTime = Math.round(averageApprovalTimeInMs / (1000 * 60 * 60 * 24));

      res.json({
        requestsByType,
        requestsByDepartment,
        requestsByStatus,
        averageApprovalTime,
      });
    } catch (error: any) {
      console.error("Get reports error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== Workflow Configuration Routes ====================

  app.get("/api/workflows", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { requestType, departmentId } = req.query;
      let workflowConfigs;
      
      if (requestType) {
        if (departmentId) {
          workflowConfigs = await storage.getWorkflowConfig(requestType as string, departmentId as string);
        } else {
          workflowConfigs = await storage.getWorkflowConfig(requestType as string, undefined);
        }
      } else {
        workflowConfigs = await storage.getAllWorkflowConfigs();
      }

      res.json(Array.isArray(workflowConfigs) ? workflowConfigs : [workflowConfigs]);
    } catch (error: any) {
      console.error("Get workflow configs error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/workflows", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const workflowConfig = await storage.createWorkflowConfig(req.body);

      await storage.createAuditLog({
        userId: user.id,
        action: 'create_workflow_config',
        resourceType: 'workflow_config',
        resourceId: workflowConfig.id,
        ipAddress: req.ip || null,
      });

      res.status(201).json(workflowConfig);
    } catch (error: any) {
      console.error("Create workflow config error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/workflows/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const workflowConfig = await storage.updateWorkflowConfig(req.params.id, req.body);

      await storage.createAuditLog({
        userId: user.id,
        action: 'update_workflow_config',
        resourceType: 'workflow_config',
        resourceId: req.params.id,
        ipAddress: req.ip || null,
      });

      res.json(workflowConfig);
    } catch (error: any) {
      console.error("Update workflow config error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/audit-logs", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { search, action } = req.query;
      const filters: any = {};

      if (search) {
        filters.search = search as string;
      }
      if (action && action !== 'all') {
        filters.action = action as string;
      }

      const auditLogs = await storage.searchAuditLogs(filters);
      res.json(auditLogs);
    } catch (error: any) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
