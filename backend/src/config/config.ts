import { z } from "zod";

// ==================== ENUMS ====================

export const EmployeeStatusSchema = z.enum([
  "DRAFT",
  "INVITED",
  "ONBOARDING_SUBMITTED",
  "HR_VERIFIED",
  "AGREEMENT_SENT",
  "SIGNED",
]);

export const DocumentTypeSchema = z.enum([
  "ID_PROOF",
  "ADDRESS_PROOF",
  "PAN",
  "EDUCATION",
  "EXPERIENCE",
  "PHOTO",
  "OTHER",
]);

export const DocumentStatusSchema = z.enum([
  "UPLOADED",
  "HR_VERIFIED",
  "REJECTED",
]);

export const AgreementStatusSchema = z.enum([
  "GENERATED",
  "SENT",
  "SIGNED",
  "FAILED",
]);

export const AuditActorTypeSchema = z.enum([
  "HR",
  "EMPLOYEE",
  "SYSTEM",
  "WEBHOOK",
]);

export const AuditEntityTypeSchema = z.enum([
  "EMPLOYEE",
  "ONBOARDING_PROFILE",
  "DOCUMENT",
  "AGREEMENT",
  "WEBHOOK",
]);

export const AuditActionSchema = z.enum([
  "CREATE",
  "UPDATE",
  "STATUS_TRANSITION",
  "UPLOAD",
  "VERIFY",
  "REJECT",
  "WEBHOOK_RECEIVED",
  "SIGN",
]);

export const AdminRoleSchema = z.enum([
  "SUPER_ADMIN",
  "HR_ADMIN",
  "HR_VIEWER",
]);

// ==================== ADMIN USER ====================

export const createAdminUserSchema = z.object({
  email: z.email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  role: AdminRoleSchema.optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateAdminUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  role: AdminRoleSchema.optional(),
  isActive: z.boolean().optional(),
});

export const updateAdminPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const adminUserLoginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ==================== EMPLOYEE ====================
// NOTE: Status is NEVER controlled by clients - only by service layer state transitions

export const createEmployeeSchema = z.object({
  email: z.email("Invalid email address"),
  fullName: z.string().min(1, "Full name is required").optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional(),
});

export const updateEmployeeSchema = z.object({
  fullName: z.string().min(1, "Full name is required").optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional(),
});

export const inviteEmployeeSchema = z.object({
  email: z.email("Invalid email address"),
  fullName: z.string().min(1, "Full name is required").optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional(),
});

// ==================== ONBOARDING PROFILE ====================

export const createOnboardingProfileSchema = z.object({
  employeeId: z.uuid("Invalid employee ID"),
  submittedData: z.record(z.string(), z.unknown()).refine(
    (data) => Object.keys(data).length > 0,
    "Submitted data cannot be empty"
  ),
});

export const updateOnboardingProfileSchema = z.object({
  submittedData: z.record(z.string(), z.unknown()),
});

export const verifyOnboardingProfileSchema = z.object({
  verifiedSnapshot: z.record(z.string(), z.unknown()),
});

export const rejectOnboardingProfileSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required"),
});

// ==================== DOCUMENT ====================
// NOTE: Status transitions (UPLOADED → HR_VERIFIED → REJECTED) are service-controlled

export const uploadDocumentBodySchema = z.object({
  employeeId: z.uuid("Invalid employee ID"),
  type: DocumentTypeSchema,
  onboardingProfileId: z.uuid("Invalid onboarding profile ID").optional(),
});

export const verifyDocumentSchema = z.object({
  verifiedByHrEmail: z.email("Invalid email address"),
});

export const rejectDocumentSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required"),
});

// ==================== AGREEMENT ====================
// NOTE: Status is system-controlled through state machine

export const generateAgreementSchema = z.object({
  employeeId: z.uuid("Invalid employee ID"),
  onboardingProfileId: z.uuid("Invalid onboarding profile ID"),
});

export const sendAgreementSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  providerPayload: z.record(z.string(), z.unknown()).optional(),
});

export const agreementWebhookSchema = z.object({
  providerSigningId: z.string().min(1, "Provider signing ID is required"),
  signedBucket: z.string().min(1, "Signed bucket is required"),
  signedKey: z.string().min(1, "Signed key is required"),
  providerPayload: z.record(z.string(), z.unknown()).optional(),
});

// ==================== QUERY FILTERS ====================

export const employeeFilterSchema = z.object({
  status: EmployeeStatusSchema.optional(),
  email: z.string().optional(),
  search: z.string().optional(),
  createdAfter: z.coerce.date().optional(),
  createdBefore: z.coerce.date().optional(),
});

export const documentFilterSchema = z.object({
  employeeId: z.uuid("Invalid employee ID").optional(),
  type: DocumentTypeSchema.optional(),
  status: DocumentStatusSchema.optional(),
  uploadedAfter: z.coerce.date().optional(),
  uploadedBefore: z.coerce.date().optional(),
});

export const agreementFilterSchema = z.object({
  employeeId: z.uuid("Invalid employee ID").optional(),
  status: AgreementStatusSchema.optional(),
  generatedAfter: z.coerce.date().optional(),
  generatedBefore: z.coerce.date().optional(),
});

export const auditLogFilterSchema = z.object({
  entityType: AuditEntityTypeSchema.optional(),
  entityId: z.uuid("Invalid entity ID").optional(),
  actorType: AuditActorTypeSchema.optional(),
  action: AuditActionSchema.optional(),
  employeeId: z.uuid("Invalid employee ID").optional(),
  adminUserId: z.uuid("Invalid admin user ID").optional(),
  createdAfter: z.coerce.date().optional(),
  createdBefore: z.coerce.date().optional(),
});

// ==================== PAGINATION ====================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ==================== ID PARAMS ====================

export const uuidParamSchema = z.object({
  id: z.uuid("Invalid ID format"),
});

export const employeeIdParamSchema = z.object({
  employeeId: z.uuid("Invalid employee ID"),
});

export const documentIdParamSchema = z.object({
  documentId: z.uuid("Invalid document ID"),
});

export const agreementIdParamSchema = z.object({
  agreementId: z.uuid("Invalid agreement ID"),
});

// ==================== TYPE EXPORTS ====================

export type EmployeeStatus = z.infer<typeof EmployeeStatusSchema>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;
export type AgreementStatus = z.infer<typeof AgreementStatusSchema>;
export type AuditActorType = z.infer<typeof AuditActorTypeSchema>;
export type AuditEntityType = z.infer<typeof AuditEntityTypeSchema>;
export type AuditAction = z.infer<typeof AuditActionSchema>;
export type AdminRole = z.infer<typeof AdminRoleSchema>;

export type CreateAdminUser = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUser = z.infer<typeof updateAdminUserSchema>;
export type UpdateAdminPassword = z.infer<typeof updateAdminPasswordSchema>;
export type AdminUserLogin = z.infer<typeof adminUserLoginSchema>;

export type CreateEmployee = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployee = z.infer<typeof updateEmployeeSchema>;
export type InviteEmployee = z.infer<typeof inviteEmployeeSchema>;

export type CreateOnboardingProfile = z.infer<typeof createOnboardingProfileSchema>;
export type UpdateOnboardingProfile = z.infer<typeof updateOnboardingProfileSchema>;
export type VerifyOnboardingProfile = z.infer<typeof verifyOnboardingProfileSchema>;
export type RejectOnboardingProfile = z.infer<typeof rejectOnboardingProfileSchema>;

export type UploadDocumentBody = z.infer<typeof uploadDocumentBodySchema>;
export type VerifyDocument = z.infer<typeof verifyDocumentSchema>;
export type RejectDocument = z.infer<typeof rejectDocumentSchema>;

export type GenerateAgreement = z.infer<typeof generateAgreementSchema>;
export type SendAgreement = z.infer<typeof sendAgreementSchema>;
export type AgreementWebhook = z.infer<typeof agreementWebhookSchema>;

export type EmployeeFilter = z.infer<typeof employeeFilterSchema>;
export type DocumentFilter = z.infer<typeof documentFilterSchema>;
export type AgreementFilter = z.infer<typeof agreementFilterSchema>;
export type AuditLogFilter = z.infer<typeof auditLogFilterSchema>;

export type Pagination = z.infer<typeof paginationSchema>;
export type UuidParam = z.infer<typeof uuidParamSchema>;
export type EmployeeIdParam = z.infer<typeof employeeIdParamSchema>;
export type DocumentIdParam = z.infer<typeof documentIdParamSchema>;
export type AgreementIdParam = z.infer<typeof agreementIdParamSchema>;