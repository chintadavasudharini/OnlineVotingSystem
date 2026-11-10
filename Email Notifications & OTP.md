# 🗳️ SecureVote — Email Notifications, OTP Verification & Password Recovery (Completed Implementation Baseline)

> **Document:** `Email Notifications & OTP.md`  
> **Status:** Fully Implemented & Audited (`BUILD SUCCESS`, 18 Tests Passing)  
> **Target System:** Online Voting System (SecureVote)  
> **Runtime Stack:** Spring Boot 3.3.4 (Java 21 LTS) | React 19 (TypeScript, Vite 8) | PostgreSQL 15+ | Gmail SMTP (TLS 587)  

---

## 1. Architectural Baseline & Core Guarantees

The email notification, cryptographic OTP, and password recovery subsystems are fully operational under strict architectural constraints:

1. **Strictly 5 PostgreSQL Tables**: The database schema remains strictly five tables (`users`, `elections`, `candidate_registrations`, `votes`, `audit_logs`). **Zero additional tables** were added.
2. **Ephemeral In-Memory Storage**: OTPs and Password Reset tokens exist **exclusively in volatile JVM memory** (`java.util.concurrent.ConcurrentHashMap`), completely eliminating security risks associated with database dumps, replication logs, or stale credential persistence.
3. **16 Permanent Thymeleaf HTML Templates**: All notification and verification emails are styled with responsive HTML and permanent project templates located at `src/main/resources/templates/email/`.
4. **15 Distinct Notification Events**: Covering the full election, user registration, security alert, and financial transaction lifecycles.
5. **Absolute Ballot Secrecy**: Vote confirmation emails contain voter identity, election metadata, timestamp, and a cryptographic receipt hash, but **strictly zero candidate choice or preference**.
6. **Asynchronous Non-Blocking Execution**: Email delivery runs in `CompletableFuture.runAsync()`. Network delays or SMTP failures never block or roll back database transactions.

```mermaid
flowchart TD
    Client["React 19 Client (OtpModal / ForgotPasswordPage)"] -->|REST API with Bearer JWT| Backend["Spring Boot 3.3.4 Backend"]
    
    subgraph EphemeralStorage ["JVM In-Memory Ephemeral Storage (RAM Only)"]
        OtpEngine["OtpStorageService<br/>(ConcurrentHashMap, 30s TTL, SHA-256)"]
        ResetEngine["PasswordResetStorageService<br/>(ConcurrentHashMap, 60s TTL, 32-byte token)"]
        Cleaner["@Scheduled(fixedRate=10000)<br/>Auto-eviction every 10 seconds"]
    end
    
    subgraph RelationalDB ["PostgreSQL 15+ (Strictly 5 Tables Only)"]
        Users[("users")]
        Elections[("elections")]
        CandidateReg[("candidate_registrations")]
        Votes[("votes")]
        AuditLogs[("audit_logs")]
    end
    
    Backend --> EphemeralStorage
    Backend --> RelationalDB
    
    Backend -->|Async CompletableFuture| EmailService["EmailService (Thymeleaf Engine)"]
    EmailService -->|16 HTML Templates| GmailSMTP["Gmail SMTP (smtp.gmail.com:587 TLS)"]
```

---

## 2. Notification Matrix: All 15 Email Types & 16 Templates

All email templates reside under `backend/src/main/resources/templates/email/`:

| # | Category | Notification Type | Trigger Event / Source | Recipient | Template File | Ballot Secrecy |
|:---:|:---|:---|:---|:---|:---|:---:|
| **1** | Verification | 6-Character Registration OTP | Citizen signs up or updates credentials | Voter / Candidate | `otp-verification.html` | N/A |
| **2** | Account | Voter Registration Confirmed | Successful voter enrollment (`V1`, `V2`...) | Registered Voter | `voter-welcome.html` | N/A |
| **3** | Account | Candidate Account Created | Successful elevation to Candidate (`C1`, `C2`...) | Candidate | `candidate-welcome.html` | N/A |
| **4** | Candidate | Election Nomination Filed | Candidate submits manifesto and pledges | Candidate | `candidate-registration.html` | N/A |
| **5** | Candidate | Nomination Fee Receipt | Razorpay deposit (₹100) verified via HMAC | Candidate | `payment-confirmation.html` | N/A |
| **6** | Voter | Vote Casting Confirmation | Voter submits secret ballot during `VOTING_OPEN` | Active Voter | `vote-confirmation.html` | **YES (Zero Choice)** |
| **7** | Election | New Election Announcement | Admin schedules new election | All Voters & Candidates | `new-election.html` | N/A |
| **8** | Election | Election Schedule Update | Admin modifies start/end dates | All Voters & Candidates | `election-schedule-update.html` | N/A |
| **9** | Election | Candidate Reg Window Update | Admin modifies candidate registration window | All Candidates | `registration-period-update.html` | N/A |
| **10**| Election | Voting Period Window Update | Admin modifies balloting window | All Voters | `voting-period-update.html` | N/A |
| **11**| Election | Election Cancellation Notice | Admin cancels/deletes election (0 votes cast) | All Voters & Candidates | `election-deleted.html` | N/A |
| **12**| Election | Election Results Published | Admin certifies and publishes election tallies | All Voters & Candidates | `election-results.html` | N/A |
| **13**| Security | Password Reset Link | User requests forgotten password reset | Requesting User | `password-reset.html` | N/A |
| **14**| Security | Password Reset Success | User completes reset via 60s token | Requesting User | `password-reset-success.html` | N/A |
| **15**| Security | Password Update Confirmation | User updates password in Account Security | Account Owner | `password-updated.html` | N/A |
| **16**| Security | Email Update Confirmation | User changes registered email address | Old & New Addresses | `email-updated.html` | N/A |

---

## 3. Ephemeral OTP Engine (`OtpStorageService`)

### 3.1 Cryptographic Specification
* **Format**: 6 alternating alphanumeric characters:
  $$\text{Pattern: } [A\text{-}Z][a\text{-}z][0\text{-}9][A\text{-}Z][a\text{-}z][0\text{-}9] \quad (\text{e.g., } K4m9P2, X7b1Q5)$$
* **RNG Engine**: `java.security.SecureRandom` selecting from high-entropy character pools (excluding ambiguous glyphs like `0`, `O`, `l`, `1`).
* **Validity TTL**: Strictly **30 seconds**.
* **Resend Cooldown**: **30 seconds** between consecutive requests.
* **Storage Structure**: `ConcurrentHashMap<String, OtpRecord>` keyed by `purpose:email.toLowerCase()`.
* **Zero Plaintext Storage**: Only `SHA-256(rawOtp)` is stored in memory.
* **Brute-Force Invalidation**: Maximum **5 failed attempts**. The 5th incorrect entry permanently revokes the OTP.
* **Rate Limiting**: Maximum **5 requests per email per rolling 60-minute window**.
* **Automatic Purging**: A background task annotated with `@Scheduled(fixedRate = 10000)` sweeps memory every 10 seconds to discard expired records.

### 3.2 State Machine
```
[User Action] ---> [Generate 6-Char OTP] ---> [Store SHA-256 Hash in RAM] ---> [Async Mail Dispatch]
                                                                                       |
                           +-----------------------------------------------------------+
                           |
                           v
                [React OtpModal: 30s Countdown]
                           |
              +------------+------------+
              |                         |
      [User Enters OTP]          [Timer Reaches 00:00]
              |                         |
     (Check attempts < 5)         [OTP Expired in RAM]
              |                         |
      +-------+-------+          [Enable Resend Button]
      |               |
  [Match SHA-256]  [Mismatch]
      |               |
  [Atomic Remove]  [Attempts++]
      |               |
  [Action Passed]  (If attempts >= 5 -> Invalidate Record)
```

---

## 4. Ephemeral Password Recovery Engine (`PasswordResetStorageService`)

### 4.1 Security Specification
1. **Cryptographic Token**: 32 cryptographically secure random bytes generated via `SecureRandom` and Hex-encoded (64 hex characters).
2. **Ephemeral RAM Storage**: `ConcurrentHashMap<String, ResetTokenRecord>` indexed by `SHA-256(token)`.
3. **Validity Window**: Strictly **60 seconds (1 minute)**.
4. **Single-Use Atomic Consumption**: Consumed using `ConcurrentHashMap.remove(tokenHash)`. Once queried and matched, the token is permanently expunged, preventing replay attacks.
5. **Rate Limiting**: Maximum **3 reset requests per email per hour**.
6. **Zero Disk / Database Persistence**: Tokens are never committed to PostgreSQL.
7. **Automated Sweep**: Stale records purged every 10 seconds via `@Scheduled(fixedRate = 10000)`.

---

## 5. API Reference & Controller Contracts

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register/send-otp` | Public | Dispatches 6-char 30s OTP to target email address |
| `POST` | `/api/auth/register/verify-otp` | Public | Atomically verifies OTP against in-memory SHA-256 digest |
| `POST` | `/api/auth/forgot-password` | Public | Generates 60s cryptographic reset token and dispatches email link |
| `POST` | `/api/auth/reset-password` | Public | Atomically consumes reset token and updates password with BCrypt |
| `PUT` | `/api/voters/profile/update-password` | `ROLE_VOTER`, `ROLE_CANDIDATE` | Updates password with old password verification and optional OTP |
| `PUT` | `/api/voters/profile/update-email` | `ROLE_VOTER`, `ROLE_CANDIDATE` | Updates email after 30s OTP verification on new address |

---

## 6. Frontend Components (`frontend/src`)

1. **`OtpModal.tsx`**:
   - 6 individual character input boxes with automatic focus advancement and backspace handling.
   - Dynamic 30-second countdown display (`00:30` down to `00:00`).
   - Visual expiration warning and automatic disablement upon reaching `00:00`.
   - 30-second cooldown timer before the "Resend OTP" button is enabled.
   - Live display of remaining attempts.
2. **`ForgotPasswordPage.tsx`**:
   - Citizen email form with Zod schema validation.
   - Dispatches password recovery request and displays delivery confirmation.
3. **`ResetPasswordPage.tsx`**:
   - Token extraction from URL query parameter (`?token=...`).
   - New password and confirmation inputs with live strength criteria.
   - Clear error presentation if token is expired ($> 60$ seconds) or already spent.
4. **`AccountSecuritySection.tsx`**:
   - In-app tab on Voter/Candidate profile for self-service credential updates with OTP verification.

---

## 7. Audit Verification & Test Execution Results

The implementation was audited and verified through automated test suites:

```
+---------------------------------------------------------------------------------------+
|                               TEST EXECUTION SUMMARY                                  |
+---------------------------------------------------------------------------------------+
| Test Class                  | Execution Focus                               | Status  |
+-----------------------------+-----------------------------------------------+---------+
| AdminProfileSecurityTest    | Dev admin/admin vs Prod env var separation    | PASS    |
| EmailAndOtpAuditTest        | 30s OTP TTL, 60s reset token, 10s cleaner     | PASS    |
|                             | 16 Thymeleaf template rendering integrity     | PASS    |
|                             | Zero candidate choice in vote confirmation    | PASS    |
| OnlineVotingSystemAppTests  | JPA repository mappings & context load        | PASS    |
+-----------------------------+-----------------------------------------------+---------+
| TOTAL BACKEND TESTS         | 18 executed, 0 failures, 0 skipped            | PASS    |
| BUILD RESULT                | BUILD SUCCESS (Total time: 23.165 s)          | PASS    |
| FRONTEND BUNDLE             | Vite 8 production build (dist/ in 1.11s)       | PASS    |
+-----------------------------+-----------------------------------------------+---------+
```
