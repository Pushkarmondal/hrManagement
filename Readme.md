## 📋 Overview

This is an internal HR onboarding system that handles employee data collection, document verification, and digital agreement signing. 

---

## 🎯 Core Concept

Every employee moves through **defined states** with clear transitions:

```markdown
DRAFT → INVITED → ONBOARDING_SUBMITTED → HR_VERIFIED → AGREEMENT_SENT → SIGNED → COMPLETED

```

### Key Rules

- Only HR can verify submissions
- Once signed, data becomes **immutable** (legal requirement)
- Every action is logged for audit trails
- System automatically progresses after e-signature

---

## 🏗️ System Architecture

### Services Overview

**1. Authentication & Identity**

- HR logs in via SSO (Google Workspace/Okta)
- Employees use **magic links** (no passwords needed)

**2. Onboarding Service** (Core)

- Manages employee profiles
- Handles forms (personal, education, work history)
- Controls state transitions
- Applies validation rules

**3. Document Management**

- Secure file uploads (Aadhaar, PAN, certificates)
- Virus scanning
- Immutable storage for signed documents

**4. Notifications**

- Automated emails (invites, reminders, agreements)
- Future: Slack/Teams webhooks

**5. E-Signature Integration**

- UIDAI eSign integration
- PDF generation
- Signature verification via webhooks

**6. HR Dashboard**

- Review employee submissions
- Approve/reject entries
- Trigger agreement sending

---

## 💾 Database Schema

### Tables (PostgreSQL)

**employees**

```sql
- id (uuid, primary key)
- name (text)
- email (text, unique)
- designation (text)
- salary (decimal)
- status (enum)
- created_at (timestamp)

```

**onboarding_profiles**

```sql
- id (uuid, primary key)
- employee_id (uuid, foreign key)
- personal_data (jsonb)
- education_data (jsonb)
- work_data (jsonb)
- submitted_at (timestamp)
- verified_at (timestamp)

```

**documents**

```sql
- id (uuid, primary key)
- employee_id (uuid, foreign key)
- type (enum: aadhaar, pan, resume, agreement)
- file_url (text)
- checksum (text)
- uploaded_at (timestamp)

```

**agreements**

```sql
- id (uuid, primary key)
- employee_id (uuid, foreign key)
- offer_letter_url (text)
- appointment_letter_url (text)
- esign_request_id (text)
- signed_at (timestamp)

```

**audit_logs** ⚠️ (Critical - Don't skip!)

```sql
- id (uuid, primary key)
- actor_type (enum: HR, EMPLOYEE, SYSTEM)
- actor_id (uuid)
- action (text)
- entity (text)
- entity_id (uuid)
- timestamp (timestamp)

```

---

## 🔌 API Design

### HR Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/hr/employees` | Create new employee |
| POST | `/hr/employees/:id/invite` | Send invitation email |
| GET | `/hr/onboarding/:id` | View submission |
| POST | `/hr/onboarding/:id/verify` | Approve submission |
| POST | `/hr/onboarding/:id/send-agreement` | Trigger e-sign process |

### Employee Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/employee/onboarding` | View own profile |
| POST | `/employee/onboarding/submit` | Submit form data |
| POST | `/employee/documents/upload` | Upload documents |
| GET | `/employee/agreement` | View agreement |
| POST | `/employee/esign/redirect` | Initiate e-signature |

### System Webhooks

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/webhooks/esign/uidai` | Receive signature confirmation |

---

## 📧 Email & Authentication Flow

### Magic Link System

**Invitation Email**

- Contains tokenized link: `/onboarding/start?token=xyz`
- Token expires in 24-72 hours
- One-time use only
- Token stored in Redis with employee ID

**Reminder System**

- Cron job runs daily
- Finds employees in `INVITED` status > 48 hours
- Sends reminder email
- Stops after submission

---

## ✍️ UIDAI E-Sign Integration

### Flow

1. **HR triggers agreement**
    - System generates Offer + Appointment PDFs
    - Stores document checksums
    - Creates UIDAI eSign request
2. **Employee redirected to UIDAI**
    - Employee completes Aadhaar-based signing
3. **UIDAI webhook callback**
    - System receives signed document
    - Verifies signature authenticity
    - Locks employee data (immutable)
    - Updates status to `SIGNED`
    - Generates final sealed PDFs

### Important Notes

- Never trust frontend redirects alone
- Webhook is the **source of truth**
- Handle failures gracefully (retry logic needed)

---

## 🔒 Security & Compliance

### Minimum Requirements

✅ Files stored in **private S3 buckets** (signed URLs only)

✅ Encryption at rest for sensitive data

✅ PII never logged in application logs

✅ Salary visible only to HR roles

✅ Signed documents in **write-once buckets** (immutable)

✅ All actions logged in audit table

✅ HTTPS only, no exceptions

### Why This Matters

This system generates **legal documents**. Auditors and legal teams will review this. Build it right from day one.

---

## 🛠️ Tech Stack

### Frontend

- **Next.js** (React framework)
- TypeScript
- Separate layouts for HR and Employee portals

### Backend

- **Node.js** + **Express**
- **TypeScript** (strongly typed)
- **Prisma** ORM
- **PostgreSQL** database
- **Redis** (for tokens and rate limiting)

### Infrastructure

- **AWS S3** - Document storage
- **AWS RDS** - PostgreSQL hosting
- **AWS SES** - Email delivery
- **AWS EC2/ECS** - Application hosting

### Additional Tools

- **pdf-lib** - PDF generation
- **multer** - File uploads
- **bcrypt** - Password hashing (for HR)
- **jsonwebtoken** - Token generation
- **nodemailer** - Email sending

---
