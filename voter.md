# 🗳️ SecureVote — Voter Persona & User Guide

> **Document:** `voter.md`  
> **Role:** Citizen / Voter (`ROLE_VOTER`)  
> **Platform:** SecureVote — Enterprise Online Voting System  
> **Target Audience:** Registered Citizens, System Evaluators, Developers  

---

## 📑 Table of Contents
1. [Overview & Voter Rights](#1-overview--voter-rights)
2. [Eligibility & Constitutional Requirements](#2-eligibility--constitutional-requirements)
3. [Registration & Onboarding Workflow](#3-registration--onboarding-workflow)
4. [Authentication & Login Portal](#4-authentication--login-portal)
5. [Voter Dashboard & Identity Profile](#5-voter-dashboard--identity-profile)
6. [Balloting & Voting Workflow](#6-balloting--voting-workflow)
7. [Ballot Secrecy & Single-Vote Guarantee](#7-ballot-secrecy--single-vote-guarantee)
8. [Election Results & Transparency](#8-election-results--transparency)
9. [Candidate Elevation Path](#9-candidate-elevation-path)
10. [Troubleshooting & Security FAQs](#10-troubleshooting--security-faqs)

---

## 1. Overview & Voter Rights

Every verified citizen enrolled in **SecureVote** holds an immutable, democratic right to:
- Review all scheduled, ongoing, and completed elections on the **Public Election Board**.
- Cast **exactly one secret ballot** in each eligible election during its active `VOTING_OPEN` window.
- Receive an automated, cryptographically logged voting receipt via email.
- Inspect certified, audited election results with full candidate breakdowns and winner certifications.
- Elevate to **Candidate** status upon meeting the constitutional age threshold ($\ge 25$ years).

---

## 2. Eligibility & Constitutional Requirements

To maintain electoral integrity, voter registration enforces non-negotiable verification rules:

| Requirement | Rule / Criterion | Enforcement Mechanism |
|---|---|---|
| **Age Eligibility** | $\ge 18$ years old at time of registration | Client Zod schema + Backend `@Min(18)` validator calculating years from Date of Birth |
| **Unique Identity** | Single email per voter | PostgreSQL Unique Constraint `UNIQUE(email, role)` |
| **Demographic Capture** | Validated Gender selection | Dropdown (`Male`, `Female`, `Other`) immediately following Date of Birth |
| **Identifier Generation** | Official Voter ID | Deterministic monotonic sequence: `V1`, `V2`, `V3`... |
| **Password Security** | Minimum 6 characters | Salted and hashed via BCrypt before relational storage |

---

## 3. Registration & Onboarding Workflow

### Step-by-Step Registration Guide
1. Navigate to the registration page: **`http://localhost:5174/register`** (or click **Register as Voter** on the home page).
2. Complete the verified citizen form:
   - **Full Name**: Your legal citizen name.
   - **Email Address**: Your valid email (used for confirmation and voting notifications).
   - **Date of Birth (DOB)**: Must establish age $\ge 18$.
   - **Gender**: Select `Male`, `Female`, or `Other`.
   - **Password & Confirm Password**: Minimum 6 characters.
3. Click **Register as Voter**.

```mermaid
sequenceDiagram
    autonumber
    actor Voter as Citizen
    participant UI as React Client
    participant API as Spring Boot Backend
    participant DB as PostgreSQL
    participant Mail as Gmail SMTP

    Voter->>UI: Fills registration form (DOB >= 18, Gender)
    UI->>API: POST /api/auth/register-voter
    API->>API: Compute Age from DOB & Validate >= 18
    API->>DB: Check email uniqueness for VOTER role
    API->>DB: Generate Next Voter ID (e.g. V1)
    API->>DB: Save User (BCrypt password, role: VOTER)
    API->>DB: Insert Audit Log ("V1 registered as Voter")
    API--)Mail: Dispatch async Welcome Email with Voter ID (V1)
    API-->>UI: Return JWT Bearer token & Voter ID
    UI-->>Voter: Redirect to Voter Profile with Success Banner
```

### Automated Welcome Email
Upon successful registration, **SecureVote** asynchronously delivers a branded HTML confirmation email via **Gmail SMTP**:
- **Subject:** `🗳️ Welcome to SecureVote — Voter Registration Confirmed (V1)`
- **Contents:** Official Voter ID, registered email, Date of Birth, Gender, verified status, and login instructions.

---

## 4. Authentication & Login Portal

To prevent account confusion and cross-role vulnerability, voters authenticate via an isolated, dedicated login screen:

- **Direct URL:** **`http://localhost:5174/login?role=voter`**
- **Credential Required:** **Voter ID** (e.g., `V1`, `V2`) and **Password**.
- **Role Isolation:**
  - Entering a Candidate ID (e.g., `C1`) is explicitly rejected:  
    *`"Candidate credentials cannot be used for Voter login."`*
  - Entering Admin credentials is strictly rejected:  
    *`"Admin credentials cannot be used for Voter login."`*

---

## 5. Voter Dashboard & Identity Profile

Once logged in, voters access the **Voter Portal**:

### Profile Screen (`/voter/profile`)
Displays verified citizen credentials in read-only form:
- **Voter ID:** Official identifier (`V1`)
- **Full Name:** Registered citizen name
- **Email:** Contact address
- **Date of Birth:** Verified birthdate
- **Gender:** Registered gender identity
- **Age:** Dynamically verified age
- **Account Status:** `ACTIVE (Verified)`

---

## 6. Balloting & Voting Workflow

Voting is restricted strictly to active elections during their time-locked `VOTING_OPEN` window.

```mermaid
flowchart TD
    A[Voter logs into Voter Portal] --> B[Browse Active Elections]
    B --> C{Election Status?}
    C -->|UPCOMING| D[View Schedule - Voting Closed]
    C -->|REGISTRATION OPEN| E[Candidate Filing Window - Voting Closed]
    C -->|VOTING OPEN| F[Click 'Cast Vote']
    C -->|COMPLETED| G[View Certified Results]
    F --> H{Already Voted?}
    H -->|Yes| I[Display 'Already Voted' Badge - Ballot Disabled]
    H -->|No| J[Review Candidate Manifestos & Promises]
    J --> K[Select Preferred Candidate]
    K --> L[Click 'Confirm & Submit Ballot']
    L --> M[Atomic Database Transaction]
    M --> N[Confirmation Receipt & Audit Entry]
```

### Step-by-Step Voting:
1. Open the **Elections** tab: `/voter/elections`.
2. Locate the election tagged with the green **`VOTING OPEN`** badge.
3. Click **Cast Vote** to view the candidate roster.
4. Review each candidate's:
   - Candidate ID & Name (e.g., `C1 - Jane Doe`)
   - Campaign Manifesto Title
   - Vision Statement & Key Pledges
5. Select your chosen candidate and click **Submit Vote**.
6. The system records your ballot atomically and disables further voting in that election.

---

## 7. Ballot Secrecy & Single-Vote Guarantee

### Mathematical Single-Vote Security
The application enforces a **triple-barrier defense** against double-voting:
1. **Pre-Validation**: Application layer checks `!hasVoted(voterId, electionId)`.
2. **Database Hard Barrier**: PostgreSQL table `votes` possesses a compound unique constraint:
   $$\text{UNIQUE}(\text{election\_id}, \text{voter\_id})$$
   Any concurrent duplicate submission is rejected atomically at the database level with a unique constraint violation.
3. **Audit Ledger**: The action is recorded in `audit_logs` without ever compromising anonymity.

### Critical Ballot Secrecy Guarantee
- When a vote confirmation notification is dispatched:
  - Included: Voter Name, Election ID, Election Name, Timestamp.
  - **NEVER Included:** The chosen candidate ID, candidate name, or preference.
- System administrators and audit logs cannot link a ballot choice back to a voter's public profile.

---

## 8. Election Results & Transparency

Once the voting window closes and the Super Administrator certifies the tallies, voters can review live certified results at `/voter/results`:

### Certified Display Rules:
- **Elected Candidate (Single Winner)**:  
  Rendered in a prominent **Green Card**:
  > 🟩 **Elected Candidate**  
  > **C2 - Candidate Name**
- **Tie Result (Deadlock)**:  
  If two or more candidates have the identical highest vote count, rendered in a **Yellow Card**:
  > 🟨 **Result: Tie**  
  > **C1 - Candidate Alpha &rarr; 1,500 votes**  
  > **C2 - Candidate Beta &rarr; 1,500 votes**
- **Public Metrics**: Displays total eligible voters and total votes cast for full voter turnout auditing.

---

## 9. Candidate Elevation Path

Every registered voter who reaches the constitutional age of **25 years** is eligible to become an election candidate:
1. In your **Voter Profile**, view the **Candidate Elevation** card.
2. If age $\ge 25$, click **Register as Candidate**.
3. Create your candidate password.
4. The system auto-generates your unique **Candidate ID** (e.g., `C1`) linked directly to your `voter_id`.
5. Receive your candidate activation email and log in at `/login?role=candidate`.

---

## 10. Troubleshooting & Security FAQs

**Q: I forgot my Voter ID. How do I retrieve it?**  
A: Check your inbox for the welcome email sent from `vasu.demoprojects@gmail.com` with subject `Welcome to SecureVote — Voter Registration Confirmed`. Your Voter ID is highlighted at the top.

**Q: Can I change my vote after submitting?**  
A: No. In compliance with democratic standards, all ballots are final, immutable, and immediately committed to the PostgreSQL ledger.

**Q: Why is the 'Cast Vote' button disabled?**  
A: Voting is permitted strictly when the election status is `VOTING_OPEN`. If the election is `UPCOMING`, `REGISTRATION_OPEN`, or `COMPLETED`, balloting is physically locked.
