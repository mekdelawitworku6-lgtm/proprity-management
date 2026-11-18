# About Proprity

**Proprity** is a property-rental management platform built for the Ethiopian market. It brings the
whole renting journey into one place — from advertising a vacant unit all the way to the owner
receiving their money at the end of the month.

Think of it as the shared home for three people who normally have to juggle phone calls, paper
receipts, and WhatsApp messages: the **owner** who rents out property, the **tenant** who lives
there, and the **platform admin** who keeps everything fair and legal.

The simple promise: **nothing on the screen is made up.** Every number you see comes from the
database. If a page is empty, it is because there is genuinely nothing there yet.

---

## One app, two dashboards

**It is one app.** There is no separate program for the owner, another for the tenant, and another
for the admin. Everyone signs in to the same Proprity web app with one login. The app looks at who
you are and opens the right workspace for you. Behind the scenes, every screen talks to one shared
API and one shared database, so there is only ever one version of the truth.

### Who it is for

The same single app is built for five kinds of people (the detailed breakdown is in the next
section):

| Who | In one line |
|---|---|
| **Owner** | Owns the property and wants it rented, collected, and paid out. |
| **Manager** | Runs the property on the owner's behalf, with only the permissions the owner grants. |
| **Tenant** | Lives in the unit, signs the contract, pays rent, and reports problems. |
| **Platform Admin** | Oversees the whole country and keeps everything fair and legal. |
| **Telecom staff** | Confirms and reconciles payments from the payment side. |

### How it works

1. You open the one app and log in with your phone number or email.
2. The app checks your role and opens your workspace — owner, admin, or another role.
3. Every number on your screen is fetched live from the shared database. Nothing is invented.
4. What you can see and do is limited by your role (and, for managers, by the exact permissions
   the owner gave them).
5. When you change something — accept a tenant, record a payment, settle a dispute — the same
   shared record updates for everyone concerned, and the action is written to the audit log.

### The two dashboards

The app has **two main dashboards**, and they are the same idea seen from two angles:

| | **Owner dashboard** | **Admin dashboard** |
|---|---|---|
| **Who opens it** | The property owner (and their managers) | The platform admin |
| **What it covers** | Everything about that owner's own properties | Everything about the whole platform, country-wide |
| **What you see** | Properties, units, tenants, agreements, invoices, payments, prepaid rent, complaints, work orders, expenses, payouts, staff, and activity | All owners, tenants, agreements, payments, disputes, compliance flags, occupancy, payout readiness, and the audit trail |
| **Where the data comes from** | The same shared database | The same shared database |

So the two dashboards are not two different products. They show **the same project and the same
kinds of information** — properties, tenants, contracts, money, and problems — just scoped
differently: the owner sees their own portfolio, the admin sees everybody's. Both are fed by the
same API, the same database, and the same features described in this document.

---

## Who it is for

| Who | What they get |
|---|---|
| **Owner** | Advertise units, approve tenants, sign contracts, collect rent, pay staff, track expenses, and get paid. |
| **Manager** | Helps an owner run things, but only with the exact permissions the owner hands them. |
| **Tenant** | Find a place, sign the contract digitally, pay rent, and report problems. |
| **Platform Admin** | Approve owners, oversee the whole country, settle disputes, and keep an audit trail. |
| **Telecom staff** | Confirm and reconcile payments from the payment side. |

---

## The features, in plain language

### For owners

- **Register properties and units.** Add a building, then add the units inside it — apartments,
  studios, villas, rooms, offices, shops, or warehouses. Each unit carries its own rent, deposit,
  size, and status (vacant, reserved, occupied, under maintenance).
- **Publish listings.** Put a unit on the market with a price and description, and let tenants find
  it by location.
- **Approve rental requests.** A tenant asks for a unit, and the owner says yes or no. Saying yes
  reserves the unit so nobody else can take it.
- **Digital, tamper-proof agreements.** When a request is accepted, the contract is generated
  automatically. The full text is fingerprinted with a SHA-256 hash, so if anyone changes even one
  letter later, the system can prove it. Owners and admins can verify the contract's integrity at
  any time with a green "Integrity Verified" badge.
- **Automatic invoices.** The moment a tenant signs, the security deposit and monthly rent invoices
  are created for them. No typing, no forgetting.
- **Record payments.** Rent can arrive by Telebirr, bank transfer, or cash. Owners can record an
  offline cash or bank payment directly, and the system handles the bookkeeping.
- **Rent that never gets lost.** If a tenant pays more than one month at once, the extra is not
  thrown away and not rejected. It is spread across future rent, month by month, and every birr is
  traceable to the month it paid for.
- **Prepaid rent tracking.** The system knows exactly how many months are covered, how much credit
  is left over, and when the prepaid coverage runs out.
- **Late fees, done fairly.** Owners can set a late-fee rule: a percentage or a flat amount, applied
  once, per week, or per month, with a grace period and a cap so fees never run away.
- **Expenses.** Track maintenance, utilities, taxes, insurance, and management costs, and let them
  offset what the owner is owed.
- **Monthly payouts.** Every month, collected rent is bundled into a payout batch. Owners can preview
  the next payout before it is created, and mark it paid once the money lands.
- **Add and manage staff.** Invite managers and give them only the permissions they need — view
  properties, record payments, manage complaints, and so on (14 separate permissions).
- **Vendors and work orders.** Keep a list of trusted plumbers, electricians, cleaners, and others,
  assign them to jobs, and track the job until it is done.
- **Reports.** Owner statements, payment reports, and rent rolls can be generated as Excel or PDF.
- **A clear activity log.** Every important action is recorded in an append-only trail, so the owner
  can always see who did what and when.

### For tenants

- **Browse listings** and filter by location.
- **Request a rental.** Send an application with a message to the owner.
- **Sign digitally.** No printing, no office visit — sign the agreement online. Signing is what
  activates the lease and creates the invoices.
- **Pay rent** with Telebirr or by declaring a bank transfer.
- **Report problems.** File a complaint about maintenance, noise, safety, payments, or a dispute, and
  reply back and forth on the thread.
- **Stay informed.** Get reminders before rent is due, alerts when it is overdue, and updates on
  complaints.

### For platform admins

- **Approve or reject owners.** New owners start as pending and cannot transact until approved.
- **Suspend and restore accounts** with a required reason, and the person is signed out immediately.
- **See the national picture** — every owner, every tenant, every agreement, not just one portfolio.
- **Settle disputes.** When an owner cannot resolve a complaint, they escalate it. The admin writes a
  formal ruling and both sides are notified.
- **Manage every owner's staff** across the whole platform.
- **Audit everything.** A searchable, append-only history of every significant event.

### For everyone

- **Notifications everywhere.** In-app alerts, plus SMS and Telegram when the user has configured
  those channels.
- **Two languages.** English and Amharic, all the way through the messages.
- **Live updates.** Payment statuses and notifications can arrive in real time, no page refresh
  needed.
- **Role-based access.** Every route is protected. People only see and do what their role allows.

---

## How the money works (the part everyone cares about)

Most rental software breaks when a tenant pays early or pays a round number. Proprity was designed
around that problem.

**The problem:** a tenant pays 45,000 birr when rent is 18,000 a month. A naive system either says
"that's too much" or quietly loses the extra 9,000.

**What Proprity does instead:**

1. It first pays off the invoice the payment was made against.
2. Any leftover rolls forward to the next unpaid rent invoice, oldest month first.
3. Every invoice that gets paid records exactly how much of which payment covered it.
4. If any money is still left after that, it is stored as credit — never discarded.
5. A safety ceiling stops fat-finger overpayments: a payment can cover what is owed on that
   agreement plus everything still due later, and not a birr more. If someone tries to send more,
   the system replies with the exact maximum it will accept.
6. Partial payments are perfectly fine. Paying half of a bill simply leaves it marked
   "partially paid".

**In the worked example:** with 45,000 paid against 18,000/month rent, October and November are paid
in full, December is half paid, and the owner is told immediately that two months are covered through
the end of November.

The owner is then reminded at **30, 10, 5, 3, 2, and 1 days** before that prepaid coverage runs out,
so there are no surprises.

---

## How it works, step by step

Here is the whole journey, start to finish:

1. **The owner adds a property and its units,** then publishes a listing.
2. **A tenant sees the listing and requests to rent it.** The request waits for approval.
3. **The owner accepts.** The unit is reserved and a digital agreement is generated.
4. **The tenant signs online.** The agreement goes active, the unit becomes occupied, and the
   deposit and rent invoices appear automatically.
5. **The tenant pays** — Telebirr, bank transfer, or cash recorded by the owner. Every payment is
   matched against invoices, with overpayment flowing forward as prepaid rent.
6. **Invoices update themselves** to paid or partially paid, and the owner is notified.
7. **At the start of each month,** collected rent is bundled into a payout batch for the owner.
8. **Alongside all this,** maintenance issues move from complaint to work order to vendor to
   completed — and if the owner cannot settle it, up to the admin for a ruling.

### Things that happen automatically, every day

Nobody has to remember these; the system does them on a schedule:

| When | What happens |
|---|---|
| **01:00 daily** | Leases past their end date are marked expired. Owners get 60- and 30-day renewal reminders. |
| **06:00 daily** | Next week's rent invoices are generated; overdue invoices are flagged; tenants get upcoming and overdue reminders; prepaid-expiry notices go out at the 30/10/5/3/2/1-day marks; and late fees are charged where a rule applies. |
| **1st of the month** | The monthly owner payout batch is created. |

Reminders are deduplicated, so a re-run or an overlapping job will not spam anyone.

---

## Why this matters (the benefits)

- **Money is never lost.** Partial payments, overpayments, and prepayments are all tracked down to the
  exact month each birr covered. Nothing silently disappears.
- **Agreements are tamper-evident.** Hashing plus signatures plus a re-check means a contract cannot
  be quietly edited after the fact.
- **No fake data, ever.** The UI shows only what is really in the database, so decisions are made on
  truth, not placeholders.
- **Everyone sees the same truth.** Owner, tenant, and admin all work from one shared record instead
  of scattered calls and paper.
- **Less admin work.** Invoices, reminders, late fees, and payouts happen on their own.
- **Fair and accountable.** Every important action lands in an audit log, and disputes have a formal,
  documented path to a ruling.
- **Least privilege by design.** Managers only get the permissions the owner grants, and every route
  is role-checked.
- **Built for Ethiopia.** Telebirr, Ethio Telecom reconciliation, Addis Ababa time zone, English and
  Amharic, and local property types and locations.

---

## Honest limitations

We would rather tell you than let you discover it:

- **No tenant web app yet.** The payment APIs exist, but tenants currently interact through the API
  or have the owner record their payment as cash/bank.
- **Reports are capped at 5,000 rows.** Payment, agreement and audit exports use the same
  server-side Excel/PDF generator; very large extracts are truncated to keep the server safe.
- **Prepayment covers already-generated invoices only.** Invoices are created a short window ahead,
  so paying 12 months at once will not work until those months have been generated.
- **SMS, Telebirr, and Telegram run in mock mode by default.** Real delivery needs real credentials.
- **Text search is page-local.** Status and method filters go to the server, but typing in the
  search box only filters the records on the current page.

---

## In one sentence

**Proprity gives Ethiopian property owners, tenants, and administrators one honest, tamper-proof place
to rent, pay, maintain, and settle — where every birr is accounted for and every action is written
down.**
