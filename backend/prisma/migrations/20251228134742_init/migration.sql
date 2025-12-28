-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('DRAFT', 'INVITED', 'ONBOARDING_SUBMITTED', 'HR_VERIFIED', 'AGREEMENT_SENT', 'SIGNED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_PROOF', 'ADDRESS_PROOF', 'PAN', 'EDUCATION', 'EXPERIENCE', 'PHOTO', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'HR_VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('GENERATED', 'SENT', 'SIGNED', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('HR', 'EMPLOYEE', 'SYSTEM', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('EMPLOYEE', 'ONBOARDING_PROFILE', 'DOCUMENT', 'AGREEMENT', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'STATUS_TRANSITION', 'UPLOAD', 'VERIFY', 'REJECT', 'WEBHOOK_RECEIVED', 'SIGN');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'HR_ADMIN', 'HR_VIEWER');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'SUPER_ADMIN',
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "phone" TEXT,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'DRAFT',
    "invitedAt" TIMESTAMP(3),
    "onboardingSubmittedAt" TIMESTAMP(3),
    "hrVerifiedAt" TIMESTAMP(3),
    "agreementSentAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingProfile" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "submittedData" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedSnapshot" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "onboardingProfileId" TEXT,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "storageBucket" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "checksumSha256" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedByHrEmail" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "onboardingProfileId" TEXT NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'GENERATED',
    "unsignedBucket" TEXT NOT NULL,
    "unsignedKey" TEXT NOT NULL,
    "signedBucket" TEXT,
    "signedKey" TEXT,
    "checksumSha256" TEXT NOT NULL,
    "provider" TEXT,
    "providerRequestId" TEXT,
    "providerSigningId" TEXT,
    "providerPayload" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorType" "AuditActorType" NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "action" "AuditAction" NOT NULL,
    "summary" TEXT,
    "metadata" JSONB,
    "employeeId" TEXT,
    "adminUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE INDEX "Employee_createdAt_idx" ON "Employee"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProfile_employeeId_key" ON "OnboardingProfile"("employeeId");

-- CreateIndex
CREATE INDEX "OnboardingProfile_employeeId_idx" ON "OnboardingProfile"("employeeId");

-- CreateIndex
CREATE INDEX "OnboardingProfile_submittedAt_idx" ON "OnboardingProfile"("submittedAt");

-- CreateIndex
CREATE INDEX "Document_employeeId_idx" ON "Document"("employeeId");

-- CreateIndex
CREATE INDEX "Document_onboardingProfileId_idx" ON "Document"("onboardingProfileId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Document_storageBucket_storageKey_key" ON "Document"("storageBucket", "storageKey");

-- CreateIndex
CREATE INDEX "Agreement_employeeId_idx" ON "Agreement"("employeeId");

-- CreateIndex
CREATE INDEX "Agreement_onboardingProfileId_idx" ON "Agreement"("onboardingProfileId");

-- CreateIndex
CREATE INDEX "Agreement_status_idx" ON "Agreement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_unsignedBucket_unsignedKey_key" ON "Agreement"("unsignedBucket", "unsignedKey");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_employeeId_idx" ON "AuditLog"("employeeId");

-- CreateIndex
CREATE INDEX "AuditLog_adminUserId_idx" ON "AuditLog"("adminUserId");

-- CreateIndex
CREATE INDEX "AuditLog_actorType_idx" ON "AuditLog"("actorType");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "OnboardingProfile" ADD CONSTRAINT "OnboardingProfile_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_onboardingProfileId_fkey" FOREIGN KEY ("onboardingProfileId") REFERENCES "OnboardingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_onboardingProfileId_fkey" FOREIGN KEY ("onboardingProfileId") REFERENCES "OnboardingProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
