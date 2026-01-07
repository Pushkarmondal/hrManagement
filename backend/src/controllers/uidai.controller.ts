// controllers/webhooks/uidai.controller.ts
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { prisma } from "../../db/db";
import {
  AgreementStatus,
  EmployeeStatus,
  AuditAction,
  AuditActorType,
  AuditEntityType
} from "../generated/prisma/client";
import { verifyUidaiSignature } from "../utils/esign/verifyUidaiSignature";

export const uidaiEsignWebhook = async (req: any, res: any) => {
  const payload = req.body;

  try {
    // 1️⃣ Verify webhook authenticity
    if (!verifyUidaiSignature(payload)) {
      return res.status(400).json({ error: "Invalid eSign signature" });
    }

    const agreement = await prisma.agreement.findUnique({
      where: { id: payload.agreementId }
    });

    if (!agreement) {
      return res.status(404).json({ error: "Agreement not found" });
    }

    // 2️⃣ Idempotency
    if (agreement.status === AgreementStatus.SIGNED) {
      return res.status(200).json({ success: true });
    }

    if (agreement.status !== AgreementStatus.SENT) {
      return res.status(400).json({
        error: `Invalid agreement state: ${agreement.status}`
      });
    }

    // 3️⃣ Decode signed PDF
    const signedPdfBuffer = Buffer.from(
      payload.signedPdfBase64,
      "base64"
    );

    // 4️⃣ Compute checksum
    const signedChecksum = crypto
      .createHash("sha256")
      .update(signedPdfBuffer)
      .digest("hex");

    // 5️⃣ Match checksum (CRITICAL)
    if (agreement.checksumSha256 === signedChecksum) {
      // suspicious: signed doc must differ from unsigned
      return res.status(400).json({
        error: "Signed document checksum invalid"
      });
    }

    // 6️⃣ Store signed PDF (IMMUTABLE)
    const immutableDir = path.join(
      process.cwd(),
      "storage/agreements/signed",
      agreement.employeeId
    );

    await fs.mkdir(immutableDir, { recursive: true });

    const signedPath = path.join(
      immutableDir,
      "agreement-signed.pdf"
    );

    // wx = fail if exists (IMMUTABILITY)
    await fs.writeFile(signedPath, signedPdfBuffer, { flag: "wx" });

    // 7️⃣ ATOMIC FINALIZATION
    await prisma.$transaction(async (tx) => {
      await tx.agreement.update({
        where: { id: agreement.id },
        data: {
          status: AgreementStatus.SIGNED,
          signedBucket: "LOCAL_IMMUTABLE",
          signedKey: `${agreement.employeeId}/agreement-signed.pdf`,
          signedAt: new Date(),
          providerSigningId: payload.providerSigningId,
          providerPayload: payload,
          checksumSha256: signedChecksum
        }
      });

      await tx.employee.update({
        where: { id: agreement.employeeId },
        data: {
          status: EmployeeStatus.SIGNED,
          signedAt: new Date()
        }
      });

      await tx.auditLog.create({
        data: {
          entityType: AuditEntityType.AGREEMENT,
          entityId: agreement.id,
          actorType: AuditActorType.WEBHOOK,
          action: AuditAction.SIGN,
          summary: "Agreement signed via UIDAI eSign",
          employeeId: agreement.employeeId
        }
      });
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("UIDAI webhook failure:", err);
    return res.status(500).json({
      error: "Webhook processing failed"
    });
  }
};
