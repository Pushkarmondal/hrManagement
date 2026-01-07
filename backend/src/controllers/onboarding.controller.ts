import { prisma } from "../../db/db";
import {
  EmployeeStatus,
  AuditAction,
  AuditActorType,
  AuditEntityType,
  Prisma
} from "../generated/prisma/client";

/**
 * POST /hr/onboarding/:id/verify
 */
export const verifyOnboarding = async (req: any, res: any) => {
  const onboardingProfileId = req.params.id;
  const hrUser = req.user;

  try {
    const profile = await prisma.onboardingProfile.findUnique({
      where: { id: onboardingProfileId },
      include: { employee: true }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Onboarding profile not found"
      });
    }

    if (profile.employee.status !== EmployeeStatus.ONBOARDING_SUBMITTED) {
      return res.status(400).json({
        success: false,
        error: `Cannot verify onboarding in ${profile.employee.status} state`
      });
    }

    // 🔒 ATOMIC VERIFICATION
    await prisma.$transaction(async (tx) => {
      // 1️⃣ Freeze verified snapshot
      await tx.onboardingProfile.update({
        where: { id: onboardingProfileId },
        data: {
          verifiedSnapshot: profile.submittedData as Prisma.InputJsonValue,
          verifiedAt: new Date(),
          rejectedAt: null,
          rejectionReason: null
        }
      });

      // 2️⃣ Update employee status
      await tx.employee.update({
        where: { id: profile.employeeId },
        data: {
          status: EmployeeStatus.HR_VERIFIED,
          hrVerifiedAt: new Date()
        }
      });

      // 3️⃣ Audit log
      await tx.auditLog.create({
        data: {
          entityType: AuditEntityType.ONBOARDING_PROFILE,
          entityId: onboardingProfileId,
          actorType: AuditActorType.HR,
          actorId: hrUser.sub,
          actorEmail: hrUser.email,
          action: AuditAction.VERIFY,
          summary: "Onboarding verified by HR",
          employeeId: profile.employeeId,
          adminUserId: hrUser.sub
        }
      });
    });

    res.status(200).json({
      success: true,
      message: "Onboarding verified successfully"
    });
  } catch (error) {
    console.error("Onboarding verification failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify onboarding"
    });
  }
};

/**
 * POST /hr/onboarding/:id/reject
 */
export const rejectOnboarding = async (req: any, res: any) => {
  const onboardingProfileId = req.params.id;
  const { reason } = req.body;
  const hrUser = req.user;

  if (!reason) {
    return res.status(400).json({
      success: false,
      error: "Rejection reason is required"
    });
  }

  try {
    const profile = await prisma.onboardingProfile.findUnique({
      where: { id: onboardingProfileId },
      include: { employee: true }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Onboarding profile not found"
      });
    }

    if (profile.employee.status !== EmployeeStatus.ONBOARDING_SUBMITTED) {
      return res.status(400).json({
        success: false,
        error: `Cannot reject onboarding in ${profile.employee.status} state`
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.onboardingProfile.update({
        where: { id: onboardingProfileId },
        data: {
          rejectedAt: new Date(),
          rejectionReason: reason
        }
      });

      // Employee stays in ONBOARDING_SUBMITTED
      // Employee can re-submit after fix

      await tx.auditLog.create({
        data: {
          entityType: AuditEntityType.ONBOARDING_PROFILE,
          entityId: onboardingProfileId,
          actorType: AuditActorType.HR,
          actorId: hrUser.sub,
          actorEmail: hrUser.email,
          action: AuditAction.REJECT,
          summary: "Onboarding rejected by HR",
          metadata: { reason },
          employeeId: profile.employeeId,
          adminUserId: hrUser.sub
        }
      });
    });

    res.status(200).json({
      success: true,
      message: "Onboarding rejected"
    });
  } catch (error) {
    console.error("Onboarding rejection failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reject onboarding"
    });
  }
};
