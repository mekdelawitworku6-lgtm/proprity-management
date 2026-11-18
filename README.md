# Proprity Mangment — Property Management Platform (Ethiopia)

A rental/property management platform for the Ethiopian market: digital tenancy agreements,
rent invoicing, multi-channel rent collection, prepaid-rent handling, owner payouts,
maintenance/complaint workflows, and a national admin oversight layer.

| Folder | What it is | Stack |
|---|---|---|
| `src/` | Web app (owner + admin portals) | React 19, TypeScript, Vite, Tailwind, Redux Toolkit + RTK Query |
| `backend/` | REST API + realtime + schedulers (own git repo, own `AGENTS.md`) | NestJS, Prisma, PostgreSQL, Socket.IO, Docker Compose |

**Contents:** [1 Overview](#1-overview) · [2 Roles](#2-roles) · [3 Business Flow](#3-business-flow) ·
[4 Domain Model](#4-domain-model) · [5 Prepaid Rent](#5-prepaid-rent) ·
[6 Running It](#6-running-it) · [7 Test Accounts](#7-test-accounts) · [8 How to Test](#8-how-to-test) ·
[9 Frontend](#9-frontend) · [10 Backend](#10-backend) · [11 Database](#11-database) ·
[12 API Reference](#12-api-reference) · [13 Schedulers](#13-schedulers) ·
[14 Testing Strategy](#14-testing-strategy) · [15 Recent Changes](#15-recent-changes) ·
[16 Limitations](#16-known-limitations) · [17 Troubleshooting](#17-troubleshooting)

---

## 1. Overview

### 1.1 What it does

Owners register properties and units, publish them to the market, and approve tenant rental
requests. Approved requests become **digital tenancy agreements** — the full contract text is
stored with a SHA-256 hash, so any later alteration is detectable. Signing automatically
generates **invoices** (security deposit + monthly rent). Tenants pay by **Telebirr** or
**bank transfer**; owners record **cash/bank** payments directly. Every payment auto-allocates
across invoices, so **overpayment becomes prepaid rent** rather than lost money, and owners are
notified when prepaid coverage is about to run out. Collected funds roll up into monthly
**payout batches** to owners. Maintenance issues become **complaints** → **work orders** →
**vendors**, and anything the owner can't settle can be **escalated** to the platform admin for
a formal ruling. Every state change is written to an **append-only audit log**.

### 1.2 Design principles

1. **Nothing is fabricated.** The UI has no mock data and no client-side business store. Every
   number on screen came from the database. An empty page means the database is empty.
2. **Money is never lost.** Partial payments, overpayments, and prepayments are all first-class
   and traceable down to which month each birr covered.
3. **Agreements are tamper-evident.** Content hashing + signatures + an integrity re-check.
4. **Least privilege.** Roles gate every route; managers get per-feature grants from their owner.
5. **Every action is auditable.** Payments, signatures, disputes, and account changes are logged.

### 1.3 Architecture

```
┌─────────────────────────────────────────────┐
│  Browser (React + Vite, port 5173)          │
│  Owner portal + Admin portal                 │
│  RTK Query ──► HTTP/JSON ──┐                 │
└────────────────────────────┼─────────────────┘
                             │  JWT Bearer
┌────────────────────────────▼─────────────────┐
│  NestJS API (port 4100, prefix /api/v1)      │
│  ┌────────────────────────────────────────┐  │
│  │ JWT guard ─► Roles guard ─► Transform  │  │
│  │ interceptor (wraps data in an envelope)│  │
│  └───┬────────────┬────────────┬──────────┘  │
│      │            │            │             │
│  Modules:  property · leasing · billing      │
│            maintenance · admin · reporting  │
│            core-services · integrations     │
│      │                                     │
│  ┌───▼──────┐  ┌──────────┐  ┌───────────┐ │
│  │ Prisma   │  │Scheduler │  │ Socket.IO │ │
│  └────┬─────┘  └────┬─────┘  └───────────┘ │
└───────┼─────────────┼───────────────────────┘
        │             │
┌───────▼─────────────▼───────────────────────┐
│  PostgreSQL (port 5434)                      │
└─────────────────────────────────────────────┘
```

All API responses are wrapped by a global interceptor:

```json
{ "statusCode": 200, "success": true, "message": "Retrieved successfully",
  "data": { }, "timestamp": "2026-10-01T17:06:19.821Z" }
```

The frontend's `unwrapEnvelope` helper unwraps `data` so components work with plain objects.

---

## 2. Roles

| Role | Description | Key capabilities |
|---|---|---|
| **ADMIN** | Possible Technology platform staff | Approve/reject/suspend any account, manage every owner's staff, national registries, dispute rulings |
| **TELECOM** | Ethio Telecom payment-layer staff | Confirm payments from the settlement side, reconciliation |
| **OWNER** | Property owner | Register properties/units, publish listings, accept rental requests, sign agreements, record offline payments, view payouts, add staff, manage vendors |
| **MANAGER** | Acts for an owner | Everything an owner can do, but only within the permissions the owner granted (14 granular grants) |
| **TENANT** | Renter | Browse listings, request a rental, sign the agreement digitally, pay rent, file complaints |

**Manager permissions** (per-feature, assigned by the owner):
`PROPERTY_VIEW`, `PROPERTY_MANAGE`, `UNIT_MANAGE`, `TENANT_VIEW`, `TENANT_MANAGE`,
`AGREEMENT_VIEW`, `AGREEMENT_MANAGE`, `COMPLAINT_VIEW`, `COMPLAINT_MANAGE`, `PAYMENT_VIEW`,
`PAYMENT_RECORD`, `VENDOR_VIEW`, `VENDOR_MANAGE`, `REPORT_VIEW`

**Onboarding:** a new account starts `PENDING`. Tenants are self-registered; owners must be
approved by an admin before they can transact. Suspended accounts are signed out and blocked.

---

## 3. Business Flow

### 3.1 The main chain

```
Owner registers property
   └─▶ adds Units (each with rent + deposit)
        └─▶ publishes Listing(s) to market
             └─▶ Tenant requests rental        (RentalRequest: PENDING)
                  └─▶ Owner accepts             (RentalRequest: ACCEPTED, unit → RESERVED)
                       └─▶ Agreement generated   (PENDING_SIGNATURE)
                            └─▶ Tenant signs     (ACTIVE, unit → OCCUPIED)
                                 └─▶ Invoices auto-created
                                      ├─ DEPOSIT invoice
                                      └─ RENT invoices, one per month
                                           └─▶ Tenant pays  ─┐
                                               (Telebirr /      │
                                                bank transfer)  │
                                               Owner records ───┤
                                                (cash / bank)    │
                                                                  ▼
                                                     Payment auto-allocates
                                                     across invoices
                                                                  │
                                                                  ▼
                                                       Invoices → PAID
                                                                  │
                                                                  ▼
                                                   Monthly payout batch
                                                   → Owner receives money
```

### 3.2 Maintenance & disputes (parallel flow)

```
Tenant files Complaint ──▶ Owner replies / changes status ──▶ assign Vendor
                                                                     │
                                                                     ▼
                                                              WorkOrder ──▶ COMPLETED
                                        │
                     (if owner cannot settle)
                                        ▼
                              Owner escalates to Admin
                                        │
                                        ▼
                              Admin issues formal ruling  ──▶ both parties notified
```

### 3.3 Reminders and lifecycle (automatic)

| Trigger | What happens |
|---|---|
| 01:00 daily | Agreements past `endDate` flip to `EXPIRED` |
| 06:00 daily | Rent invoices due in the next 7 days are generated |
| 06:00 daily | Invoices past `dueDate` and unpaid flip to `OVERDUE` |
| 06:00 daily | Overdue reminders sent to tenants (deduplicated per interval) |
| 06:00 daily | Upcoming-due reminders sent to tenants |
| 06:00 daily | **Prepaid-expiry notices at 30/10/5/3/2/1 days before coverage ends** |
| 1st of month, 00:00 | Payout batch generated from confirmed payments |

---

## 4. Domain Model

| Concept | Meaning |
|---|---|
| **Property** | A building owned by one owner. Has city/sub-city/woreda, address, coordinates, amenities, photos, and a type |
| **Unit** | A rentable part of a property (apartment, studio, villa, room, office, shop, warehouse). Own rent, deposit, bedrooms, size, and a status |
| **Listing** | A unit published to the market with a price and description, discoverable via location filters |
| **RentalRequest** | A tenant's application for a unit. Owner accepts or rejects |
| **Agreement** | The generated contract. Stores full `content`, `contentHash` (SHA-256), both signature timestamps, and a `signatureHash`. Verifiable anytime |
| **Invoice** | An amount owed for a period — `RENT`, `DEPOSIT`, `PENALTY`, or `OTHER` — with a `dueDate` and running `amountPaid` |
| **Payment** | Money received. `TELEBIRR`, `BANK_TRANSFER`, or `CASH`; `PENDING` until confirmed |
| **PaymentAllocation** | Which invoice a payment settled, for how much, covering which period. This is what makes prepayments auditable |
| **Payout** | The batch that moves collected rent from platform to owner |
| **Expense** | An owner-side cost (maintenance, utilities, tax, insurance, management) that nets against payouts |
| **Complaint** | A maintenance, noise, safety, payment, or dispute issue. Threaded with responses, can be escalated, ruled on by an admin |
| **WorkOrder** | The job created to resolve a complaint, optionally assigned to a vendor |
| **Vendor** | A service provider (plumbing, electrical, carpentry, cleaning, security, …) |
| **Notification** | An in-app record, optionally delivered by SMS and Telegram |
| **AuditLog** | Append-only trail of every important action |

---

## 5. Prepaid Rent

The most substantial recent feature. Fully documented here because it involves both backend
logic and a database model.

### 5.1 The problem

A tenant pays for three months at once. Invoices are per-month, so a naive implementation would
either reject the payment ("amount exceeds balance") or dump the surplus somewhere untracked.

### 5.2 The rules

1. **Target invoice first.** The payment settles the invoice it was booked against first, in
   full or in part.
2. **Surplus rolls forward.** Remaining money is applied to the same agreement's later unpaid
   `RENT` invoices, **oldest period first**.
3. **Every settlement is recorded.** Each invoice settled gets a `PaymentAllocation` row with
   the amount and the period it covered — so history shows exactly which months a payment paid.
4. **Leftover becomes credit.** Anything still unallocated is stored as `creditAmount` on the
   payment. It is never silently dropped.
5. **A ceiling prevents fat fingers.** A payment may cover this invoice plus everything still
   owed later on the agreement — and not a birr more. Over that, the API returns
   *"Amount exceeds what is owed on this agreement. The maximum is N ETB."*
6. **Partial payments are allowed.** Paying 5,000 against an 18,000 invoice is valid and simply
   leaves the invoice `PARTIALLY_PAID`.
7. **Prepayment is labelled.** On confirmation the payment records `prepaidMonths` (periods
   covered), `creditAmount` (leftover), and `prepaidThrough` (when coverage runs out).
8. **Future invoices are generated on demand.** Starting a payment creates the active
   agreement's remaining rent invoices, so a 6/12-month prepayment works immediately.

### 5.3 Worked example

Agreement rent: **18,000 ETB/month**. The tenant pays **45,000** in one go.

| Step | Invoice | Outstanding | Allocated | Result |
|---|---|---|---|---|
| 1 | October rent (INV-…A) | 18,000 | 18,000 | `PAID` |
| 2 | November rent (INV-…B) | 18,000 | 18,000 | `PAID` |
| 3 | December rent (INV-…C) | 18,000 | 9,000 | `PARTIALLY_PAID` |

Result: `prepaidMonths = 2` (October and November fully cleared), `creditAmount = 0`,
`prepaidThrough = 30 November`. Three `PaymentAllocation` rows are written. The owner is
notified immediately, and again on 30, 10, 5, 3, 2, and 1 November.

### 5.4 Owner notifications

| Notification | When | Contains |
|---|---|---|
| `RENT_PREPAID` | Immediately on confirming a payment that was a prepayment | Amount, months covered, coverage end date |
| `RENT_PREPAID_EXPIRING` | 30, 10, 5, 3, 2, 1 days before `prepaidThrough` | Unit, days remaining, coverage-through date |

Both go to the owner **and their managers**, in-app, plus SMS and Telegram when the user's
channels are configured. Both exist in English and Amharic.

The expiry check runs in the daily scheduler. It is **deduplicated per agreement per day**, so
a manual re-trigger or an overlapping scheduler run will not spam the owner. Coverage is
tracked per agreement using the **furthest** `prepaidThrough` among its confirmed payments.

---

## 6. Running It

### 6.1 Prerequisites

- Node.js 20+ and npm — **frontend only**
- Docker with Docker Compose — **required for the backend**

> Never run `npm`, `npx`, `nest`, or `prisma` on the host for backend work. Everything goes
> through Docker. See `backend/AGENTS.md`.

### 6.2 Backend

```bash
cd backend
docker compose up -d --build      # build, migrate automatically, then seed
docker compose logs -f backend    # follow startup
```

| Service | Address |
|---|---|
| API base | http://localhost:4100/api/v1 |
| Swagger | http://localhost:4100/api/docs |
| Health | http://localhost:4100/health |
| PostgreSQL | localhost:5434 — user `postgres`, pass `postgres`, db `property_management` |
| Realtime | Socket.IO namespace `/realtime`, connect with `auth: { token: <accessToken> }` |

Maintenance commands:

```bash
docker compose run --rm tools npx prisma migrate dev --name <change>   # after editing schema.prisma
docker compose run --rm tools npx prisma generate                      # regenerate the client
docker compose run --rm seed                                          # re-run the idempotent seed
docker compose build backend                                           # rebuild the API image
docker compose up -d --build backend                                   # rebuild + restart the API
docker compose down -v                                                # full reset, deletes the DB volume
```

> **Gotcha:** the `seed` service has no build context of its own — it runs
> `node dist/database/seeds/seed.js` from the `property-management-backend` image. After
> editing the seed you must `docker compose build backend` before `docker compose run --rm seed`.

### 6.3 Frontend

```bash
npm install     # first time only
npm run dev     # → http://localhost:5173/
```

The frontend reads `VITE_API_URL=http://localhost:4100/api/v1` from `.env`. It must be set
before starting or every API call fails.

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server with HMR on port 5173 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | oxlint |
| `npx tsc -b` | Typecheck |

---

## 7. Test Accounts

Created by the idempotent seed. **Password for all: `Demo@12345`**

| Role | Phone | Email |
|---|---|---|
| Admin (Possible Technology) | +251911000001 | admin@possibletech.et |
| Ethio Telecom (payments) | +251911000002 | payments@ethiotelecom.et |
| Owner | +251911000003 | owner@demo.et |
| Manager (of the owner) | +251911000004 | manager@demo.et |
| Tenant | +251911000005 | tenant@demo.et |

Login accepts **either** the phone number or the email as `identifier`. Note the login form
trims whitespace from both fields — a trailing space previously caused a silent 401.

**What the seed also creates:**

- Property **Bole Heights Apartments** — Addis Ababa, Bole, near Edna Mall
- 4 units: `A-101` (2BR, 18,000/mo), `A-102` (3BR, 26,000/mo), `A-201` (studio, 11,000/mo), `S-01` (shop, 30,000/mo)
- **One active, fully signed agreement** for `A-101` between the seeded owner and tenant,
  starting on the 1st of the current month for 12 months, with its deposit + rent invoices
  generated through the same builders the real signing flow uses
- Vendor: Kality Plumbing Services

So payment history, prepayment, allocation, and reminders can all be exercised immediately
with no manual setup.

---

## 8. How to Test

### 8.1 Smoke test the stack

```bash
# 1. backend
cd backend && docker compose up -d --build
curl http://localhost:4100/health
#    expect: {"statusCode":200,...,"data":{"status":"ok","database":"up",...}}

# 2. frontend (separate terminal, repo root)
npm run dev
#    open http://localhost:5173/
```

### 8.2 As the Owner — `owner@demo.et` / `Demo@12345`

| Route | What to check |
|---|---|
| `/owner/dashboard` | Real metrics from `GET /dashboard/owner` |
| `/owner/payments` | Real rent history from `GET /payments`. Filter by status, method, and date range. Totals come from the server. **No invented `TXN-` rows** |
| `/owner/agreements` | The seeded agreement. Click **View Agreement** → signed text, SHA-256 hash, green **Integrity Verified** panel, both signature timestamps |
| `/owner/properties` | Bole Heights Apartments and its 4 units with occupancy status |
| `/owner/tenants` | Current tenants on your units |
| `/owner/complaints` | Complaints raised against your units; reply and change status |
| `/owner/staff` | Add a manager and grant per-feature permissions |
| `/owner/activity` | Your owner's audit trail |

### 8.3 As the Admin — `admin@possibletech.et` / `Demo@12345`

| Route | What to check |
|---|---|
| `/admin/dashboard` | Platform metrics, payment reconciliation, live compliance flags, occupancy bar, agreement pipeline, payout readiness. Pick a different reporting month with the month input |
| `/admin/owners` | Approve or reject pending owner registrations |
| `/admin/tenants` | All tenant accounts. **Suspend** prompts for a reason and calls the real API; **Restore** reactivates. Shows real agreement counts per tenant |
| `/admin/agreements` | The national registry — every agreement, not just yours |
| `/admin/disputes` | Escalated complaints. **Issue ruling** → write a resolution, pick `RESOLVED` or `CLOSED`, submit. Both parties are notified |
| `/admin/payments` | Platform-wide payment history with confirmed volume and prepayment badges |
| `/admin/staff` | Manage every owner's staff across the whole platform |
| `/admin/audit` | The append-only audit trail. Filter by entity type, page through history. Read-only events are hidden by default |

### 8.4 Testing prepaid rent end to end

```bash
# 1. get an access token
curl -s -X POST http://localhost:4100/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"owner@demo.et","password":"Demo@12345"}'
# copy data.accessToken

# 2. find the current unpaid rent invoice
curl -s http://localhost:4100/api/v1/invoices?status=UNPAID \
  -H "Authorization: Bearer $TOKEN"
# note an invoice id and its `amount`
```

Then record an offline payment for **more** than that amount (two months' rent). The remaining
rent invoices for the agreement are generated automatically when the payment is accepted:

```bash
curl -s -X POST http://localhost:4100/api/v1/payments/offline \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"invoiceId":"<INVOICE_ID>","amount":36000,"method":"CASH","notes":"two months prepaid"}'
```

Verify:

1. **Allocation** — the current invoice is `PAID`; the next month's invoice is also `PAID`;
   two `PaymentAllocation` rows exist. Check `GET /invoices` and the agreement schedule
   (`GET /agreements/:id/schedule`).
2. **Payment record** — `GET /payments` shows the row flagged as prepaid with
   `prepaidMonths`, `creditAmount`, `prepaidThrough`, and an expandable list of allocations.
3. **Immediate notification** — the owner has a `RENT_PREPAID` notification
   (`GET /notifications`).
4. **Ceiling enforced** — try `amount: 999999` and confirm the API rejects it with the maximum
   it will accept.
5. **Partial still works** — record a payment for half the balance and confirm the invoice
   becomes `PARTIALLY_PAID` rather than erroring.

To test the **expiry notices** without waiting a month, set a confirmed payment's
`prepaidThrough` to 30 (or 10/5/3/2/1) days ahead in the database, then trigger
`InvoicesService.sendPrepaidExpiryNotices()` from the `tools` container and check
`GET /notifications` for `RENT_PREPAID_EXPIRING`.

### 8.5 Testing agreement integrity

Open any agreement's detail view. The panel hashes the stored `content` and compares it to the
stored `contentHash`. Green **Integrity Verified** means the text is unchanged. Manually edit
`content` in the database and reload — the panel turns red with **Integrity Check Failed** and
reports the reason. That is the tamper-evidence feature working.

---

## 9. Frontend

### 9.1 Structure

```
src/
  api/                     token store, refresh / re-auth handling
  components/
    agreements/            AgreementList + detail dialog (shared by owner & admin)
    payments/              paymentDisplay.ts — money, date, status formatting helpers
    modals/                AddStaffModal, CreateComplaintModal, EditPropertyModal
    layouts/               OwnerLayout, AdminLayout, shared chrome
  pages/
    Login.tsx  RegisterOwner.tsx
    owner/                 dashboard, properties, tenants, agreements, complaints,
                           payments, staff, activity, settings
    admin/                 dashboard, owners, tenants, agreements, disputes, payments,
                           staff, audit
  store/
    api.ts                 RTK Query base, auth header injection, 401 re-auth
    propertyApi.ts         properties, agreements, complaints, payments, audit, dashboards
    adminApi.ts            user approval/suspension, notifications, platform staff
    authSlice.ts           session state, login/logout, token persistence
    hooks.ts               typed useAppDispatch / useAppSelector / useAuth
    index.ts               store wiring, session-expiry reset
  types/api.ts             all API response types — single source of truth
  utils/                   logger and helpers
```

### 9.2 Data flow convention

**No mock data. No client-side business store.** Every screen reads through RTK Query hooks
that hit the REST API; every mutation invalidates the relevant cache tags. Types for all
endpoints live in `src/types/api.ts`.

Removed in the cleanup, because every consumer now uses the real API:

| Deleted | Replaced by |
|---|---|
| `src/data/mockData.ts` | `GET /payments`, `/agreements`, `/admin/users`, `/admin/audit-logs`, `/admin/dashboard` |
| `src/store/platformSlice.ts` | RTK Query cache |
| `usePlatform()` hook | per-page RTK Query hooks |
| `src/types/index.ts` (mock types) | `src/types/api.ts` |
| `AddTenantModal.tsx`, `CreateMaintenanceModal.tsx` (unused, hardcoded buildings) | dead code, removed |

### 9.3 Shared components worth knowing

- **`AgreementList`** — the agreement card grid, status tabs, search, and the detail dialog,
  used identically by the owner and admin portals. The dialog fetches the full signed text and
  renders the integrity verdict.
- **`paymentDisplay.ts`** — `formatMoney`, `formatDate`, and the payment/invoice/prepayment
  status → colour mappings, so status colours are consistent across pages.

---

## 10. Backend

### 10.1 Structure

```
backend/apps/backend/
  prisma/
    schema.prisma            data model
    migrations/              versioned SQL migrations
  src/
    common/                  guards, decorators, interceptors, filters,
                             i18n (EN/AM), audit, utils
    database/                PrismaService, idempotent seed
    modules/
      admin/                 owner approval, suspension, KYC, platform staff
      billing/               invoices, payments, payouts, expenses
      core-services/         auth, users, notifications, realtime, files,
                             health, sync, scheduler
      integrations/          telebirr, sms, telegram
      leasing/               rental-requests, agreements
      maintenance/           complaints, vendors, work-orders
      property/              properties, units, listings
      reporting/             dashboard, reports (Excel/PDF)
  test/
    modules/                 e2e suite per module
    e2e-helpers.ts           shared fixtures
```

### 10.2 Conventions

- Controllers return plain data; the global `TransformInterceptor` wraps it in the envelope
  described in §1.3.
- Every route requires a JWT unless marked `@Public()`. Access is narrowed with `@Roles(...)`.
- Owner-side scoping goes through `resolveOwnerId` / `scopeWhere`
  (`common/utils/owner-scope.util.ts`) so managers transparently act for their owner.
- Every transaction, agreement, and complaint action is written with `AuditService.log(...)`.
- Integrations default to mock mode (`TELEBIRR_MOCK=true`, `SMS_MOCK=true`) so the stack runs
  with no third-party credentials.
- Query DTOs extend a shared `PaginationDto`; responses use a consistent
  `{ docs, total, page, totalPages }` envelope.

### 10.3 Key services

| Service | Responsibility |
|---|---|
| `InvoicesService` | Generate, cancel, apply payments to, and remind about invoices. Owns the reminder and prepaid-expiry jobs |
| `PaymentsService` | Resolve payable amounts, enforce the prepayment ceiling, allocate payments across invoices, confirm/reject, expose history |
| `AgreementsService` | Generate contract text, hash it, sign, renew, terminate, verify integrity |
| `PayoutsService` | Build and settle monthly owner payouts |
| `ComplaintsService` | File, respond, change status, escalate, admin-resolve |
| `NotificationsService` | Create notifications and fan out to in-app / SMS / Telegram |
| `SchedulerService` | The three cron jobs (§13) |
| `AuditService` | Append-only event log |

---

## 11. Database

PostgreSQL via Prisma. All IDs are UUIDs. Money is `Decimal(12,2)` — never a float.

### 11.1 Models

| Model | Purpose | Notable fields |
|---|---|---|
| `User` | Every account | `role`, `phoneNumber` (unique), `email` (unique), `passwordHash`, `approvalStatus`, `isSuspended`, `permissions[]`, `employerId` (owner for managers) |
| `OwnerProfile` | Owner extras | `companyName`, `payoutMethod`, `telebirrNumber` |
| `TenantProfile` | Tenant extras | emergency contact name, phone, relation |
| `OtpCode` | Phone verification / password reset | `purpose`, `codeHash`, expiry, attempts |
| `Property` | A building | `type`, `city`, `subCity`, `woreda`, `address`, lat/long, `amenities[]`, `photos[]` |
| `Unit` | A rentable unit | `unitNumber` (unique per property), `type`, `status`, `rentAmount`, `depositAmount`, bedrooms/bathrooms, `sizeSqm` |
| `RentalRequest` | A tenant's application | `status`, `message` |
| `Agreement` | The tenancy contract | `referenceNo` (unique), `content`, `contentHash`, `signatureHash`, `ownerSignedAt`, `tenantSignedAt`, `tenantSignatureIp`, `status`, `renewedFromId` |
| `Invoice` | An amount owed | `invoiceNo`, `type`, `periodStart`/`periodEnd`, `dueDate`, `amount`, `amountPaid`, `status`, `lastReminderAt` |
| `Payment` | Money received | `method`, `status`, `providerReference`, `confirmedBy`, `confirmationSource`, **`prepaidMonths`**, **`creditAmount`**, **`prepaidThrough`** |
| `PaymentAllocation` | Which invoice a payment settled | `paymentId`, `invoiceId`, `amount`, `periodEnd`. Unique on `(paymentId, invoiceId)` |
| `Payout` | Owner disbursement batch | `periodStart`/`periodEnd`, `grossAmount`, `deductions`, `netAmount`, `status` |
| `Expense` | Owner-side cost | `category`, `amount` — nets against payouts |
| `Complaint` | An issue | `referenceNo`, `category`, `priority`, `status`, `escalationStatus`, `escalationReason`, `adminResolution`, `photos[]` |
| `ComplaintResponse` | Thread entry | `message`, `authorId`, `attachments[]` |
| `Vendor` | Service provider | `serviceType`, phone, rating |
| `WorkOrder` | The resolution job | `status`, `vendorId`, `scheduledFor`, `completedAt`, `cost` |
| `Notification` | A user-facing message | `type` (a message key), `title`, `body`, `channels[]`, `readAt`, `data` (JSON) |
| `AuditLog` | Append-only trail | `action`, `entityType`, `entityId`, `actorId`, `actorRole`, `ipAddress`, `metadata` (JSON) |

### 11.2 Enums

| Enum | Values |
|---|---|
| `UserRole` | `ADMIN`, `TELECOM`, `OWNER`, `MANAGER`, `TENANT` |
| `ApprovalStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `ManagerPermission` | `PROPERTY_VIEW`, `PROPERTY_MANAGE`, `UNIT_MANAGE`, `TENANT_VIEW`, `TENANT_MANAGE`, `AGREEMENT_VIEW`, `AGREEMENT_MANAGE`, `COMPLAINT_VIEW`, `COMPLAINT_MANAGE`, `PAYMENT_VIEW`, `PAYMENT_RECORD`, `VENDOR_VIEW`, `VENDOR_MANAGE`, `REPORT_VIEW` |
| `Language` | `EN`, `AM` |
| `OtpPurpose` | `VERIFY_PHONE`, `RESET_PASSWORD` |
| `KycStatus` | `NOT_SUBMITTED`, `PENDING`, `VERIFIED`, `REJECTED` |
| `PropertyType` | `RESIDENTIAL`, `COMMERCIAL`, `MIXED_USE` |
| `UnitType` | `APARTMENT`, `STUDIO`, `VILLA`, `ROOM`, `OFFICE`, `SHOP`, `WAREHOUSE`, `OTHER` |
| `UnitStatus` | `VACANT`, `RESERVED`, `OCCUPIED`, `UNDER_MAINTENANCE` |
| `RentalRequestStatus` | `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED` |
| `AgreementStatus` | `PENDING_SIGNATURE`, `ACTIVE`, `EXPIRED`, `TERMINATED`, `RENEWED`, `CANCELLED` |
| `InvoiceType` | `RENT`, `DEPOSIT`, `PENALTY`, `OTHER` |
| `InvoiceStatus` | `UNPAID`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELLED` |
| `PaymentMethod` | `TELEBIRR`, `BANK_TRANSFER`, `CASH` |
| `PaymentStatus` | `PENDING`, `CONFIRMED`, `FAILED`, `REJECTED` |
| `ConfirmationSource` | `TELEBIRR_WEBHOOK`, `ETHIO_TELECOM`, `OWNER`, `ADMIN` |
| `PayoutStatus` | `PENDING`, `PAID` |
| `ComplaintCategory` | `MAINTENANCE`, `NOISE`, `SAFETY`, `PAYMENT`, `DISPUTE`, `OTHER` |
| `Priority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `ComplaintStatus` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `EscalationStatus` | `NONE`, `ESCALATED`, `ADMIN_RESOLVED` |
| `VendorServiceType` | `PLUMBING`, `ELECTRICAL`, `CARPENTRY`, `PAINTING`, `CLEANING`, `SECURITY`, `GENERAL`, `OTHER` |
| `WorkOrderStatus` | `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `ExpenseCategory` | `MAINTENANCE`, `UTILITIES`, `TAX`, `INSURANCE`, `MANAGEMENT`, `OTHER` |

### 11.3 Migration history

| Migration | Change |
|---|---|
| `20261001163932_add_prepaid_rent_tracking` | Added `PaymentAllocation`; added `prepaidMonths`, `creditAmount`, `prepaidThrough` to `Payment` |

```bash
docker compose run --rm tools npx prisma migrate dev --name <change>
docker compose run --rm tools npx prisma generate
docker compose down -v && docker compose up -d --build    # to reset and re-apply from scratch
```

---

## 12. API Reference

Base URL: `http://localhost:4100/api/v1`. All responses use the envelope in §1.3.
Authenticated routes need `Authorization: Bearer <accessToken>`.

### Auth — `/auth`

| Method | Path | Who | Notes |
|---|---|---|---|
| POST | `/auth/register` | public | Register a tenant or an owner |
| POST | `/auth/login` | public | `{ identifier, password }` — identifier is phone **or** email |
| POST | `/auth/refresh` | public | Rotate the access token |
| POST | `/auth/logout` | any | Invalidate the refresh token |
| GET | `/auth/me` | any | Current user profile |
| POST | `/auth/otp/send` | any | Send a phone OTP |
| POST | `/auth/otp/verify-phone` | any | Verify the OTP |
| POST | `/auth/forgot-password` | public | Start a password reset |
| POST | `/auth/reset-password` | public | Finish a password reset |
| POST | `/auth/change-password` | any | Change your own password |

### Profile & team — `/users/me`

| Method | Path | Who |
|---|---|---|
| GET | `/users/me` | any |
| PATCH | `/users/me` | any |
| PATCH | `/users/me/owner-profile` | owner |
| PATCH | `/users/me/tenant-profile` | tenant |
| POST | `/users/me/managers` | owner |
| GET | `/users/me/managers` | owner |
| PATCH | `/users/me/managers/:id/permissions` | owner |
| PATCH | `/users/me/managers/:id/activate` · `/deactivate` | owner |
| POST | `/users/me/tenants` | owner — add a tenant to a unit |
| GET | `/users/me/tenants` · `/tenants/lookup` · `/tenants/:id` | owner |

### Properties, units, listings

| Method | Path | Who |
|---|---|---|
| POST · GET | `/properties` | owner (POST) / scoped (GET) |
| GET · PATCH · DELETE | `/properties/:id` | owner |
| POST · GET | `/properties/:propertyId/units` | owner |
| GET · PATCH · DELETE | `/units/:id` | owner |
| GET | `/listings` · `/listings/locations` | public / tenant |
| GET | `/listings/:unitId` | public |

### Leasing — `/rental-requests`, `/agreements`

| Method | Path | Who | Notes |
|---|---|---|---|
| POST · GET | `/rental-requests` | tenant (POST) / scoped (GET) | |
| GET | `/rental-requests/:id` | scoped | |
| PATCH | `/rental-requests/:id/cancel` | tenant | |
| POST | `/rental-requests/:id/accept` | owner | Reserves the unit, generates the agreement |
| POST | `/rental-requests/:id/reject` | owner | |
| POST · GET | `/agreements` | owner (POST) / all roles (GET) | Admin sees every agreement |
| GET | `/agreements/verify/:referenceNo` | any | Public integrity check by reference |
| GET | `/agreements/:id` | scoped | Full text + integrity verdict |
| POST | `/agreements/:id/sign` | tenant | Digital signature; activates, generates invoices |
| POST | `/agreements/:id/fayda/verify` | tenant | Mock Fayda check; IDs containing `FAIL`, `INVALID` or `NO_MATCH` fail, all others verify |
| POST | `/agreements/:id/renew` · `/terminate` | owner | |
| PATCH | `/agreements/:id/cancel` | owner | |
| POST | `/agreements/:id/documents` | owner | Attach a document |

### Inspections & deposits — `/inspections`, `/deposit-refunds`

| Method | Path | Who | Notes |
|---|---|---|---|
| POST · GET | `/inspections` | owner/manager (POST) · scoped (GET) | Schedule move-in/move-out checks with photo checklist |
| GET | `/inspections/:id` | scoped | Full inspection record |
| POST | `/inspections/:id/complete` | owner/manager | Record checklist results, after photos and notes |
| PATCH | `/inspections/:id/cancel` | owner/manager | Cancel a scheduled inspection |
| POST · GET | `/deposit-refunds` | owner/manager (POST) · scoped (GET) | Prepare refund; deductions need a completed move-out inspection |
| GET | `/deposit-refunds/:id` | scoped | Full refund trail |
| POST | `/deposit-refunds/:id/approve` · `/pay` · `/reject` | owner/manager | Approval → payment workflow with tenant notifications |

### Billing — `/invoices`, `/payments`, `/payouts`, `/expenses`

| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/invoices` | scoped | Filter by status, type, property, tenant, agreement, date range |
| GET | `/invoices/balances` | owner | Per-unit balances |
| GET | `/invoices/:id` | scoped | |
| POST | `/invoices` | owner | Manual invoice |
| PATCH | `/invoices/:id/cancel` | owner | |
| GET | `/agreements/:id/schedule` | scoped | Billing schedule for an agreement |
| POST | `/payments/telebirr` | tenant | Start a Telebirr payment — may exceed the invoice to prepay |
| POST | `/payments/bank-transfer` | tenant | Declare a bank transfer |
| POST | `/payments/offline` | owner · manager | Record cash or bank payment |
| POST | `/payments/telebirr/webhook` | public | Provider callback (signature-checked) |
| GET | `/payments/telebirr/mock-checkout/:referenceNo` | tenant | Mock-mode checkout page |
| GET | `/payments` | scoped | History + `totalConfirmed` |
| GET | `/payments/:id` | scoped | Includes allocations |
| PATCH | `/payments/:id/confirm` | owner · admin · telecom | Confirms → allocates → notifies |
| PATCH | `/payments/:id/reject` | owner · admin · telecom | Reject with a reason |
| POST | `/payments/:id/reconcile` | telecom | Ethio Telecom reconciliation |
| GET | `/payouts/preview` | owner | Next batch, before it runs |
| POST · GET | `/payouts` | owner | Create / list |
| GET | `/payouts/:id` | owner | |
| PATCH | `/payouts/:id/paid` | owner | Mark disbursed |
| POST · GET | `/expenses` | owner | |
| PATCH · DELETE | `/expenses/:id` | owner | |

### Maintenance — `/complaints`, `/work-orders`, `/vendors`

| Method | Path | Who | Notes |
|---|---|---|---|
| POST · GET | `/complaints` | tenant/owner (POST) | Admin's GET returns escalated + past-SLA items |
| GET | `/complaints/:id` | scoped | Full thread + work orders |
| PATCH | `/complaints/:id/status` | tenant/owner | Notifies the tenant by SMS |
| POST | `/complaints/:id/responses` | tenant/owner | Reply on the thread |
| POST | `/complaints/:id/escalate` | owner | Hand to the platform admin, once only |
| POST | `/complaints/:id/admin-resolve` | **admin** | Formal ruling + `RESOLVED`/`CLOSED` |
| POST · GET | `/work-orders` | scoped | |
| GET | `/work-orders/:id` | scoped | |
| PATCH | `/work-orders/:id` | owner | Assign, reschedule, reprice |
| POST | `/work-orders/:id/complete` | owner | |
| PATCH | `/work-orders/:id/cancel` | owner | |
| POST · GET | `/vendors` | owner | |
| GET · PATCH | `/vendors/:id` | owner | |

### Admin — `/admin/users`, `/admin/managers`

| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/admin/users` | admin · telecom | Filter by role, approval status, suspension, search |
| GET | `/admin/users/:id` | admin | |
| PATCH | `/admin/users/:id/approve` · `/reject` | admin | Owner approval |
| PATCH | `/admin/users/:id/suspend` · `/unsuspend` | admin | Requires a reason |
| PATCH | `/admin/users/:id/kyc` | admin | |
| GET · POST | `/admin/managers` | admin | Every owner's staff, platform-wide |
| PATCH | `/admin/managers/:id/permissions` | admin | |
| PATCH | `/admin/managers/:id/activate` · `/deactivate` | admin | |

### Reporting & platform

| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/dashboard/owner` | owner | |
| GET | `/dashboard/tenant` | tenant | |
| GET | `/dashboard/admin` | admin | Powers the admin dashboard; accepts `?month=` |
| GET | `/reports/owner-statement` · `/reports/payments` · `/reports/rent-roll` | owner · admin | Excel/PDF |
| GET | `/reports/agreements` · `/reports/audit-logs` · `/reports/agreement/:id` | owner/admin · admin/telecom · scoped | Excel/PDF (agreement certificate is PDF by default) |
| GET | `/notifications` | any | Paginated, `?unreadOnly=` |
| GET | `/notifications/unread-count` | any | Badge count |
| PATCH | `/notifications/:id/read` · `/notifications/read-all` | any | |
| POST | `/files/upload/:folder` | any | Property, complaint, agreement, receipt, work-order, KYC and inspection photos |
| GET | `/sync` | any | Offline-sync delta feed |
| GET | `/health` | public | Liveness + DB check |

### Realtime

Socket.IO on namespace `/realtime`, authenticating with `auth: { token: <accessToken> }`.
Used for live payment-status changes and notification pushes.

---

## 13. Schedulers

All times `Africa/Addis_Ababa`. Each job is wrapped so one failure never blocks the others.

| When | Method | Work |
|---|---|---|
| 01:00 daily | `dailyLeaseJobs` | Flip agreements past `endDate` to `EXPIRED` |
| 06:00 daily | `dailyBillingJobs` | 1) generate rent invoices coming due (7-day advance window) · 2) mark overdue · 3) overdue reminders · 4) upcoming-due reminders · 5) **prepaid-expiry notices (30/10/5/3/2/1 days)** |
| 1st of month, 00:00 | `monthlyPayouts` | Build the owner payout batch |

---

## 14. Testing Strategy

| Level | Command | Proves |
|---|---|---|
| Frontend typecheck | `npx tsc -b` | No type errors |
| Frontend lint | `npm run lint` | oxlint rules pass |
| Backend unit | `docker compose run --rm tools npm test` | Pure logic, including the allocation algorithm (Prisma mocked) |
| Backend e2e | `docker compose run --rm tools npm run test:e2e` | Each module's flows against a real test database |
| Manual | §8 | Full-stack behaviour with seeded data |

When a module gains a feature, add scenarios to its e2e suite in
`backend/apps/backend/test/modules/`. The suites are the project's proof that features work.

---

## 15. Recent Changes

| Change | Why |
|---|---|
| Mock Fayda verification at agreement completion | Tenants can prove identity through a deterministic provider simulation without a live integration contract |
| Verification status visible on agreement and tenant cards | Owners and admins can see which leases have a verified tenant |
| Move-in/move-out inspection checklists with photo evidence | Document unit condition at handover and checkout instead of relying on memory or chat threads |
| Security-deposit refund workflow with deductions tied to completed move-out inspections | Gives owners a defensible trail and tenants a clear approval/payment status |
| Owner "Inspections & Deposits" workspace | Schedules inspections, completes checklists and drives refund approval/payment from the dashboard |
| Rent invoices generated on demand when a payment starts | 6/12-month prepayment works immediately instead of waiting for the daily scheduler |
| Working Excel/PDF downloads wired to `/reports` | Export buttons no longer show placeholder alerts; a shared auth-aware blob helper triggers real browser downloads |
| Report generators for agreement registry, audit trail and single-agreement certificate | The remaining export buttons now produce real files from the same Excel/PDF renderer |
| Server-side pagination on payments and agreements | Screens request a page and show real `total`/`totalPages` instead of a fixed 50-row window |
| `PaymentAllocation` model + `prepaidMonths` / `creditAmount` / `prepaidThrough` on `Payment` | Make prepayments auditable and enable expiry reminders |
| `allocatePayment()` with oldest-first forward allocation | The core prepayment algorithm |
| `resolvePayable()` allows partial payments, bounded by an agreement-wide ceiling | Prevent fat-fingered overpayments without blocking legitimate part-payments |
| `settleInvoices()` reads through the transaction client | Allocations and invoice updates must see the same state |
| `RENT_PREPAID` / `RENT_PREPAID_EXPIRING` messages in EN + AM | Owner visibility into prepaid coverage |
| `sendPrepaidExpiryNotices()` at 30/10/5/3/2/1 days, deduplicated per agreement per day | The "let the owner know before it expires" requirement, without duplicate spam |
| `sendUpcomingReminders()` now filters on `lastReminderAt` | The old `reminderCount: 0` filter was wrong and matched nothing |
| All mock data, `platformSlice`, `usePlatform()`, and mock types removed | The UI now shows only real database state |
| Dead modals with hardcoded building names deleted | Unused code carrying fabricated data |
| Login trims the password before sending | A trailing space caused 401s with no visible cause |
| Seed creates a signed agreement + invoices | Makes the payment and prepayment flows testable out of the box |

---

## 16. Known Limitations

- **No tenant web UI.** `POST /payments/telebirr` and `/payments/bank-transfer` exist in the
  API, but there is no `pages/tenant`. Tenants are driven through the API today, or an owner
  records the payment as offline.
- **Search is per page.** Text search on payments and agreements filters the current page
  only; status/method filters and paging are handled by the server.
- **Exports are capped.** Agreement-registry and audit-trail downloads return at most 5,000
  rows so a report cannot exhaust server memory.
- **Due-soon invoices are scheduler-driven.** After signing, only invoices due within the
  advance window (default 7 days, `INVOICE_ADVANCE_DAYS`) exist until a payment starts; starting
  a payment generates the active agreement's remaining rent invoices on demand.
- **Prepayment notices are per-agreement.** If an agreement has several prepaid payments,
  reminders use the furthest `prepaidThrough`.
- **Mock integrations.** SMS, Telebirr, and Telegram run in mock mode. Real delivery needs
  credentials and the corresponding `*_MOCK=false`.
- **One repo, two histories.** `backend/` is a separate git repository. Commits are not shared
  across the boundary.

---

## 17. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Login returns 401 with the right password | Trailing whitespace | Fixed — the form trims. If calling the API directly, don't pad the value |
| `ERR_CONNECTION_REFUSED` on every API call | Backend not running | `cd backend && docker compose up -d --build` |
| CORS error in the browser console | API on a different origin | Backend CORS allows `http://localhost:5173`. Confirm the backend is up |
| Page is empty | The database genuinely has no rows | This is honest empty state, not a bug. Check `GET /health` and query the endpoint directly |
| Seed output missing a new field | The seed image is stale — `seed` has no build context | `docker compose build backend` then `docker compose run --rm seed` |
| Prisma errors about a missing column | Migration not applied | `docker compose run --rm tools npx prisma migrate dev --name <change>` |
| "Amount exceeds what is owed on this agreement" | Prepayment ceiling | By design. The ceiling is the invoice balance plus everything later owed on that agreement |
| Prepaid-expiry notification didn't arrive | Not on a 30/10/5/3/2/1 boundary, or already sent today | The marks are exact-day. See §8.4 to force a test |
| `RECORD_VIEWED` rows missing from the audit trail | Intentional | The audit query hides read events by default; pass `includeViews: true` |
| `dist/` shows old fake data | Stale production build | `npm run build` to regenerate, or use `npm run dev` |
