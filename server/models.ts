
import { model, Schema } from "mongoose";
import { 
  USER_ROLES, 
  REQUEST_TYPES, 
  REQUEST_STATUS, 
  LEAVE_TYPES 
} from "../shared/schema";

const facultySchema = new Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  deanId: { type: Schema.Types.ObjectId, ref: "User" },

}, { timestamps: true });

export const Faculty = model("Faculty", facultySchema);

const departmentSchema = new Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  facultyId: { type: Schema.Types.ObjectId, ref: "Faculty" },
  hodId: { type: Schema.Types.ObjectId, ref: "User" },
  
}, { timestamps: true });

export const Department = model("Department", departmentSchema);

const userSchema = new Schema({
  staffNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: { type: String },
  departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
  facultyId: { type: Schema.Types.ObjectId, ref: "Faculty" },
  role: { type: String, enum: Object.values(USER_ROLES), required: true },
  status: { type: String, default: "active" },
  joinDate: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  failedLoginAttempts: { type: Number, default: 0 },
  accountLockedUntil: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
}, { timestamps: true });

export const User = model("User", userSchema);

const requestSchema = new Schema({
  requestNumber: { type: String, required: true, unique: true },
  requestType: { type: String, enum: Object.values(REQUEST_TYPES), required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: Object.values(REQUEST_STATUS), default: "draft" },
  priority: { type: String, default: "normal" },
  requestorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
  currentApproverId: { type: Schema.Types.ObjectId, ref: "User" },
  workflowStage: { type: Number, default: 0 },
  
  // Leave request fields
  leaveType: { type: String, enum: Object.values(LEAVE_TYPES) },
  startDate: { type: Date },
  endDate: { type: Date },
  totalWorkingDays: { type: Number },
  substituteStaffName: { type: String },
  
  // Conference/Training fields
  eventName: { type: String },
  organizer: { type: String },
  eventDates: { type: String },
  location: { type: String },
  estimatedCost: { type: String },
  conferencePaper: { type: Boolean },
  travelRequest: { type: Boolean },
  
  // Resource Requisition fields
  itemList: { type: Schema.Types.Mixed },
  justification: { type: String },
  deliveryLocation: { type: String },
  budgetCode: { type: String },
  
  submittedAt: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true });

export const Request = model("Request", requestSchema);

const workflowConfigSchema = new Schema({
  requestType: { type: String, required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
  stages: { type: Schema.Types.Mixed, required: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

export const WorkflowConfig = model("WorkflowConfig", workflowConfigSchema);

const requestTimelineSchema = new Schema({
  requestId: { type: Schema.Types.ObjectId, ref: "Request", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  comment: { type: String },
  metadata: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
}, { timestamps: true });

export const RequestTimeline = model("RequestTimeline", requestTimelineSchema);

const attachmentSchema = new Schema({
  requestId: { type: Schema.Types.ObjectId, ref: "Request", required: true },
  uploaderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  originalFilename: { type: String, required: true },
  storedFilename: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  storageKey: { type: String, required: true },
}, { timestamps: true });

export const Attachment = model("Attachment", attachmentSchema);

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  requestId: { type: Schema.Types.ObjectId, ref: "Request" },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  link: { type: String },
  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date },
}, { timestamps: true });

export const Notification = model("Notification", notificationSchema);

const auditLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true },
  resourceType: { type: String },
  resourceId: { type: String },
  details: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

export const AuditLog = model("AuditLog", auditLogSchema);

const systemSettingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  description: { type: String },
}, { timestamps: true });

export const SystemSetting = model("SystemSetting", systemSettingSchema);
