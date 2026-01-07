import fs from "fs/promises";
import path from "path";
import { generateAgreementPdf } from "../utils/pdf/generateAgreementPdf";
import { sha256 } from "../utils/crypto";
import { prisma } from "../../db/db";
import { AgreementStatus, AuditAction, AuditActorType, AuditEntityType, EmployeeStatus } from "../generated/prisma/enums";


export const sendAgreement = async (req: any, res: any) => {
  const onboardingProfileId = req.params.id;
  const hrUser = req.user;

  try {
    const profile = await prisma.onboardingProfile.findUnique({
      where: { id: onboardingProfileId },
      include: { employee: true },
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: "Onboarding not found" });
    }

    if (profile.employee.status !== EmployeeStatus.HR_VERIFIED) {
      return res.status(400).json({
        success: false,
        error: `Agreements cannot be generated in ${profile.employee.status} state`,
      });
    }

    // Prevent duplicate generation
    const existingAgreement = await prisma.agreement.findFirst({
      where: { onboardingProfileId },
    });

    if (existingAgreement) {
      return res.status(409).json({
        success: false,
        error: "Agreement already generated",
      });
    }

    // 1️⃣ Generate PDFs
    const offerPdf = await generateAgreementPdf({
      title: "Offer Letter",
      employeeName: profile.employee.fullName ?? "Employee",
      employeeEmail: profile.employee.email,
      date: new Date().toISOString(),
    });

    const appointmentPdf = await generateAgreementPdf({
      title: "Appointment Letter",
      employeeName: profile.employee.fullName ?? "Employee",
      employeeEmail: profile.employee.email,
      date: new Date().toISOString(),
    });

    const offerBuffer = Buffer.from(offerPdf);
    const appointmentBuffer = Buffer.from(appointmentPdf);

    // 2️⃣ Checksums (BEFORE persistence)
    const offerChecksum = sha256(offerBuffer);
    const appointmentChecksum = sha256(appointmentBuffer);

    // 3️⃣ Save locally (temporary storage)
    const baseDir = path.join(
      process.cwd(),
      "storage/agreements",
      profile.employeeId
    );

    await fs.mkdir(baseDir, { recursive: true });

    const offerPath = path.join(baseDir, "offer-letter.pdf");
    const appointmentPath = path.join(baseDir, "appointment-letter.pdf");

    await fs.writeFile(offerPath, offerBuffer);
    await fs.writeFile(appointmentPath, appointmentBuffer);

    // 4️⃣ Atomic DB update
    await prisma.$transaction(async (tx: any) => {
      await tx.agreement.create({
        data: {
          employeeId: profile.employeeId,
          onboardingProfileId: profile.id,
          status: AgreementStatus.SENT,

          unsignedBucket: "LOCAL",
          unsignedKey: `${profile.employeeId}/offer-letter.pdf`,
          checksumSha256: offerChecksum,

          provider: "LOCAL_PDF",
          providerPayload: {
            appointmentChecksum,
          },
        },
      });

      await tx.employee.update({
        where: { id: profile.employeeId },
        data: {
          status: EmployeeStatus.AGREEMENT_SENT,
          agreementSentAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: AuditEntityType.AGREEMENT,
          entityId: profile.id,
          actorType: AuditActorType.HR,
          actorId: hrUser.sub,
          actorEmail: hrUser.email,
          action: AuditAction.CREATE,
          summary: "Agreement generated and sent",
          employeeId: profile.employeeId,
          adminUserId: hrUser.sub,
        },
      });
    });

    res.status(200).json({
      success: true,
      message: "Agreement generated successfully",
    });
  } catch (error) {
    console.error("Agreement generation failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate agreement",
    });
  }
};
