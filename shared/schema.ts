import { z } from "zod";

// User roles enum
export const USER_ROLES = {
  ACADEMIC_STAFF: 'academic_staff',
  ADMIN_OFFICER: 'admin_officer',
  DEAN: 'dean',
  REGISTRAR: 'registrar',
  SYS_ADMIN: 'sys_admin'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Request types enum
export const REQUEST_TYPES = {
  LEAVE: 'leave',
  CONFERENCE_TRAINING: 'conference_training',
  RESOURCE_REQUISITION: 'resource_requisition',
  GENERIC: 'generic'
} as const;

export type RequestType = typeof REQUEST_TYPES[keyof typeof REQUEST_TYPES];

// Request status enum
export const REQUEST_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  MODIFICATION_REQUESTED: 'modification_requested',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
} as const;

export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

// Leave types enum
export const LEAVE_TYPES = {
  ANNUAL: 'annual',
  SICK: 'sick',
  COMPASSIONATE: 'compassionate',
  CASUAL: 'casual',
  STUDY: 'study'
} as const;

export type LeaveType = typeof LEAVE_TYPES[keyof typeof LEAVE_TYPES];

// Base types
const baseSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Faculty
export const facultySchema = baseSchema.extend({
  name: z.string(),
  code: z.string(),
  deanId: z.string().optional(),
});

export const insertFacultySchema = facultySchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type Faculty = z.infer<typeof facultySchema>;

// Department
export const departmentSchema = baseSchema.extend({
  name: z.string(),
  code: z.string(),
  facultyId: z.string().optional(),
  hodId: z.string().optional(),
  
});

export const insertDepartmentSchema = departmentSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = z.infer<typeof departmentSchema>;

// User
export const userSchema = baseSchema.extend({
  staffNumber: z.string(),
  email: z.string(),
  password: z.string(),
  fullName: z.string(),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  facultyId: z.string().optional(),
  role: z.nativeEnum(USER_ROLES),
  status: z.string(),
  joinDate: z.date().optional(),
  lastLogin: z.date().optional(),
  failedLoginAttempts: z.number().optional(),
  accountLockedUntil: z.date().optional(),
});

export const insertUserSchema = userSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateUserSchema = insertUserSchema.partial().omit({ password: true, joinDate: true, lastLogin: true, accountLockedUntil: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;

// Request
export const requestSchema = baseSchema.extend({
  requestNumber: z.string(),
  requestType: z.nativeEnum(REQUEST_TYPES),
  title: z.string(),
  description: z.string(),
  status: z.nativeEnum(REQUEST_STATUS),
  priority: z.string().optional(),
  requestorId: z.string(),
  departmentId: z.string().optional(),
  currentApproverId: z.string().optional(),
  workflowStage: z.number().optional(),
  
  // Leave request fields
  leaveType: z.nativeEnum(LEAVE_TYPES).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  totalWorkingDays: z.number().optional(),
  substituteStaffName: z.string().optional(),
  
  // Conference/Training fields
  eventName: z.string().optional(),
  organizer: z.string().optional(),
  eventDates: z.string().optional(),
  location: z.string().optional(),
  estimatedCost: z.string().optional(),
  conferencePaper: z.boolean().optional(),
  travelRequest: z.boolean().optional(),
  
  // Resource Requisition fields
  itemList: z.any().optional(),
  justification: z.string().optional(),
  deliveryLocation: z.string().optional(),
  budgetCode: z.string().optional(),
  
  submittedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export const insertRequestSchema = requestSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = z.infer<typeof requestSchema>;

// WorkflowConfig
export const workflowConfigSchema = baseSchema.extend({
  requestType: z.string(),
  departmentId: z.string().optional(),
  stages: z.any(),
  isDefault: z.boolean().optional(),
});

export const insertWorkflowConfigSchema = workflowConfigSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWorkflowConfig = z.infer<typeof insertWorkflowConfigSchema>;
export type WorkflowConfig = z.infer<typeof workflowConfigSchema>;

// RequestTimeline
export const requestTimelineSchema = baseSchema.extend({
  requestId: z.string(),
  userId: z.string(),
  action: z.string(),
  comment: z.string().optional(),
  metadata: z.any().optional(),
  ipAddress: z.string().optional(),
});

export const insertRequestTimelineSchema = requestTimelineSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRequestTimeline = z.infer<typeof insertRequestTimelineSchema>;
export type RequestTimeline = z.infer<typeof requestTimelineSchema>;

// Attachment
export const attachmentSchema = baseSchema.extend({
  requestId: z.string(),
  uploaderId: z.string(),
  originalFilename: z.string(),
  storedFilename: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  storageKey: z.string(),
});

export const insertAttachmentSchema = attachmentSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = z.infer<typeof attachmentSchema>;

// Notification
export const notificationSchema = baseSchema.extend({
  userId: z.string(),
  requestId: z.string().optional(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  link: z.string().optional(),
  emailSent: z.boolean(),
  emailSentAt: z.date().optional(),
});

export const insertNotificationSchema = notificationSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = z.infer<typeof notificationSchema>;

// AuditLog
export const auditLogSchema = baseSchema.extend({
  userId: z.string().optional(),
  action: z.string(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  details: z.any().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export const insertAuditLogSchema = auditLogSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = z.infer<typeof auditLogSchema>;

// SystemSetting
export const systemSettingSchema = baseSchema.extend({
  key: z.string(),
  value: z.any(),
  description: z.string().optional(),
});

export const insertSystemSettingSchema = systemSettingSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = z.infer<typeof systemSettingSchema>;

// Interface for storage layer
export interface IStorage {
  getNotification(id: string): Promise<Notification | undefined>;
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStaffNumber(staffNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;
  findUserByRole(role: string): Promise<User | undefined>;
  getUserByRole(role: string): Promise<User | undefined>;
  getUserByRoleAndFaculty(role: string, faculty: string): Promise<User | undefined>;
  getUserByRoleAndFacultyId(role: string, facultyId: string): Promise<User | undefined>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  setPasswordResetToken(userId: string, token: string, expires: Date): Promise<void>;
  clearPasswordResetToken(userId: string): Promise<void>;
  deleteUser(id: string): Promise<User | undefined>;

  // Departments
  getDepartment(id: string): Promise<Department | undefined>;
  getAllDepartments(): Promise<Department[]>;
  createDepartment(dept: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, data: Partial<Department>): Promise<Department | undefined>;

  // Faculty
  getFaculty(id: string): Promise<Faculty | undefined>;
  getAllFaculties(): Promise<Faculty[]>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  updateFaculty(id: string, data: Partial<Faculty>): Promise<Faculty | undefined>;

  // Requests
  getRequest(id: string): Promise<Request | undefined>;
  getRequestsByUser(userId: string): Promise<Request[]>;
  getPendingApprovals(user: User): Promise<Request[]>;
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
  getNotification(id: string): Promise<Notification | undefined>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;

  // Workflow Configs
  getWorkflowConfig(requestType: string, departmentId?: string): Promise<WorkflowConfig | undefined>;
  createWorkflowConfig(config: InsertWorkflowConfig): Promise<WorkflowConfig>;
  getWorkflowConfigById(id: string): Promise<WorkflowConfig | undefined>;
  updateWorkflowConfig(id: string, data: Partial<WorkflowConfig>): Promise<WorkflowConfig | undefined>;
  deleteWorkflowConfig(id: string): Promise<void>;
  getAllWorkflowConfigs(): Promise<WorkflowConfig[]>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  searchAuditLogs(filters: any): Promise<AuditLog[]>;
}