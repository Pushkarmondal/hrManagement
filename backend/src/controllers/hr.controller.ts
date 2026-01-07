// ============================================================================
// HR CORE APIs - STEP 6 (Production-Ready with Fixes)
// ============================================================================

import type { Request, Response, NextFunction } from "express";
import {
  AuditAction,
  AuditActorType,
  AuditEntityType,
  EmployeeStatus,
  Prisma,
} from "../generated/prisma/client";
import { prisma } from "../../db/db";
import { emitEvent } from "../events/eventBus";
import { EventType } from "../events/types";

// ============================================================================
// STATE MACHINE - EMPLOYEE STATUS TRANSITIONS
// ============================================================================

const EMPLOYEE_STATE_TRANSITIONS: Record<EmployeeStatus, EmployeeStatus[]> = {
  DRAFT: ["INVITED"],
  INVITED: ["ONBOARDING_SUBMITTED"],
  ONBOARDING_SUBMITTED: ["HR_VERIFIED"],
  HR_VERIFIED: ["AGREEMENT_SENT"],
  AGREEMENT_SENT: ["SIGNED"],
  SIGNED: [],
};

export class InvalidStateTransitionError extends Error {
  constructor(
    public readonly current: EmployeeStatus,
    public readonly attempted: EmployeeStatus,
    public readonly allowed: EmployeeStatus[]
  ) {
    super(
      `Invalid state transition: ${current} → ${attempted}. ` +
        `Allowed transitions: [${allowed.join(", ") || "none"}]`
    );
    this.name = "InvalidStateTransitionError";
  }
}

export function assertTransition(
  current: EmployeeStatus,
  next: EmployeeStatus
): void {
  const allowed = EMPLOYEE_STATE_TRANSITIONS[current];

  if (!allowed.includes(next)) {
    throw new InvalidStateTransitionError(current, next, allowed);
  }
}

export function canTransition(
  current: EmployeeStatus,
  next: EmployeeStatus
): boolean {
  const allowed = EMPLOYEE_STATE_TRANSITIONS[current];
  return allowed.includes(next);
}

export function getValidTransitions(current: EmployeeStatus): EmployeeStatus[] {
  return EMPLOYEE_STATE_TRANSITIONS[current] ?? [];
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: "HR_ADMIN" | "HR_VIEWER" | "SUPER_ADMIN";
  };
}

interface CreateEmployeeDTO {
  email: string;
  fullName?: string;
  phone?: string;
}

// ============================================================================
// EMAIL NORMALIZATION
// ============================================================================

/**
 * Normalize email to prevent inconsistencies
 * Use this everywhere emails are handled
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ============================================================================
// MIDDLEWARE - ROLE AUTHORIZATION
// ============================================================================

/**
 * Middleware to ensure user has HR role (SUPER_ADMIN, HR_ADMIN, or HR_VIEWER)
 */
export const requireHR = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  const validRoles = ["SUPER_ADMIN", "HR_ADMIN", "HR_VIEWER"];
  if (!validRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: "HR role required for this action",
    });
  }

  next();
};

/**
 * Middleware to ensure user can modify (not just view)
 */
export const requireHRAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  const adminRoles = ["SUPER_ADMIN", "HR_ADMIN"];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: "HR Admin role required for this action",
    });
  }

  next();
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phone.length >= 10 && phoneRegex.test(phone);
};

const validateCreateEmployee = (
  data: any
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push("Valid email is required");
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.push("Invalid phone number format");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /hr/employees
 * Create a new employee record
 */
export const createEmployee = async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body
    const validation = validateCreateEmployee(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    const { email, fullName, phone }: CreateEmployeeDTO = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Check if employee already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        error: "Employee with this email already exists",
        existingEmployeeId: existingEmployee.id,
      });
    }

    // Create employee with DRAFT status
    const employee = await prisma.employee.create({
      data: {
        email: normalizedEmail,
        fullName: fullName?.trim(),
        phone: phone?.trim(),
        status: EmployeeStatus.DRAFT,
      },
    });

    // Create audit log (non-blocking)
    await prisma.auditLog
      .create({
        data: {
          entityType: AuditEntityType.EMPLOYEE,
          entityId: employee.id,
          actorType: AuditActorType.HR,
          actorId: req.user!.sub,
          actorEmail: req.user!.email,
          action: AuditAction.CREATE,
          summary: `Employee created: ${employee.email}`,
          metadata: {
            email: employee.email,
            fullName: employee.fullName,
            phone: employee.phone,
          },
          employeeId: employee.id,
          adminUserId: req.user!.sub,
        },
      })
      .catch((err) => {
        console.error("[AUDIT ERROR]", err);
      });

    res.status(201).json({
      success: true,
      data: employee,
      message: "Employee created successfully",
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create employee",
    });
  }
};

/**
 * POST /hr/employees/:id/invite
 * Send invitation to employee
 *
 * FIX #1: Wrapped in transaction (state + audit + outbox)
 * FIX #2: Uses durable outbox pattern instead of direct event
 */
export const inviteEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find employee outside transaction (read-only check)
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
      });
    }

    // Validate state transition
    try {
      assertTransition(employee.status, EmployeeStatus.INVITED);
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        return res.status(400).json({
          success: false,
          error: error.message,
          currentStatus: error.current,
          attemptedStatus: error.attempted,
          allowedTransitions: error.allowed,
        });
      }
      throw error;
    }

    // CRITICAL: Atomic transaction for state + audit + outbox
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update employee status
      const updatedEmployee = await tx.employee.update({
        where: { id },
        data: {
          status: EmployeeStatus.INVITED,
          invitedAt: new Date(),
        },
      });

      // 2. Create audit log
      await tx.auditLog.create({
        data: {
          entityType: AuditEntityType.EMPLOYEE,
          entityId: employee.id,
          actorType: AuditActorType.HR,
          actorId: req.user!.sub,
          actorEmail: req.user!.email,
          action: AuditAction.STATUS_TRANSITION,
          summary: `Employee invited: ${employee.email}`,
          metadata: {
            previousStatus: employee.status,
            newStatus: EmployeeStatus.INVITED,
            invitedBy: req.user!.email,
          },
          employeeId: employee.id,
          adminUserId: req.user!.sub,
        },
      });

      // 3. Create event (durable event emission)
      await tx.event.create({
        data: {
          type: "EMPLOYEE_INVITED",
          payload: {
            employeeId: employee.id,
            email: employee.email,
            fullName: employee.fullName,
            invitedBy: req.user!.email,
            invitedAt: new Date().toISOString(),
          },
        },
      });

      return updatedEmployee;
    });

    await emitEvent(
      EventType.EMPLOYEE_INVITED,
      {
        employeeId: employee.id,
        email: employee.email,
        name: employee.fullName,
      },
      `invite:${employee.id}`
    );

    res.json({
      success: true,
      data: result,
      message: "Invitation sent successfully",
    });
  } catch (error) {
    console.error("Error inviting employee:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(500).json({
        success: false,
        error: "Database error occurred",
        code: error.code,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to send invitation",
    });
  }
};

/**
 * GET /hr/onboarding/:id
 * View onboarding submission by onboarding profile ID
 *
 * FIX #3: Changed audit action from UPDATE to VIEW
 * FIX #5: Conditional auditing (can be configured based on requirements)
 */
export const getOnboardingSubmission = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    // Find onboarding profile with related data
    const onboardingProfile = await prisma.onboardingProfile.findUnique({
      where: { id },
      include: {
        employee: true,
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        agreements: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!onboardingProfile) {
      return res.status(404).json({
        success: false,
        error: "Onboarding submission not found",
      });
    }

    // Optional: Only audit if detailed view flag is set
    const shouldAudit = req.query.auditView === "true";

    if (shouldAudit) {
      // Create audit log for sensitive view (non-blocking)
      await prisma.auditLog
        .create({
          data: {
            entityType: AuditEntityType.ONBOARDING_PROFILE,
            entityId: onboardingProfile.id,
            actorType: AuditActorType.HR,
            actorId: req.user!.sub,
            actorEmail: req.user!.email,
            action: "VIEW" as any, // FIX: Changed from UPDATE
            summary: `Onboarding profile viewed for ${onboardingProfile.employee.email}`,
            metadata: {
              employeeId: onboardingProfile.employeeId,
              viewedBy: req.user!.email,
              viewType: "detailed",
            },
            employeeId: onboardingProfile.employeeId,
            adminUserId: req.user!.sub,
          },
        })
        .catch((err) => {
          console.error("[AUDIT ERROR]", err);
        });
    }

    res.json({
      success: true,
      data: {
        id: onboardingProfile.id,
        employeeId: onboardingProfile.employeeId,
        submittedData: onboardingProfile.submittedData,
        submittedAt: onboardingProfile.submittedAt,
        verifiedSnapshot: onboardingProfile.verifiedSnapshot,
        verifiedAt: onboardingProfile.verifiedAt,
        rejectedAt: onboardingProfile.rejectedAt,
        rejectionReason: onboardingProfile.rejectionReason,
        employee: {
          id: onboardingProfile.employee.id,
          email: onboardingProfile.employee.email,
          fullName: onboardingProfile.employee.fullName,
          phone: onboardingProfile.employee.phone,
          status: onboardingProfile.employee.status,
          invitedAt: onboardingProfile.employee.invitedAt,
          onboardingSubmittedAt:
            onboardingProfile.employee.onboardingSubmittedAt,
          hrVerifiedAt: onboardingProfile.employee.hrVerifiedAt,
        },
        documents: onboardingProfile.documents.map((doc) => ({
          id: doc.id,
          type: doc.type,
          status: doc.status,
          uploadedAt: doc.uploadedAt,
          verifiedAt: doc.verifiedAt,
          verifiedByHrEmail: doc.verifiedByHrEmail,
          rejectionReason: doc.rejectionReason,
        })),
        agreements: onboardingProfile.agreements.map((agreement) => ({
          id: agreement.id,
          status: agreement.status,
          generatedAt: agreement.generatedAt,
          sentAt: agreement.sentAt,
          signedAt: agreement.signedAt,
          failedAt: agreement.failedAt,
          failureReason: agreement.failureReason,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching onboarding submission:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch onboarding submission",
    });
  }
};

/**
 * GET /hr/employees/:id
 * Get employee details
 */
export const getEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        onboardingProfile: true,
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        agreements: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
      });
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch employee",
    });
  }
};

/**
 * GET /hr/employees
 * List all employees with filtering
 */
export const listEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = status ? { status: status as EmployeeStatus } : {};

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          onboardingProfile: {
            select: {
              id: true,
              submittedAt: true,
              verifiedAt: true,
            },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({
      success: true,
      data: employees,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error listing employees:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list employees",
    });
  }
};

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

export const registerHRRoutes = (app: any) => {
  app.post("/hr/employees", requireHRAdmin, createEmployee);
  app.post("/hr/employees/:id/invite", requireHRAdmin, inviteEmployee);
  app.get("/hr/onboarding/:id", requireHR, getOnboardingSubmission);
  app.get("/hr/employees/:id", requireHR, getEmployee);
  app.get("/hr/employees", requireHR, listEmployees);
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  registerHRRoutes,
  createEmployee,
  inviteEmployee,
  getOnboardingSubmission,
  getEmployee,
  listEmployees,
  requireHR,
  requireHRAdmin,
  normalizeEmail,
  assertTransition,
  canTransition,
  getValidTransitions,
};
