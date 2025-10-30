import { 
  User, 
  Department, 
  Request, 
  RequestTimeline, 
  Attachment, 
  Notification, 
  WorkflowConfig, 
  AuditLog 
} from "./models";
import type { 
  IStorage, 
  InsertUser, 
  InsertDepartment, 
  InsertRequest, 
  InsertRequestTimeline, 
  InsertAttachment, 
  InsertNotification, 
  InsertAuditLog 
} from "../shared/schema";
import { USER_ROLES } from "@shared/schema";
import { User as UserType, Department as DepartmentType, Request as RequestType, RequestTimeline as RequestTimelineType, Attachment as AttachmentType, Notification as NotificationType, WorkflowConfig as WorkflowConfigType, AuditLog as AuditLogType } from "../shared/schema";
import mongoose from "mongoose";

export class MongoStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<UserType | undefined> {
    const user = await User.findById(id).lean();
    return user ? { ...user, id: user._id.toString() } as unknown as UserType : undefined;
  }

  async getUserByEmail(email: string): Promise<UserType | undefined> {
    const user = await User.findOne({ email }).lean();
    return user ? { ...user, id: user._id.toString() } as unknown as UserType : undefined;
  }

  async getUserByStaffNumber(staffNumber: string): Promise<UserType | undefined> {
    const user = await User.findOne({ staffNumber }).lean();
    return user ? { ...user, id: user._id.toString() } as unknown as UserType : undefined;
  }

  async createUser(user: InsertUser): Promise<UserType> {
    const newUser = new User(user);
    await newUser.save();
    return { ...newUser.toObject(), id: newUser._id.toString() } as unknown as UserType;
  }

  async updateUser(id: string, data: Partial<UserType>): Promise<UserType | undefined> {
    const updatedUser = await User.findByIdAndUpdate(id, data, { new: true }).lean();
    return updatedUser ? { ...updatedUser, id: updatedUser._id.toString() } as unknown as UserType : undefined;
  }

  async getAllUsers(): Promise<UserType[]> {
    const users = await User.find().lean();
    return users.map(u => ({ ...u, id: u._id.toString() })) as unknown as UserType[];
  }

  async searchUsers(query: string): Promise<UserType[]> {
    const lowerQuery = query.toLowerCase();
    const users = await User.find({
      $or: [
        { fullName: { $regex: lowerQuery, $options: 'i' } },
        { email: { $regex: lowerQuery, $options: 'i' } },
        { staffNumber: { $regex: lowerQuery, $options: 'i' } },
      ],
    }).lean();
    return users.map(u => ({ ...u, id: u._id.toString() })) as unknown as UserType[];
  }

  async findUserByRole(role: string): Promise<UserType | undefined> {
    const user = await User.findOne({ role }).lean();
    return user ? { ...user, id: user._id.toString() } as unknown as UserType : undefined;
  }
  
  async getUserByRole(role: string): Promise<UserType | undefined> {
    const user = await User.findOne({ role }).lean();
    return user ? { ...user, id: user._id.toString() } as unknown as UserType : undefined;
  }
  
  async getUserByRoleAndFaculty(role: string, faculty: string): Promise<UserType | undefined> {
    const user = await User.findOne({ role, faculty }).lean();
    return user ? { ...user, id: user._id.toString() } as unknown as UserType : undefined;
  }

  async getUserByPasswordResetToken(token: string): Promise<UserType | undefined> {
    const user = await User.findOne({ 
      passwordResetToken: token, 
      passwordResetExpires: { $gt: new Date() } 
    }).lean();
    return user ? { ...user, id: user._id.toString() } as unknown as UserType : undefined;
  }

  async setPasswordResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await User.findByIdAndUpdate(userId, { 
      passwordResetToken: token, 
      passwordResetExpires: expires 
    });
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { 
      passwordResetToken: undefined, 
      passwordResetExpires: undefined 
    });
  }

  // Departments
  async getDepartment(id: string): Promise<DepartmentType | undefined> {
    const dept = await Department.findById(id).lean();
    return dept ? { ...dept, id: dept._id.toString() } as unknown as DepartmentType : undefined;
  }

  async getAllDepartments(): Promise<DepartmentType[]> {
    const depts = await Department.find().lean();
    return depts.map(d => ({ ...d, id: d._id.toString() })) as unknown as DepartmentType[];
  }

  async createDepartment(dept: InsertDepartment): Promise<DepartmentType> {
    const newDept = new Department(dept);
    await newDept.save();
    return { ...newDept.toObject(), id: newDept._id.toString() } as unknown as DepartmentType;
  }

  // Requests
  async getRequest(id: string): Promise<RequestType | undefined> {
    const request = await Request.findById(id).lean();
    if (!request) return undefined;

    return {
      ...request,
      id: request._id.toString(),
      currentApproverId: request.currentApproverId?.toString(),
    } as unknown as RequestType;
  }

  async getRequestsByUser(userId: string): Promise<RequestType[]> {
    const requests = await Request.find({ requestorId: new mongoose.Types.ObjectId(userId) }).lean();
    return requests.map(r => ({ ...r, id: r._id.toString() })) as unknown as RequestType[];
  }

  async getPendingApprovals(user: UserType): Promise<RequestType[]> {
    const query: any = {
      $or: [
        { currentApproverId: user.id },
      ]
    };

    if (user.role === USER_ROLES.ADMIN_OFFICER || user.role === USER_ROLES.DEAN) {
      // For ADMIN_OFFICER and DEAN roles, also show requests in their department that are pending approval
      // but exclude requests where they are the current approver (to avoid duplicates)
      query.$or.push({
        departmentId: user.departmentId,
        status: 'pending',
        currentApproverId: { $ne: user.id }
      });
    }

    const requests = await Request.find(query).lean();
    return requests.map(r => ({ ...r, id: r._id.toString() })) as unknown as RequestType[];
  }

  async createRequest(request: InsertRequest): Promise<RequestType> {
    const requestNumber = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const newRequest = new Request({ ...request, requestNumber });
    await newRequest.save();
    return { ...newRequest.toObject(), id: newRequest._id.toString() } as unknown as RequestType;
  }

  async updateRequest(id: string, data: Partial<RequestType>): Promise<RequestType | undefined> {
    const updatedRequest = await Request.findByIdAndUpdate(id, data, { new: true }).lean();
    return updatedRequest ? { ...updatedRequest, id: updatedRequest._id.toString() } as unknown as RequestType : undefined;
  }

  async searchRequests(query: string, filters?: any): Promise<RequestType[]> {
    const mongoQuery: any = {};
    if (query) {
      const lowerQuery = query.toLowerCase();
      mongoQuery.$or = [
        { title: { $regex: lowerQuery, $options: 'i' } },
        { description: { $regex: lowerQuery, $options: 'i' } },
        { requestNumber: { $regex: lowerQuery, $options: 'i' } },
      ];
    }

    if (filters?.status && filters.status !== 'all') {
      mongoQuery.status = filters.status;
    }

    if (filters?.type && filters.type !== 'all') {
      mongoQuery.requestType = filters.type;
    }

    const requests = await Request.find(mongoQuery).lean();
    return requests.map(r => ({ ...r, id: r._id.toString() })) as unknown as RequestType[];
  }

  // Request Timeline
  async getRequestTimeline(requestId: string): Promise<RequestTimelineType[]> {
    const timeline = await RequestTimeline.find({ requestId }).sort({ createdAt: -1 }).lean();
    return timeline.map(t => ({ ...t, id: t._id.toString() })) as unknown as RequestTimelineType[];
  }

  async addTimelineEntry(entry: InsertRequestTimeline): Promise<RequestTimelineType> {
    const newEntry = new RequestTimeline(entry);
    await newEntry.save();
    return { ...newEntry.toObject(), id: newEntry._id.toString() } as unknown as RequestTimelineType;
  }

  // Attachments
  async getRequestAttachments(requestId: string): Promise<AttachmentType[]> {
    const attachments = await Attachment.find({ requestId }).lean();
    return attachments.map(a => ({ ...a, id: a._id.toString() })) as unknown as AttachmentType[];
  }

  async createAttachment(attachment: InsertAttachment): Promise<AttachmentType> {
    const newAttachment = new Attachment(attachment);
    await newAttachment.save();
    return { ...newAttachment.toObject(), id: newAttachment._id.toString() } as unknown as AttachmentType;
  }

  // Notifications
  async getUserNotifications(userId: string): Promise<NotificationType[]> {
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).lean();
    return notifications.map(n => ({ ...n, id: n._id.toString() })) as unknown as NotificationType[];
  }

  async createNotification(notification: InsertNotification): Promise<NotificationType> {
    const newNotification = new Notification(notification);
    await newNotification.save();
    return { ...newNotification.toObject(), id: newNotification._id.toString() } as unknown as NotificationType;
  }

  async markNotificationRead(id: string): Promise<void> {
    await Notification.findByIdAndUpdate(id, { isRead: true });
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  }

  async deleteNotification(id: string): Promise<void> {
    await Notification.findByIdAndDelete(id);
  }

  // Workflow Configs
  async getWorkflowConfig(requestType: string, departmentId?: string): Promise<WorkflowConfigType | undefined> {
    const config = await WorkflowConfig.findOne({ requestType, departmentId }).lean();
    return config ? { ...config, id: config._id.toString() } as unknown as WorkflowConfigType : undefined;
  }

  async createWorkflowConfig(config: InsertWorkflowConfig): Promise<WorkflowConfigType> {
    const newConfig = new WorkflowConfig(config);
    await newConfig.save();
    return { ...newConfig.toObject(), id: newConfig._id.toString() } as unknown as WorkflowConfigType;
  }
  
  async updateWorkflowConfig(id: string, data: Partial<WorkflowConfigType>): Promise<WorkflowConfigType | undefined> {
    const updatedConfig = await WorkflowConfig.findByIdAndUpdate(id, data, { new: true }).lean();
    return updatedConfig ? { ...updatedConfig, id: updatedConfig._id.toString() } as unknown as WorkflowConfigType : undefined;
  }
  
  async getAllWorkflowConfigs(): Promise<WorkflowConfigType[]> {
    const configs = await WorkflowConfig.find().lean();
    return configs.map(c => ({ ...c, id: c._id.toString() })) as unknown as WorkflowConfigType[];
  }
  
  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLogType> {
    const newLog = new AuditLog(log);
    await newLog.save();
    return { ...newLog.toObject(), id: newLog._id.toString() } as unknown as AuditLogType;
  }

  async searchAuditLogs(filters: any): Promise<AuditLogType[]> {
    const mongoQuery: any = {};
    if (filters.userId) {
      mongoQuery.userId = filters.userId;
    }
    if (filters.action) {
      mongoQuery.action = filters.action;
    }
    const logs = await AuditLog.find(mongoQuery).sort({ createdAt: -1 }).lean();
    return logs.map(l => ({ ...l, id: l._id.toString() })) as unknown as AuditLogType[];
  }
}

export const storage = new MongoStorage();