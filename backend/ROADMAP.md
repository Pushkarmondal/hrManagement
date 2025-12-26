# HR Onboarding System - Build Roadmap

> **What we're building:** A legally auditable state machine with irreversible transitions  
> **Not:** Just another onboarding form app

---

## 🎯 Core Principles (Read First)

Before writing any code, these are **non-negotiable**:

- ✅ States are immutable after `SIGNED`
- ✅ Only HR can move verification states
- ✅ Webhook > frontend > everything else
- ✅ Audit logs are append-only
- ✅ Signed docs are write-once

**If you violate these, stop and refactor immediately.**

---

## 📊 Progress Tracker

| Step | Task | Status | Days | Priority |
|------|------|--------|------|----------|
| 0 | Lock the Rules | ⬜ | 0.5 | 🔴 Critical |
| 1 | Repo + Infra Skeleton | ⬜ | 1 | 🔴 Critical |
| 2 | Database Schema + Constraints | ⬜ | 1-2 | 🔴 Critical |
| 3 | State Machine Enforcement | ⬜ | 1 | 🔴 Critical |
| 4 | Authentication | ⬜ | 1 | 🔴 Critical |
| 5 | Audit Logging Middleware | ⬜ | 1 | 🔴 Critical |
| 6 | HR Core APIs | ⬜ | 1 | 🟡 High |
| 7 | Employee Onboarding Submission | ⬜ | 1 | 🟡 High |
| 8 | HR Verification Flow | ⬜ | 1 | 🟡 High |
| 9 | Agreement Generation | ⬜ | 1 | 🟡 High |
| 10 | UIDAI eSign Integration | ⬜ | 2 | 🔴 Critical |
| 11 | Data Locking & Immutability | ⬜ | 1 | 🔴 Critical |
| 12 | Notifications & Cron | ⬜ | 1 | 🟢 Medium |
| 13 | Frontend (Employee + HR) | ⬜ | 3-4 | 🟡 High |
| 14 | Production Hardening | ⬜ | 2 | 🔴 Critical |

**Total Estimated Time:** 16-20 days

---

## 🏗️ Detailed Build Steps

### STEP 0 — Lock the Rules (0.5 day)

**Goal:** Document non-negotiables before writing code

**Tasks:**
- [ ] Create `RULES.md` in repo root
- [ ] Document all state transition rules
- [ ] Define who can perform which actions
- [ ] Establish immutability boundaries
- [ ] Get team sign-off

**Deliverable:** A rules document that everyone has read and agreed to

**Why First:** Future decisions will reference this document

---

### STEP 1 — Repo + Infra Skeleton (Day 1)

**Goal:** Get basic backend running

**Tasks:**
- [ ] Initialize repo (monorepo or single)
- [ ] Set up Node.js + TypeScript + Express
- [ ] Install Prisma ORM
- [ ] Set up PostgreSQL connection
- [ ] Set up Redis connection
- [ ] Create `/health` endpoint

**Deliverable:**
```bash
curl http://localhost:3000/health
# { "status": "ok", "db": "connected" }
```

**Blocker Alert:** If migrations fail, STOP. Fix before continuing.

---

### STEP 2 — Database Schema + Constraints (Day 1-2)

**Goal:** Build the foundation with correct constraints

**Tasks:**
- [ ] Define Prisma schema for all tables:
  - [ ] `employees`
  - [ ] `onboarding_profiles`
  - [ ] `documents`
  - [ ] `agreements`
  - [ ] `audit_logs`
- [ ] Create status enum
- [ ] Add DB trigger to prevent updates after `SIGNED`
- [ ] Make `audit_logs` append-only (no UPDATE/DELETE)
- [ ] Run migrations

**Deliverable:**
- [ ] `prisma migrate deploy` works cleanly
- [ ] Can insert test data manually
- [ ] Illegal state changes are blocked by DB

**Test:**
```sql
-- This should FAIL
UPDATE employees SET status = 'DRAFT' WHERE status = 'SIGNED';
```

---

### STEP 3 — State Machine Enforcement (Day 2)

**Goal:** Prevent invalid state transitions in code

**Tasks:**
- [ ] Create `StateTransition` utility class
- [ ] Define allowed transition map
- [ ] Write `assertTransition(current, next)` function
- [ ] Add unit tests for all transitions
- [ ] Ensure all status updates use this guard

**Deliverable:**
```typescript
// ✅ Should pass
assertTransition('AGREEMENT_SENT', 'SIGNED');

// ❌ Should throw error
assertTransition('INVITED', 'SIGNED');
```

**Blocker Alert:** If direct updates bypass this, refactor immediately.

---

### STEP 4 — Authentication (Day 3)

**Goal:** Secure access for HR and employees

**HR Auth:**
- [ ] Email-based SSO stub (hardcode HR emails initially)
- [ ] Issue JWT with `role = 'HR'`
- [ ] Create auth middleware

**Employee Auth (Magic Link):**
- [ ] Generate tokens stored in Redis
- [ ] Set TTL to 48 hours
- [ ] Make tokens one-time use
- [ ] Map tokens to `employee_id`

**Deliverable:**
- [ ] HR can login and get JWT
- [ ] Employee can access `/employee/me` with magic link
- [ ] No passwords for employees

---

### STEP 5 — Audit Logging Middleware (Day 3)

**Goal:** Track every important action automatically

**Tasks:**
- [ ] Create global Express middleware
- [ ] Log all state changes
- [ ] Log all document uploads
- [ ] Log all verifications
- [ ] Log all webhook calls
- [ ] Include: actor, action, entity, timestamp

**Deliverable:**
For any action, you can answer:
- Who did it?
- What changed?
- When?

**Anti-pattern:** Manual logging in each controller = ❌ Redo it

---

### STEP 6 — HR Core APIs (Day 4)

**Goal:** Enable HR to create and invite employees

**Endpoints to Build:**
- [ ] `POST /hr/employees` - Create employee
- [ ] `POST /hr/employees/:id/invite` - Send invitation
- [ ] `GET /hr/onboarding/:id` - View submission

**Rules:**
- [ ] HR role required
- [ ] Invite sets status → `INVITED`
- [ ] Invite triggers email event (not direct send)

**Deliverable:**
- [ ] HR can create employee
- [ ] Employee record in correct state
- [ ] Audit logs created automatically

**Resist Temptation:** Don't build onboarding forms yet!

---

### STEP 7 — Employee Onboarding Submission (Day 5)

**Goal:** Let employees submit their data

**Tasks:**
- [ ] `POST /employee/onboarding/submit` endpoint
- [ ] Store personal data in JSONB
- [ ] Store education data in JSONB
- [ ] Store work history in JSONB
- [ ] `POST /employee/documents/upload` for files
- [ ] Use database transactions (atomic)

**Rules:**
- [ ] Employee auth required
- [ ] Only in `INVITED` state
- [ ] All-or-nothing submission

**Deliverable:**
- [ ] Employee submits form data
- [ ] Status → `ONBOARDING_SUBMITTED`
- [ ] Documents stored in S3
- [ ] Audit logs written

**Bug Check:** If partial saves happen = BUG

---

### STEP 8 — HR Verification Flow (Day 6)

**Goal:** HR reviews and approves submissions

**Tasks:**
- [ ] `POST /hr/onboarding/:id/verify` endpoint
- [ ] `POST /hr/onboarding/:id/reject` endpoint (optional)
- [ ] Create immutable snapshot of verified data

**Rules:**
- [ ] HR role required
- [ ] Only from `ONBOARDING_SUBMITTED` state
- [ ] Store verification timestamp

**Deliverable:**
- [ ] Status → `HR_VERIFIED`
- [ ] Employee can't change data after this

---

### STEP 9 — Agreement Generation (Day 7)

**Goal:** Generate offer and appointment letter PDFs

**Tasks:**
- [ ] Install PDF generation library (`pdf-lib`)
- [ ] Create PDF templates
- [ ] Calculate SHA-256 checksums
- [ ] `POST /hr/onboarding/:id/send-agreement` endpoint
- [ ] Store PDFs in S3

**Rules:**
- [ ] PDFs generated only once
- [ ] Checksum stored before UIDAI

**Deliverable:**
- [ ] Status → `AGREEMENT_SENT`
- [ ] PDFs exist in S3
- [ ] Agreement row created in DB
- [ ] Checksums stored

**Note:** No signing yet, just preparation!

---

### STEP 10 — UIDAI eSign Integration (Day 8-9)

**Goal:** Enable legal digital signatures

**⚠️ MOST CRITICAL STEP**

**Tasks:**
- [ ] Create employee redirect endpoint
- [ ] Create webhook endpoint `POST /webhooks/esign/uidai`
- [ ] Verify UIDAI signature in webhook
- [ ] Match document checksum
- [ ] Store signed PDF in immutable bucket
- [ ] Update status → `SIGNED`
- [ ] Lock all employee data

**Rules:**
- [ ] Webhook is source of truth (not frontend redirect)
- [ ] Verify signature authenticity
- [ ] Handle failures gracefully

**Deliverable:**
- [ ] Frontend redirect does nothing important
- [ ] Webhook alone finalizes signing
- [ ] Signed docs are immutable

**Blocker Alert:** If frontend can fake signing = SYSTEM BROKEN

---

### STEP 11 — Data Locking & Immutability (Day 9)

**Goal:** Make signed data unchangeable

**Tasks:**
- [ ] Add application-level guards for `SIGNED` status
- [ ] Configure S3 bucket as write-once for signed docs
- [ ] Test that updates fail loudly after signing
- [ ] Add error messages for attempted modifications

**Deliverable:**
- [ ] Any attempt to modify signed data fails with clear error
- [ ] S3 bucket policy prevents overwrites

**Why Critical:** Legal safety, not "nice to have"

---

### STEP 12 — Notifications & Cron (Day 10)

**Goal:** Automate communications

**Tasks:**
- [ ] Set up event-driven email system
- [ ] Create email templates (invite, reminder, agreement)
- [ ] Build daily cron job for reminders
- [ ] Check `INVITED` status > 48 hours
- [ ] Stop reminders after submission
- [ ] Make jobs idempotent

**Rules:**
- [ ] No email sending in controllers
- [ ] Use queue system (Bull/BullMQ)

**Deliverable:**
- [ ] Invites sent automatically
- [ ] Reminders sent after 48h
- [ ] Emails stop after submission

---

### STEP 13 — Frontend (Day 11-14)

**Goal:** Build user interfaces

**⚠️ Build frontend LAST, not first**

**Employee Portal:**
- [ ] Multi-step form wizard
- [ ] Personal info form
- [ ] Education history form
- [ ] Work history form
- [ ] Document upload interface
- [ ] Agreement viewing page
- [ ] UIDAI redirect button

**HR Dashboard:**
- [ ] Employee list with status filters
- [ ] Submission review page
- [ ] Verify/Reject actions
- [ ] Agreement sending interface
- [ ] Audit log viewer

**Rules:**
- [ ] Frontend NEVER controls state logic
- [ ] All state changes via API only
- [ ] Display loading states properly

---

### STEP 14 — Production Hardening (Day 15-16)

**Goal:** Make it production-ready

**Security:**
- [ ] Add rate limiting (express-rate-limit)
- [ ] Rotate secrets and API keys
- [ ] Mask PII in logs
- [ ] Enable HTTPS only
- [ ] Add CORS properly

**Reliability:**
- [ ] Set up automated DB backups
- [ ] Implement webhook retry logic
- [ ] Create dead letter queue for failures
- [ ] Add health check monitoring
- [ ] Set up error alerting (Sentry/similar)

**Testing:**
- [ ] Integration tests for critical paths
- [ ] Load testing for concurrent submissions
- [ ] Dry runs with HR team

**Deliverable:**
- [ ] System passes security review
- [ ] DR plan documented
- [ ] Monitoring dashboards live

---

## 📁 Suggested Folder Structure

```
hr-onboarding-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── audit-logger.ts
│   │   │   └── error-handler.ts
│   │   ├── modules/
│   │   │   ├── employees/
│   │   │   ├── onboarding/
│   │   │   ├── documents/
│   │   │   ├── agreements/
│   │   │   └── webhooks/
│   │   ├── services/
│   │   │   ├── email.service.ts
│   │   │   ├── pdf.service.ts
│   │   │   ├── s3.service.ts
│   │   │   └── esign.service.ts
│   │   ├── utils/
│   │   │   ├── state-machine.ts
│   │   │   └── validators.ts
│   │   └── app.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── tests/
├── frontend/
│   ├── app/
│   │   ├── hr/
│   │   └── employee/
│   └── components/
├── RULES.md
├── ROADMAP.md
└── README.md
```

---

## 🎯 Success Metrics

**Week 1 (Steps 0-5):**
- [ ] Database schema deployed
- [ ] State machine working
- [ ] Auth functional
- [ ] Audit logs capturing everything

**Week 2 (Steps 6-11):**
- [ ] HR can create & invite employees
- [ ] Employees can submit data
- [ ] HR can verify submissions
- [ ] UIDAI integration working
- [ ] Data locked after signing

**Week 3 (Steps 12-14):**
- [ ] Emails sending automatically
- [ ] Frontend fully functional
- [ ] Production hardening complete
- [ ] Team trained on system

---

## 🔄 Next Steps After MVP

**Phase 2 Enhancements:**
- [ ] Advanced reporting dashboard
- [ ] Bulk employee import
- [ ] Custom agreement templates
- [ ] Slack/Teams webhooks
- [ ] Mobile app
- [ ] Role-based permissions (beyond HR/Employee)

**Phase 3 Scale:**
- [ ] Multi-tenant support
- [ ] API for integrations
- [ ] Advanced analytics
- [ ] Document OCR validation

---

