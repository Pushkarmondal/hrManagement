import { prisma } from "../../db/db";
import {
  EmployeeStatus,
  AuditAction,
  AuditActorType,
  AuditEntityType,
} from "../generated/prisma/client";

interface OnboardingSubmitDTO {
  personal: {
    dob: string;
    address: string;
    nationality?: string;
  };
  education: Array<{
    institution: string;
    degree: string;
    year: number;
  }>;
  workHistory: Array<{
    company: string;
    role: string;
    from: string;
    to?: string;
  }>;
}

export const submitOnboarding = async (req: any, res: any) => {
  const employeeId = req.employee.id;
  const payload = req.body as OnboardingSubmitDTO;

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: "Employee not found" });
    }

    if (employee.status !== EmployeeStatus.INVITED) {
      return res.status(400).json({
        success: false,
        error: `Onboarding not allowed in ${employee.status} state`
      });
    }

    // 🔒 Prevent duplicate submission
    const existingProfile = await prisma.onboardingProfile.findUnique({
      where: { employeeId }
    });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        error: "Onboarding already submitted"
      });
    }

    // 🔒 Basic payload validation
    if (
      !payload.personal ||
      !Array.isArray(payload.education) ||
      !Array.isArray(payload.workHistory)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid onboarding payload"
      });
    }

    // 🔒 ATOMIC OPERATION
    await prisma.$transaction(async (tx) => {
      const profile = await tx.onboardingProfile.create({
        data: {
          employeeId,
          submittedData: {
            personal: payload.personal,
            education: payload.education,
            workHistory: payload.workHistory
          }
        }
      });

      await tx.employee.update({
        where: { id: employeeId },
        data: {
          status: EmployeeStatus.ONBOARDING_SUBMITTED,
          onboardingSubmittedAt: new Date()
        }
      });

      await tx.auditLog.create({
        data: {
          entityType: AuditEntityType.ONBOARDING_PROFILE,
          entityId: profile.id,
          actorType: AuditActorType.EMPLOYEE,
          actorId: employeeId,
          action: AuditAction.CREATE,
          summary: "Employee onboarding submitted",
          employeeId
        }
      });
    });

    res.status(200).json({
      success: true,
      message: "Onboarding submitted successfully"
    });
  } catch (error) {
    console.error("Onboarding submit failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit onboarding"
    });
  }
};

