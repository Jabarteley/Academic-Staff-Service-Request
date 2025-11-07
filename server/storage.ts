import { 
  User, 
  Department, 
  Request, 
  RequestTimeline, 
  Attachment, 
  Notification, 
  WorkflowConfig, 
  AuditLog,
  Faculty
} from "./models";
import type { 
  IStorage, 
  InsertUser, 
  InsertDepartment, 
  InsertRequest, 
  InsertRequestTimeline, 
  InsertAttachment, 
  InsertNotification, 
  InsertAuditLog,
  InsertFaculty,
  InsertWorkflowConfig,
  Faculty as FacultyType
} from "../shared/schema";
import { USER_ROLES } from "@shared/schema";
import { User as UserType, Department as DepartmentType, Request as RequestType, RequestTimeline as RequestTimelineType, Attachment as AttachmentType, Notification as NotificationType, WorkflowConfig as WorkflowConfigType, AuditLog as AuditLogType } from "../shared/schema";
import mongoose from "mongoose";

export class MongoStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<UserType | undefined> {
    const user = await User.findById(id).lean();
    if (!user) return undefined;
    
    // Handle null to undefined conversion for optional fields
    const processedUser = {
      ...user,
      id: user._id.toString(),
      departmentId: user.departmentId || undefined,
      facultyId: user.facultyId || undefined,
      phone: user.phone || undefined,
      lastLogin: user.lastLogin || undefined,
      accountLockedUntil: user.accountLockedUntil || undefined,
      passwordResetToken: user.passwordResetToken || undefined,
      passwordResetExpires: user.passwordResetExpires || undefined,
      failedLoginAttempts: user.failedLoginAttempts ?? 0
    };
    
    return processedUser as unknown as UserType;
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
    if (!updatedUser) return undefined;
    
    // Handle null to undefined conversion for optional fields
    const processedUser = {
      ...updatedUser,
      id: updatedUser._id.toString(),
      departmentId: updatedUser.departmentId || undefined,
      facultyId: updatedUser.facultyId || undefined,
      phone: updatedUser.phone || undefined,
      lastLogin: updatedUser.lastLogin || undefined,
      accountLockedUntil: updatedUser.accountLockedUntil || undefined,
      passwordResetToken: updatedUser.passwordResetToken || undefined,
      passwordResetExpires: updatedUser.passwordResetExpires || undefined,
      failedLoginAttempts: updatedUser.failedLoginAttempts ?? 0
    };
    
    return processedUser as unknown as UserType;
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

  async getUserByRoleAndFacultyId(role: string, facultyId: string): Promise<UserType | undefined> {
    const user = await User.findOne({ role, facultyId }).lean();
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

  async deleteUser(id: string): Promise<UserType | undefined> {
    const deletedUser = await User.findByIdAndDelete(id).lean();
    if (!deletedUser) return undefined;
    return { ...deletedUser, id: deletedUser._id.toString() } as unknown as UserType;
  }

  // Departments
  async getDepartment(id: string): Promise<DepartmentType | undefined> {
    const dept = await Department.findById(id).lean();
    if (!dept) return undefined;
    
    // Handle null to undefined conversion for optional fields
    const processedDept = {
      ...dept,
      id: dept._id.toString(),
      facultyId: dept.facultyId || undefined,
      hodId: dept.hodId || undefined
    };
    
    return processedDept as unknown as DepartmentType;
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

  async updateDepartment(id: string, data: Partial<DepartmentType>): Promise<DepartmentType | undefined> {
    const updatedDept = await Department.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!updatedDept) return undefined;
    
    // Handle null to undefined conversion for optional fields
    const processedDept = {
      ...updatedDept,
      id: updatedDept._id.toString(),
      facultyId: updatedDept.facultyId || undefined,
      hodId: updatedDept.hodId || undefined
    };
    
    return processedDept as unknown as DepartmentType;
  }

  // Faculties
  async getFaculty(id: string): Promise<FacultyType | undefined> {
    const faculty = await Faculty.findById(id).lean();
    if (!faculty) return undefined;
    
    // Handle null to undefined conversion for optional fields
    const processedFaculty = {
      ...faculty,
      id: faculty._id.toString(),
      deanId: faculty.deanId || undefined
    };
    
    return processedFaculty as unknown as FacultyType;
  }

  async getAllFaculties(): Promise<FacultyType[]> {
    const faculties = await Faculty.find().lean();
    return faculties.map(f => ({ ...f, id: f._id.toString() })) as unknown as FacultyType[];
  }

  async createFaculty(faculty: InsertFaculty): Promise<FacultyType> {
    const newFaculty = new Faculty(faculty);
    await newFaculty.save();
    return { ...newFaculty.toObject(), id: newFaculty._id.toString() } as unknown as FacultyType;
  }

  async updateFaculty(id: string, data: Partial<FacultyType>): Promise<FacultyType | undefined> {
    const updatedFaculty = await Faculty.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!updatedFaculty) return undefined;
    
    // Handle null to undefined conversion for optional fields
    const processedFaculty = {
      ...updatedFaculty,
      id: updatedFaculty._id.toString(),
      deanId: updatedFaculty.deanId || undefined
    };
    
    return processedFaculty as unknown as FacultyType;
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

    if (user.role === USER_ROLES.ADMIN_OFFICER) {
      // For ADMIN_OFFICER (HOD) role, show requests in their department that are pending approval
      // but exclude requests where they are the current approver (to avoid duplicates)
      query.$or.push({
        departmentId: user.departmentId,
        status: 'pending',
        currentApproverId: { $ne: user.id }
      });
    } else if (user.role === USER_ROLES.DEAN && user.facultyId) {
      // For DEAN role, show requests from all departments in their faculty
      // but exclude requests where they are the current approver (to avoid duplicates)
      const departmentsInFaculty = await Department.find({ facultyId: user.facultyId }).select('_id').lean();
      const departmentIds = departmentsInFaculty.map(dept => dept._id);
      if (departmentIds.length > 0) {
        query.$or.push({
          departmentId: { $in: departmentIds },
          status: 'pending',
          currentApproverId: { $ne: user.id }
        });
      }
    } else if (user.role === USER_ROLES.REGISTRAR) {
      // For REGISTRAR role, show all pending requests regardless of department or faculty
      // but exclude requests where they are the current approver (to avoid duplicates)
      query.$or.push({
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

  async getNotification(id: string): Promise<NotificationType | undefined> {
    const notification = await Notification.findById(id).lean();
    return notification ? { ...notification, id: notification._id.toString() } as unknown as NotificationType : undefined;
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

  async getWorkflowConfigById(id: string): Promise<WorkflowConfigType | undefined> {
    const config = await WorkflowConfig.findById(id).lean();
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
  
  async deleteWorkflowConfig(id: string): Promise<void> {
    await WorkflowConfig.findByIdAndDelete(id);
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

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      const userIdsFromSearch: mongoose.Types.ObjectId[] = [];

      // Try to find users by fullName matching the search term
      const matchingUsers = await User.find({ fullName: searchRegex }).select('_id').lean();
      if (matchingUsers.length > 0) {
        userIdsFromSearch.push(...matchingUsers.map(user => user._id));
      }

      // Build $or conditions
      const orConditions: any[] = [
        { action: searchRegex },
        { resourceType: searchRegex },
        { resourceId: searchRegex },
        { 'details.comment': searchRegex },
        { 'details.requestType': searchRegex },
        { 'details.previousStatus': searchRegex },
        { 'details.newStatus': searchRegex },
      ];

      if (userIdsFromSearch.length > 0) {
        orConditions.push({ userId: { $in: userIdsFromSearch } });
      }

      // Also allow searching directly by userId if the search term looks like an ObjectId
      if (mongoose.Types.ObjectId.isValid(filters.search)) {
        orConditions.push({ userId: new mongoose.Types.ObjectId(filters.search) });
      }

      mongoQuery.$or = orConditions;
    }

    if (filters.action && filters.action !== 'all') {
      if (mongoQuery.$or) {
        mongoQuery.$and = [ { $or: mongoQuery.$or }, { action: { $regex: filters.action, $options: 'i' } } ];
        delete mongoQuery.$or;
      } else {
        mongoQuery.action = { $regex: filters.action, $options: 'i' };
      }
    }

    console.log("MongoDB Query for Audit Logs:", JSON.stringify(mongoQuery, null, 2));

    const logs = await AuditLog.find(mongoQuery)
      .populate({ path: 'userId', select: 'fullName' })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log("Raw Audit Logs from DB:", JSON.stringify(logs, null, 2));

    return logs.map(l => ({
      ...l,
      id: l._id.toString(),
      userId: (l.userId as any)?.fullName || l.userId?.toString() || 'System',
    })) as unknown as AuditLogType[];
  }
}

export const storage = new MongoStorage();