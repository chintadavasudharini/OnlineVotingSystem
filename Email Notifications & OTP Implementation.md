# 🗳️ SecureVote — Complete Email Notification, OTP Verification & Password Recovery Implementation Plan

> **Document:** `Email Notifications & OTP Implementation.md`  
> **Status:** Execution Ready  
> **Target System:** Online Voting System (SecureVote)  
> **Stack:** Spring Boot 3 (Java 21) | React 19 (TypeScript, Vite) | PostgreSQL | Gmail SMTP  

---

## 1. Architectural Overview & System Invariants

This plan outlines the end-to-end design and step-by-step roadmap for implementing:
1. **15 Distinct Email Notification Types** covering Account Lifecycle, Election Lifecycle, Candidate Operations, Voter Operations, and Security Alerts.
2. **Deterministic Cryptographic OTP Engine** (6-character pattern `[A-Z][a-z][0-9][A-Z][a-z][0-9]`, 30-second TTL, 30s resend cooldown, 5 attempts/OTP, rolling hourly rate-limits).
3. **High-Security Password Recovery Subsystem** (1-minute token expiry, single-use, cryptographic SHA-256 hash storage, automatic invalidation).
4. **Resilient Non-Blocking Email Dispatch** (`@Async` / `CompletableFuture`, transaction isolation ensuring SMTP delivery hiccups never abort database commits, zero plain credentials in logs or frontend).

```
                      +------------------------------------------+
                      |         User / Browser (React 19)        |
                      +------------------------------------------+
                                    |              ^
                        REST API    |              | SSE / Real-time
                       with JWT     v              | & Verification
                      +------------------------------------------+
                      |       Spring Boot 3 (Java 21 Backend)    |
                      +------------------------------------------+
                        /            |              \
                       /             |               \
                      v              v                v
          +---------------+  +---------------+  +-------------------+
          |  PostgreSQL   |  |  OTP / Token  |  |  EmailService     |
          |  (users, etc) |  |  Security     |  |  (Async SMTP)     |
          +---------------+  +---------------+  +-------------------+
                                                          |
                                                          v
                                                Gmail SMTP (TLS 587)
                                                vasu.demoprojects@gmail.com
```

---

## 2. Notification Matrix: All 15 Email Types

| # | Category | Notification Type | Trigger Event | Target Audience | Key Contents |
|---|---|---|---|---|---|
| **1** | Account | Voter Account Created | Successful registration + OTP verified | Newly registered Voter | Voter ID, Full Name, DOB, Gender, Login URL |
| **2** | Account | Candidate Account Created | Successful candidate registration + OTP verified | Newly registered Candidate | Candidate ID, Linked Voter ID, Status, Login URL |
| **3** | Election | New Election Announcement | Admin creates an election | All active Voters & Candidates | Election ID, Name, Description, Reg & Voting windows |
| **4** | Election | Candidate Reg Period Update | Admin updates registration window | All active Candidates | Election ID, Name, Old vs New registration times |
| **5** | Election | Voting Period Update | Admin updates voting window | All active Voters | Election ID, Name, Old vs New voting times |
| **6** | Election | Election Schedule Changes | Admin updates any schedule dates | All active Voters & Candidates | Election ID, Name, Summary of modified time slots only |
| **7** | Election | Election Results Published | Admin publishes final tallies | All active Voters & Candidates | Election ID, Name, Publication notice, Results URL |
| **8** | Election | Election Deletion Notice | Admin cancels/deletes election (0 votes cast) | All active Voters & Candidates | Election ID, Name, Deletion timestamp |
| **9** | Candidate | Candidate Election Registration | Candidate submits manifesto for election | Registered Candidate | Candidate ID, Election ID/Name, Timestamp, Manifesto |
| **10** | Candidate | Nomination Fee Payment Receipt | Razorpay payment verified by backend | Candidate | Candidate ID, Election ID, Payment ID, Order ID, Amount |
| **11** | Voter | Vote Casting Confirmation | Voter successfully submits secret ballot | Voting Voter | Voter Name, Election ID/Name, Timestamp (**Zero ballot choice**) |
| **12** | Security | Forgot Password Reset Link | User requests password recovery | Requesting User | 1-minute secure single-use reset URL |
| **13** | Security | Password Reset Success | Successful password reset via token | Requesting User | User ID, Confirmation timestamp, Security advisory |
| **14** | Security | Password Update Confirmation | Successful in-app password update via OTP | Authenticated User | User ID, Change timestamp, Security advisory |
| **15** | Security | Email Address Update | Successful email change via OTP | Old & New Email | User ID, Old Email, New Email, Security advisory |

---

## 3. Cryptographic OTP Verification Subsystem

### 3.1 Pattern & Generation Algorithm
- **Exact Format:** 6 characters adhering to pattern:
  $$\text{OTP} = [A\text{-}Z][a\text{-}z][0\text{-}9][A\text{-}Z][a\text{-}z][0\text{-}9]$$
  *(e.g., `Bv3Ch8`, `Kx9Lm2`, `Rq4Wp7`)*
- **Generator:** `java.security.SecureRandom` selecting from dedicated pools:
  - Uppercase: `ABCDEFGHJKLMNPQRSTUVWXYZ`
  - Lowercase: `abcdefghijkmnpqrstuvwxyz`
  - Digits: `23456789`
- **Hash Storage:** SHA-256 hash stored in database table `otp_verifications`; plaintext OTP never logged or stored.

### 3.2 Time-to-Live (TTL) & Security Policy
- **Validity:** Strictly **30 seconds** (`expires_at = now() + INTERVAL '30 SECONDS'`).
- **Resend Cooldown:** **30 seconds** countdown timer.
- **Max Resends:** Maximum **5 resends per rolling hour** per user/email.
- **Incorrect Attempts:** Maximum **5 attempts per OTP**. At the 5th failed attempt, the OTP is permanently invalidated.
- **Verification Attempts:** Maximum **10 total verification attempts per rolling hour**.
- **Single-Use:** Once verified, `used_at = now()` and OTP is marked spent.

### 3.3 State Machine for OTP Lifecycle
```
[User Action] ---> [Generate OTP (SecureRandom)] ---> [Hash & Store in DB] ---> [Send Email Async]
                                                                                      |
                          +-----------------------------------------------------------+
                          |
                          v
               [UI Countdown: 00:30]
                          |
             +------------+------------+
             |                         |
     [User Enters OTP]          [Time Reaches 00:00]
             |                         |
   (Check attempts <= 5)        [Status: OTP Expired]
             |                         |
     +-------+-------+          [Enable Resend Button]
     |               |
 [Valid & TTL OK] [Invalid]
     |               |
 [Mark Used]   [Attempts++]
     |               |
 [Action Confirmed] (If attempts >= 5 -> Invalidate OTP)
```

---

## 4. Forgot Password & Password Recovery Subsystem

### 4.1 Security Specification
1. **Token Generation:** 32-byte cryptographically secure random token (`java.security.SecureRandom`), hex/base64url-encoded.
2. **Storage:** Stored in `password_reset_tokens` table as a **SHA-256 hash**.
3. **Validity Window:** Exactly **1 minute** (`expires_at = now() + INTERVAL '1 MINUTE'`).
4. **Single-Use:** Immediately upon validation and password update, mark `used = true` and `used_at = now()`.
5. **No Password in Emails:** Emails contain only the secure one-time link (`/reset-password?token=...`).

---

## 5. Database Schema Migration Plan

### 5.1 `otp_verifications` Table
```sql
CREATE TABLE IF NOT EXISTS otp_verifications (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    email VARCHAR(150) NOT NULL,
    otp_hash VARCHAR(64) NOT NULL,
    purpose VARCHAR(50) NOT NULL,           -- 'VOTER_REGISTRATION', 'CANDIDATE_REGISTRATION', 'PASSWORD_UPDATE', 'EMAIL_UPDATE'
    payload TEXT,                           -- Temporary encrypted / JSON payload for pending registration data
    attempts INT DEFAULT 0,
    resend_count INT DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    used_at TIMESTAMP WITHOUT TIME ZONE,
    is_invalidated BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_otp_email_purpose ON otp_verifications(email, purpose);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);
```

### 5.2 `password_reset_tokens` Table
```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    used_at TIMESTAMP WITHOUT TIME ZONE,
    used BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_pwd_reset_token ON password_reset_tokens(token_hash);
CREATE INDEX idx_pwd_reset_user ON password_reset_tokens(user_id);
```

---

## 6. Backend Engineering Blueprint

### 6.1 Package & Class Additions
```
backend/src/main/java/com/voting/
├── config/
│   ├── AsyncConfig.java                 <-- Configures ThreadPoolTaskExecutor for mail dispatch
│   └── SecurityConfig.java              <-- Permits /api/auth/otp/**, /api/auth/forgot-password/**
├── entity/
│   ├── OtpVerification.java             <-- JPA Entity for OTPs
│   └── PasswordResetToken.java          <-- JPA Entity for Password recovery
├── repository/
│   ├── OtpVerificationRepository.java   <-- Custom query methods for rolling hour checks
│   └── PasswordResetTokenRepository.java
├── service/
│   ├── EmailService.java                <-- Complete with all 15 email HTML template methods
│   ├── OtpService.java                  <-- Generation, rate limiting, hashing, verification
│   ├── PasswordRecoveryService.java     <-- Token creation, 1-min expiry check, password update
│   ├── ElectionService.java             <-- Wires notifications on create, update, delete, publish
│   ├── VoteService.java                 <-- Wires vote casting confirmation
│   └── PaymentService.java              <-- Wires nomination payment receipt
└── controller/
    ├── OtpController.java               <-- Endpoints for send-otp, verify-otp, resend-otp
    └── PasswordRecoveryController.java  <-- Endpoints for forgot-password, reset-password
```

### 6.2 REST API Contracts

#### OTP Endpoints
- `POST /api/auth/otp/send`: Generates and emails a 6-character OTP.
  - Body: `{ "email": "...", "purpose": "VOTER_REGISTRATION" | "PASSWORD_UPDATE" | ... }`
- `POST /api/auth/otp/verify`: Validates input OTP, enforces attempt counters.
  - Body: `{ "email": "...", "otp": "Bv3Ch8", "purpose": "..." }`
- `POST /api/auth/otp/resend`: Checks 30s cooldown and hourly limit, invalidates old OTP, sends new.

#### Password Recovery Endpoints
- `POST /api/auth/forgot-password`: Generates 1-minute reset link.
  - Body: `{ "email": "user@example.com" }`
- `POST /api/auth/reset-password`: Validates token and updates password.
  - Body: `{ "token": "...", "newPassword": "..." }`

---

## 7. Frontend Engineering Blueprint

### 7.1 New & Enhanced Pages/Components

1. **`OtpModal.tsx` / `OtpVerificationPage.tsx`**:
   - Reusable modal/screen for entering 6-character OTP.
   - Dynamic 30-second countdown display (`00:30` down to `00:00`).
   - Warning banner when expired: `OTP Expired`.
   - Disabled verify button upon expiry.
   - Resend button active only after countdown reaches `00:00`.
   - Error banner showing remaining attempts (`e.g., 2 attempts left before invalidation`).

2. **`ForgotPasswordPage.tsx` (`/forgot-password`)**:
   - Clean email input with Zod validation.
   - Confirmation notification when link is dispatched.

3. **`ResetPasswordPage.tsx` (`/reset-password?token=...`)**:
   - Live token validation against backend.
   - If older than 1 minute or already used: Displays prominent banner `This reset link has expired or has already been used. Please request a new link.`
   - Password strength meter, confirm password matching.

4. **Voter & Candidate Profile Security Sections**:
   - Update Password modal with OTP verification step.
   - Update Email modal with OTP sent to new address before swapping.

---

## 8. Verification & Test Plan

1. **OTP Verification:**
   - [ ] Verify pattern matches `[A-Z][a-z][0-9][A-Z][a-z][0-9]`.
   - [ ] Verify validation fails at $t > 30$ seconds.
   - [ ] Verify 5th incorrect attempt invalidates the OTP.
   - [ ] Verify 6th resend in 60 minutes is rejected with 429 Too Many Requests.
2. **Password Recovery:**
   - [ ] Verify link expires after 60 seconds.
   - [ ] Verify token cannot be re-used twice.
   - [ ] Verify password reset success email is delivered.
3. **Ballot Secrecy in Email:**
   - [ ] Verify Vote Confirmation email contains election ID/name and timestamp, and zero references to selected candidate.
4. **All 15 Notifications Live Delivery:**
   - [ ] Test real delivery across all 15 scenarios to Gmail inbox.
