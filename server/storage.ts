import {
  type User,
  type InsertUser,
  type Department,
  type InsertDepartment,
  type Request,
  type InsertRequest,
  type RequestTimeline,
  type InsertRequestTimeline,
  type Attachment,
  type InsertAttachment,
  type Notification,
  type InsertNotification,
  type WorkflowConfig,
  type InsertWorkflowConfig,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStaffNumber(staffNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;

  // Departments
  getDepartment(id: string): Promise<Department | undefined>;
  getAllDepartments(): Promise<Department[]>;
  createDepartment(dept: InsertDepartment): Promise<Department>;

  // Requests
  getRequest(id: string): Promise<Request | undefined>;
  getRequestsByUser(userId: string): Promise<Request[]>;
  getPendingApprovals(userId: string): Promise<Request[]>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequest(id: string, data: Partial<Request>): Promise<Request | undefined>;
  searchRequests(query: string, filters?: any): Promise<Request[]>;

  // Request Timeline
  getRequestTimeline(requestId: string): Promise<RequestTimeline[]>;
  addTimelineEntry(entry: InsertRequestTimeline): Promise<RequestTimeline>;

  // Attachments
  getRequestAttachments(requestId: string): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;

  // Notifications
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;

  // Workflow Configs
  getWorkflowConfig(requestType: string, departmentId?: string): Promise<WorkflowConfig | undefined>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  searchAuditLogs(filters: any): Promise<AuditLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private departments: Map<string, Department>;
  private requests: Map<string, Request>;
  private timeline: Map<string, RequestTimeline>;
  private attachments: Map<string, Attachment>;
  private notifications: Map<string, Notification>;
  private workflows: Map<string, WorkflowConfig>;
  private auditLogs: Map<string, AuditLog>;

  constructor() {
    this.users = new Map();
    this.departments = new Map();
    this.requests = new Map();
    this.timeline = new Map();
    this.attachments = new Map();
    this.notifications = new Map();
    this.workflows = new Map();
    this.auditLogs = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async getUserByStaffNumber(staffNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.staffNumber === staffNumber);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      createdAt: now,
      updatedAt: now,
      lastLogin: null,
      failedLoginAttempts: 0,
      accountLockedUntil: null,
      joinDate: insertUser.joinDate || now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async searchUsers(query: string): Promise<User[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter(
      u => u.fullName.toLowerCase().includes(lowerQuery) ||
           u.email.toLowerCase().includes(lowerQuery) ||
           u.staffNumber.toLowerCase().includes(lowerQuery)
    );
  }

  // Departments
  async getDepartment(id: string): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async getAllDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async createDepartment(insertDept: InsertDepartment): Promise<Department> {
    const id = randomUUID();
    const dept: Department = {
      ...insertDept,
      id,
      createdAt: new Date(),
    };
    this.departments.set(id, dept);
    return dept;
  }

  // Requests
  async getRequest(id: string): Promise<Request | undefined> {
    return this.requests.get(id);
  }

  async getRequestsByUser(userId: string): Promise<Request[]> {
    return Array.from(this.requests.values()).filter(r => r.requestorId === userId);
  }

  async getPendingApprovals(userId: string): Promise<Request[]> {
    return Array.from(this.requests.values()).filter(r => r.currentApproverId === userId);
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const id = randomUUID();
    const requestNumber = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const now = new Date();
    const request: Request = {
      ...insertRequest,
      id,
      requestNumber,
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
      completedAt: null,
      currentApproverId: null,
      workflowStage: 0,
      status: insertRequest.status || 'draft',
      priority: insertRequest.priority || 'normal',
      leaveType: insertRequest.leaveType || null,
      startDate: insertRequest.startDate || null,
      endDate: insertRequest.endDate || null,
      totalWorkingDays: insertRequest.totalWorkingDays || null,
      substituteStaffName: insertRequest.substituteStaffName || null,
      eventName: insertRequest.eventName || null,
      organizer: insertRequest.organizer || null,
      eventDates: insertRequest.eventDates || null,
      location: insertRequest.location || null,
      estimatedCost: insertRequest.estimatedCost || null,
      conferencePaper: insertRequest.conferencePaper || null,
      travelRequest: insertRequest.travelRequest || null,
      itemList: insertRequest.itemList || null,
      justification: insertRequest.justification || null,
      deliveryLocation: insertRequest.deliveryLocation || null,
      budgetCode: insertRequest.budgetCode || null,
    };
    this.requests.set(id, request);
    return request;
  }

  async updateRequest(id: string, data: Partial<Request>): Promise<Request | undefined> {
    const request = this.requests.get(id);
    if (!request) return undefined;
    const updated = { ...request, ...data, updatedAt: new Date() };
    this.requests.set(id, updated);
    return updated;
  }

  async searchRequests(query: string, filters?: any): Promise<Request[]> {
    let results = Array.from(this.requests.values());
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        r => r.title.toLowerCase().includes(lowerQuery) ||
             r.description.toLowerCase().includes(lowerQuery) ||
             r.requestNumber.toLowerCase().includes(lowerQuery)
      );
    }

    if (filters?.status && filters.status !== 'all') {
      results = results.filter(r => r.status === filters.status);
    }

    if (filters?.type && filters.type !== 'all') {
      results = results.filter(r => r.requestType === filters.type);
    }

    return results;
  }

  // Request Timeline
  async getRequestTimeline(requestId: string): Promise<RequestTimeline[]> {
    return Array.from(this.timeline.values())
      .filter(t => t.requestId === requestId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addTimelineEntry(insertEntry: InsertRequestTimeline): Promise<RequestTimeline> {
    const id = randomUUID();
    const entry: RequestTimeline = {
      ...insertEntry,
      id,
      createdAt: new Date(),
      comment: insertEntry.comment || null,
      metadata: insertEntry.metadata || null,
      ipAddress: insertEntry.ipAddress || null,
    };
    this.timeline.set(id, entry);
    return entry;
  }

  // Attachments
  async getRequestAttachments(requestId: string): Promise<Attachment[]> {
    return Array.from(this.attachments.values()).filter(a => a.requestId === requestId);
  }

  async createAttachment(insertAttachment: InsertAttachment): Promise<Attachment> {
    const id = randomUUID();
    const attachment: Attachment = {
      ...insertAttachment,
      id,
      createdAt: new Date(),
    };
    this.attachments.set(id, attachment);
    return attachment;
  }

  // Notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      createdAt: new Date(),
      isRead: false,
      emailSent: false,
      emailSentAt: null,
      link: insertNotification.link || null,
      requestId: insertNotification.requestId || null,
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationRead(id: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      this.notifications.set(id, { ...notification, isRead: true });
    }
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.userId === userId && !notification.isRead) {
        this.notifications.set(id, { ...notification, isRead: true });
      }
    }
  }

  async deleteNotification(id: string): Promise<void> {
    this.notifications.delete(id);
  }

  // Workflow Configs
  async getWorkflowConfig(requestType: string, departmentId?: string): Promise<WorkflowConfig | undefined> {
    return Array.from(this.workflows.values()).find(
      w => w.requestType === requestType && 
           (w.departmentId === departmentId || w.isDefault)
    );
  }

  // Audit Logs
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = {
      ...insertLog,
      id,
      createdAt: new Date(),
      userId: insertLog.userId || null,
      resourceType: insertLog.resourceType || null,
      resourceId: insertLog.resourceId || null,
      details: insertLog.details || null,
      ipAddress: insertLog.ipAddress || null,
      userAgent: insertLog.userAgent || null,
    };
    this.auditLogs.set(id, log);
    return log;
  }

  async searchAuditLogs(filters: any): Promise<AuditLog[]> {
    let results = Array.from(this.auditLogs.values());
    
    if (filters.userId) {
      results = results.filter(l => l.userId === filters.userId);
    }

    if (filters.action) {
      results = results.filter(l => l.action === filters.action);
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new MemStorage();
