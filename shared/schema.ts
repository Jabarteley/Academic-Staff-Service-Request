import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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

// Departments table
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  faculty: text("faculty"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffNumber: text("staff_number").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  departmentId: varchar("department_id").references(() => departments.id),
  role: text("role").notNull(),
  status: text("status").notNull().default('active'),
  joinDate: timestamp("join_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  accountLockedUntil: timestamp("account_locked_until"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
  failedLoginAttempts: true,
  accountLockedUntil: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Requests table
export const requests = pgTable("requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestNumber: text("request_number").notNull().unique(),
  requestType: text("request_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default('draft'),
  priority: text("priority").default('normal'),
  requestorId: varchar("requestor_id").references(() => users.id).notNull(),
  departmentId: varchar("department_id").references(() => departments.id),
  currentApproverId: varchar("current_approver_id").references(() => users.id),
  workflowStage: integer("workflow_stage").default(0),
  
  // Leave request fields
  leaveType: text("leave_type"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  totalWorkingDays: integer("total_working_days"),
  substituteStaffName: text("substitute_staff_name"),
  
  // Conference/Training fields
  eventName: text("event_name"),
  organizer: text("organizer"),
  eventDates: text("event_dates"),
  location: text("location"),
  estimatedCost: text("estimated_cost"),
  conferencePaper: boolean("conference_paper"),
  travelRequest: boolean("travel_request"),
  
  // Resource Requisition fields
  itemList: jsonb("item_list"),
  justification: text("justification"),
  deliveryLocation: text("delivery_location"),
  budgetCode: text("budget_code"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  submittedAt: timestamp("submitted_at"),
  completedAt: timestamp("completed_at"),
});

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  requestNumber: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  completedAt: true,
  currentApproverId: true,
  workflowStage: true,
});

export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;

// Workflow configurations table
export const workflowConfigs = pgTable("workflow_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestType: text("request_type").notNull(),
  departmentId: varchar("department_id").references(() => departments.id),
  stages: jsonb("stages").notNull(), // Array of {role: string, order: number, escalationDays?: number}
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWorkflowConfigSchema = createInsertSchema(workflowConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkflowConfig = z.infer<typeof insertWorkflowConfigSchema>;
export type WorkflowConfig = typeof workflowConfigs.$inferSelect;

// Request timeline/history table
export const requestTimeline = pgTable("request_timeline", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").references(() => requests.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  comment: text("comment"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRequestTimelineSchema = createInsertSchema(requestTimeline).omit({
  id: true,
  createdAt: true,
});

export type InsertRequestTimeline = z.infer<typeof insertRequestTimelineSchema>;
export type RequestTimeline = typeof requestTimeline.$inferSelect;

// Attachments table
export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").references(() => requests.id).notNull(),
  uploaderId: varchar("uploader_id").references(() => users.id).notNull(),
  originalFilename: text("original_filename").notNull(),
  storedFilename: text("stored_filename").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  storageKey: text("storage_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  createdAt: true,
});

export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachments.$inferSelect;

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  requestId: varchar("request_id").references(() => requests.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  link: text("link"),
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// System settings table
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
