# 📧 Email Notifications & OTP — Methods and Concepts Guide

> **Document:** `Email Notifications & OTP – Methods and Concepts.md`  
> **Platform:** SecureVote — Enterprise Online Voting System  
> **Target Audience:** Engineering Team, System Architects, Developers  

Let's understand all the core concepts and trade-offs before choosing and finalizing the implementation architecture for your Online Voting System.

Your system needs to perform **four major mission-critical tasks**:
1. **Send emails** to Voters and Candidates.
2. **Generate and verify OTPs** (One-Time Passwords).
3. **Allow users to reset forgotten passwords** safely.
4. **Send automatic notifications** when important election lifecycle activities occur.

There are multiple technologies and methods for each task. They are independent choices that can be flexibly combined into a cohesive architecture.

---

## 📑 Table of Contents
1. [Email Delivery Methods](#1-email-delivery-methods)
2. [OTP Generation Methods](#2-otp-generation-methods)
3. [OTP Storage Methods](#3-otp-storage-methods)
4. [OTP Verification Methods](#4-otp-verification-methods)
5. [Forgot Password Recovery Methods](#5-forgot-password-recovery-methods)
6. [Email Processing & Concurrency Methods](#6-email-processing--concurrency-methods)
7. [Email Notification Tracking & Audit Methods](#7-email-notification-tracking--audit-methods)
8. [Email Notification Triggering Methods](#8-email-notification-triggering-methods)
9. [Email Template & Rendering Methods](#9-email-template--rendering-methods)
10. [Database Architecture Alternatives](#10-database-architecture-alternatives)
11. [Understanding the Three Database Tables](#11-understanding-the-three-database-tables)
12. [All Methods at a Glance](#12-all-methods-at-a-glance)
13. [Four Complete Implementation Combinations](#13-four-complete-implementation-combinations)
14. [Architectural Recommendation for SecureVote](#14-architectural-recommendation-for-securevote)
15. [Architecture Selection Matrix](#15-architecture-selection-matrix)

---

## 1. Email Delivery Methods

Email delivery refers to how your Spring Boot application dispatches an email message so it lands reliably in a user's inbox.

For example, when a citizen registers as a Voter, your backend generates an OTP and needs a transport mechanism to deliver it to Gmail.

```
+--------------------+       SMTP (TLS 587)       +---------------------+
|  Spring Boot App   |  ───────────────────────►  |  Mail Server / ESP  |
+--------------------+                            +---------------------+
                                                             |
                                                             v
                                                  +---------------------+
                                                  |  Voter Gmail Inbox  |
                                                  +---------------------+
```

### Method 1: Gmail SMTP *(Configured & Verified in SecureVote)*
Uses a verified Google Account to relay outgoing emails via Google's secure SMTP mail servers (`smtp.gmail.com:587` with STARTTLS).

- **How it works:**
  1. Create a Google/Gmail account for the application.
  2. Enable 2-Step Verification on the Google Account.
  3. Generate a dedicated 16-character **Google App Password**.
  4. Configure Spring Boot's `JavaMailSender` with Gmail SMTP credentials.
  5. The backend authenticates and dispatches outgoing emails directly through Google infrastructure.
- **Advantages:**
  - Easy to configure with zero external subscription platforms.
  - Built-in TLS encryption on port 587.
  - Highly trusted domain reputation (messages rarely land in spam).
  - Excellent for active development, demonstrations, and mid-sized applications.
- **Disadvantages:**
  - Google enforces daily sending quotas (typically ~500–2,000 emails/day).
  - Not designed for massive multi-million bulk marketing blasts.
  - Requires maintaining Google Account credentials securely.

### Method 2: Amazon SES (Simple Email Service)
A cloud-scale, highly cost-effective transactional email service from Amazon Web Services (AWS).

- **How it works:**
  1. Create an AWS account and register the application domain.
  2. Verify domain ownership using DNS DKIM/SPF records.
  3. Obtain SMTP credentials or integrate via AWS Java SDK v2.
  4. Spring Boot dispatches messages via Amazon SES endpoints.
- **Advantages:**
  - Extremely cost-effective (\$0.10 per 1,000 emails).
  - High deliverability, bounce tracking, and complaint rate analytics.
  - Horizontally scalable to millions of emails per hour.
- **Disadvantages:**
  - Requires AWS console configuration and sandbox exit approval.
  - Requires domain ownership and DNS management (SPF/DKIM/DMARC).

### Method 3: SendGrid (Twilio)
A dedicated transactional email platform offering both SMTP relay and rich RESTful APIs.

- **Advantages:**
  - Visual dynamic template builder.
  - Comprehensive real-time delivery metrics, open rates, and click tracking.
  - Robust Java SDK support.
- **Disadvantages:**
  - Requires third-party account setup and sender identity verification.
  - Free tier has strict monthly limits before transitioning to paid plans.

### Method 4: Brevo (formerly Sendinblue)
Provides transactional email APIs, SMTP relay, and built-in visual marketing templates.

- **Advantages:**
  - Generous free tier (300 emails/day).
  - Advanced delivery analytics and webhooks for bounce tracking.
- **Disadvantages:**
  - Requires account verification and dedicated API key management.

### Method 5: Mailgun
A developer-focused transactional email API built specifically for application integration.

- **Advantages:**
  - Powerful email validation API to prevent disposable email signups.
  - Detailed message-level tracking and webhook notifications.
- **Disadvantages:**
  - Requires custom domain configuration and paid credit card verification.

> [!NOTE]
> **Key Concept:** Gmail SMTP, Amazon SES, SendGrid, Brevo, and Mailgun all perform the exact same core responsibility: **delivering an email over the network**. You only need to choose **one primary delivery provider**.

---

## 2. OTP Generation Methods

An **OTP (One-Time Password)** is a temporary, single-use credential entered by a user to verify identity or authorize a high-privilege action.

### Method 1: Java `SecureRandom` *(Required & Recommended)*
Java standard library provides `java.security.SecureRandom`, a cryptographically strong pseudo-random number generator (CSPRNG).

```java
SecureRandom random = new SecureRandom();
```

- **Format Requirement:** Exactly **6 characters** matching pattern:
  $$\text{OTP} = [A\text{-}Z][a\text{-}z][0\text{-}9][A\text{-}Z][a\text{-}z][0\text{-}9]$$
  *(e.g., `Bv3Ch8`, `Kx9Lm2`, `Rq4Wp7`)*
- **Pattern breakdown:**
  1. Character 1: Uppercase letter (`A-Z`)
  2. Character 2: Lowercase letter (`a-z`)
  3. Character 3: Numeric digit (`0-9`)
  4. Character 4: Uppercase letter (`A-Z`)
  5. Character 5: Lowercase letter (`a-z`)
  6. Character 6: Numeric digit (`0-9`)
- **Advantages:**
  - Native to Java 21 runtime with zero external dependencies.
  - Cryptographically non-deterministic and resistant to brute-force prediction.
  - Complete control over character pools and formatting rules.

### Method 2: UUID-Based Token Generation
Universally Unique Identifiers (e.g., `550e8400-e29b-41d4-a716-446655440000`).
- Best suited for **Password Reset Links** and transaction tokens, but impractical for short 6-character user-entered OTPs.

### Method 3: Third-Party Identity Providers
Delegating OTP generation to auth providers (Twilio Verify, Firebase Auth).
- **Disadvantages:** External dependency, subscription fees, and inability to enforce our strict 6-character custom alternating pattern or 30-second TTL.

### Method 4: Time-Based OTP (TOTP - RFC 6238)
Algorithm used by Google Authenticator and Microsoft Authenticator.
- Operates on a pre-shared secret key stored in an authenticator app; not applicable for email-delivered OTP verification.

---

## 3. OTP Storage Methods

Once generated, the backend must remember the OTP temporarily until the user submits their verification code.

### Method 1: In-Memory Storage (`ConcurrentHashMap`)
Stores OTP entries in JVM memory:
- **Structure:** `email -> { otpHash, expiresAt, attempts }`
- **Advantages:** Zero database schema additions, blazing fast lookup.
- **Disadvantages:** Disappears on application restart; fails in multi-instance horizontally scaled deployments.

### Method 2: PostgreSQL Storage (`otp_verifications` Table) *(Recommended)*
Stores hashed OTPs directly in the existing relational database.

| Column | Type | Purpose |
|---|---|---|
| `id` | `BIGSERIAL PK` | Unique record identifier |
| `user_id` | `VARCHAR(50)` | Optional reference to existing voter/candidate |
| `email` | `VARCHAR(150)` | Citizen email address |
| `otp_hash` | `VARCHAR(64)` | SHA-256 hash of plaintext OTP (never plain text) |
| `purpose` | `VARCHAR(50)` | `VOTER_REGISTRATION`, `PASSWORD_UPDATE`, etc. |
| `attempts` | `INT` | Failed attempt counter (max 5) |
| `resend_count` | `INT` | Hourly resend tracking (max 5/hr) |
| `created_at` | `TIMESTAMP` | Timestamp of issuance |
| `expires_at` | `TIMESTAMP` | Exactly `created_at + 30 seconds` |
| `used_at` | `TIMESTAMP` | Single-use consumption timestamp |
| `is_invalidated` | `BOOLEAN` | Revocation flag |

- **Advantages:**
  - Survives backend restarts and redeployments.
  - Utilizes existing PostgreSQL infrastructure with zero new software to manage.
  - Enables strict rolling 60-minute rate-limiting queries.
  - Provides full compliance audit trails.

### Method 3: Redis In-Memory Store
Uses Redis key-value store with native TTL expiration (`SETEX key 30 value`).
- **Advantages:** Automatic physical eviction after 30 seconds; sub-millisecond access.
- **Disadvantages:** Requires provisioning, hosting, monitoring, and paying for an additional Redis service.

---

## 4. OTP Verification Methods

```
[Citizen Enters 6-Char OTP] ──► [POST /api/auth/otp/verify] ──► [Spring Boot Backend]
                                                                        │
                                              ┌─────────────────────────┴─────────────────────────┐
                                              ▼                                                   ▼
                                    [1. Has OTP Expired?]                             [2. Attempts Exceeded?]
                                     Current Time > 30s                                  Attempts >= 5
                                              │                                                   │
                                              ▼                                                   ▼
                                    [Reject: 400 Expired]                             [Reject: Invalidated]
                                              │
                                              v (If Valid)
                                    [3. Compute SHA-256(Input)]
                                              │
                                              ▼
                                    [4. Compare with DB Hash] ──► [Match: Mark Used & Proceed]
                                                              └──► [Mismatch: attempts++, Reject]
```

### Method 1: Server-Side Cryptographic Verification *(Mandatory)*
All validation happens within Spring Boot:
- Verifies expiration against server UTC clock ($t \le 30\text{s}$).
- Verifies single-use constraint (`used_at IS NULL`).
- Verifies maximum incorrect attempts ($\le 5$ per OTP).
- Verifies maximum verification attempts ($\le 10$ per rolling hour).
- Hashes submitted OTP with SHA-256 and executes constant-time string comparison.

### Method 2: Client-Side Browser Checking *(Insecure / Forbidden)*
Evaluating the OTP in React code is completely insecure, as any user could inspect JavaScript memory or bypass checks in DevTools.

---

## 5. Forgot Password Recovery Methods

When a voter or candidate loses access to their password, the system must authenticate identity before allowing a password change.

### Method 1: Single-Use 1-Minute Reset Link *(Required & Recommended)*
```
Citizen Enters Email ──► Generate 32-Byte Token ──► Store SHA-256 in DB ──► Email Reset Link
                                                                                 │
                                                                                 v
                                                             Link Valid for Exactly 1 Minute
                                                                                 │
                                                                                 v
User Opens URL ──► Enters New Password ──► Backend Validates Token & Invalidate ──► Password Updated
```

- **Flow:**
  1. User enters their registered email at `/forgot-password`.
  2. Backend generates a cryptographically secure 32-byte token (`java.security.SecureRandom`).
  3. The **SHA-256 hash** of the token is saved in `password_reset_tokens` with `expires_at = now() + INTERVAL '1 MINUTE'`.
  4. An email with reset link `https://.../reset-password?token=<raw_token>` is dispatched.
  5. The user opens the link, enters their new password, and submits.
  6. Backend hashes the token, matches the DB record, checks $t \le 1\text{ minute}$, updates user password with BCrypt, and sets `used = TRUE`.
  7. A confirmation email is delivered notifying the user that their password was changed.
- **Security Advantages:**
  - Token is single-use and invalid after 60 seconds.
  - Plaintext token is never stored in the database (only SHA-256 hash).
  - Passwords are never sent via email.

### Method 2: Email OTP Password Reset
User enters registered email, receives a 6-character OTP, enters the OTP, and updates password.
- Suitable, but requires entering an OTP manually instead of clicking a direct secure link.

---

## 6. Email Processing & Concurrency Methods

How the Spring Boot backend dispatches emails relative to the HTTP request-response cycle.

```
Synchronous:
Request ──────────────────► [Save DB] ──► [Wait for SMTP (2-5s)] ──► Response (Slow)

Asynchronous:
Request ──────────────────► [Save DB] ──► Return Response (Fast: 50ms)
                               │
                               └──► [Background Worker / CompletableFuture] ──► [SMTP Relay]
```

### Method 1: Synchronous Delivery
Backend communicates with the SMTP server on the main request thread before responding to the browser.
- **Disadvantage:** If the SMTP server takes 3 seconds to respond, the user's browser freezes for 3 seconds. If SMTP fails, it risks throwing an exception that rolls back database work.

### Method 2: Asynchronous Delivery (`CompletableFuture` / `@Async`) *(Implemented & Recommended)*
Backend commits database records and immediately returns HTTP 200 OK to the client. A background thread worker handles SMTP communication.
- **Advantages:** Sub-50ms user response time; SMTP connection drops never roll back successful user registrations.

### Method 3: Distributed Message Queue (RabbitMQ / Apache Kafka)
Messages are published to an AMQP broker and consumed by separate worker microservices.
- **Evaluation:** Ideal for hyper-scale platforms; introduces unnecessary infrastructure complexity for monolithic or standard cloud deployments.

---

## 7. Email Notification Tracking & Audit Methods

Tracks whether notification dispatches succeeded, failed, or encountered delivery errors.

### Method 1: Application Logging (SLF4J / Logback) *(Baseline)*
Log events cleanly to console and file:
```
INFO  c.v.s.EmailService: Successfully sent voter registration confirmation email to voter@gmail.com with Voter ID V1
ERROR c.v.s.EmailService: Failed to send vote confirmation to voter@gmail.com: SMTP connection timeout
```

### Method 2: Database Notification Log (`email_notification_logs`)
Creates a dedicated table recording every dispatched notification:

| Column | Type | Description |
|---|---|---|
| `id` | `BIGSERIAL PK` | Log record identifier |
| `user_id` | `VARCHAR(50)` | Target Voter or Candidate ID |
| `email` | `VARCHAR(150)` | Destination email address |
| `notification_type`| `VARCHAR(60)` | One of the 15 normalized notification types |
| `status` | `VARCHAR(20)` | `SENT`, `FAILED`, `PENDING_RETRY` |
| `error_message` | `TEXT` | Nullable error details if failed |
| `timestamp` | `TIMESTAMP` | Dispatch timestamp |

- **Advantages:** Full historical audit trail; enables administrative UI to inspect notification status.

---

## 8. Email Notification Triggering Methods

How business events notify the notification system.

### Method 1: Direct Service Calls *(Simple & Transparent)*
The business service directly calls `EmailService`:
```java
userRepository.save(voter);
emailService.sendVoterRegistrationEmail(voter);
```
- Highly readable and straightforward to follow in code.

### Method 2: Spring Application Events (`ApplicationEventPublisher`) *(Decoupled)*
The business service emits an event, and an asynchronous listener handles notification:
```java
eventPublisher.publishEvent(new ElectionPublishedEvent(election));
```
- Fully decouples electoral business logic from notification logic.

---

## 9. Email Template & Rendering Methods

How HTML emails are constructed.

### Method 1: Plain Text
Readable text without graphics or styled layouts. Poor branding and low user trust.

### Method 2: Type-Safe String Templates (Java 21 Multiline Blocks) *(Clean & Self-Contained)*
Utilizes Java 21 multiline string blocks (`"""..."""`) with formatted parameters.
- **Advantages:** No external template dependencies, self-contained inside `EmailService.java`, responsive HTML with CSS inline styles.

### Method 3: Template Engine (Thymeleaf / FreeMarker)
HTML files stored in `src/main/resources/templates/mail/` parsed dynamically with model attributes.
- **Advantages:** Separates HTML code from Java source code.

---

## 10. Database Architecture Alternatives

How temporary security records (OTPs, reset tokens) and logs are structured:

```
Method A: No New Tables           Method B: Two New Tables          Method C: Three New Tables
+---------------------+           +---------------------+           +---------------------+
| Spring Boot Memory  |           |     PostgreSQL      |           |     PostgreSQL      |
|  - OTPs in JVM Map  |           |  - otp_verifications|           |  - otp_verifications|
|  - Tokens in JVM    |           |  - password_tokens  |           |  - password_tokens  |
+---------------------+           +---------------------+           |  - email_logs       |
                                                                    +---------------------+
```

### Comparison:

| Characteristic | Method A (In-Memory) | Method B (2 Tables) | Method C (3 Tables) | Method D (Postgres + Redis) |
|---|:---:|:---:|:---:|:---:|
| **Survives Server Restart** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Multi-Instance Ready** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Audit Compliance** | ❌ Minimal | ✅ Strong | ✅ Comprehensive | ✅ Moderate |
| **Extra Infrastructure** | None | None (Uses Postgres) | None (Uses Postgres) | Requires Redis |
| **Implementation Complexity**| Low | Balanced | Balanced | High |

---

## 11. Understanding the Three Database Tables

These tables do **not** transmit emails; they provide relational integrity, rate limiting, and security tracking:

### 1. `otp_verifications` (OTP Verification Subsystem)
Enforces the 30-second validity window, 5 attempts per OTP, and rolling hourly limits.
```sql
CREATE TABLE otp_verifications (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    email VARCHAR(150) NOT NULL,
    otp_hash VARCHAR(64) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    payload TEXT,
    attempts INT DEFAULT 0,
    resend_count INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    is_invalidated BOOLEAN DEFAULT FALSE
);
```

### 2. `password_reset_tokens` (Password Recovery Subsystem)
Enforces 1-minute expiration and single-use security for password recovery links.
```sql
CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    used BOOLEAN DEFAULT FALSE
);
```

### 3. `email_notification_logs` (Optional Email Ledger)
Tracks every notification dispatched across all 15 types for administrative transparency.
```sql
CREATE TABLE email_notification_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    email VARCHAR(150) NOT NULL,
    notification_type VARCHAR(60) NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 12. All Methods at a Glance

| Architectural Requirement | Available Methods | Recommended for SecureVote |
|---|---|---|
| **Email Delivery** | Gmail SMTP, Amazon SES, SendGrid, Brevo, Mailgun | **Gmail SMTP** *(Configured with App Password)* |
| **OTP Generation** | Java SecureRandom, UUID, TOTP, Third-party provider | **Java SecureRandom** *(Pattern: `Bv3Ch8`)* |
| **OTP Storage** | In-Memory (HashMap), PostgreSQL, Redis | **PostgreSQL (`otp_verifications`)** |
| **OTP Verification** | Backend Spring Boot, Frontend React, Third-party | **Backend Spring Boot** *(Strict Server Validation)* |
| **Forgot Password** | 1-minute Reset Link, Email OTP, Third-party Auth | **1-Minute Single-Use Secure Reset Link** |
| **Email Processing** | Synchronous, Asynchronous, Message Queue | **Asynchronous (`CompletableFuture` / `@Async`)** |
| **Notification Triggering** | Direct Service Calls, Spring Events, Message Queue | **Spring Application Events / Direct Service Calls** |
| **Email Tracking** | Logback logs, PostgreSQL table, Provider dashboard | **Application Logs + PostgreSQL Table** |
| **Email Templates** | Plain Text, Inline HTML Blocks, Thymeleaf | **Branded Responsive HTML Templates** |
| **Data Cleanup** | Scheduled cron cleaner (`@Scheduled`), Manual | **Spring `@Scheduled` Auto-Cleanup Job** |

---

## 13. Four Complete Implementation Combinations

### Option 1 — Basic (Development & Demonstrations)
- **Transport:** Gmail SMTP
- **OTP Generator:** Java `SecureRandom`
- **Storage:** Java `ConcurrentHashMap` in memory
- **Forgot Password:** 1-minute reset link in memory
- **Processing:** Asynchronous thread pool
- **Database Tables:** 0 new tables

### Option 2 — Database-Backed (Balanced & Recommended)
- **Transport:** Gmail SMTP (`vasu.demoprojects@gmail.com`)
- **OTP Generator:** Java `SecureRandom` (6-char pattern `Bv3Ch8`)
- **Storage:** PostgreSQL (`otp_verifications`)
- **Forgot Password:** PostgreSQL (`password_reset_tokens`) with 1-minute expiry
- **Processing:** Asynchronous non-blocking (`CompletableFuture`)
- **Database Tables:** 2 tables (`otp_verifications`, `password_reset_tokens`)
- **Tracking:** Application logs via SLF4J / Logback

### Option 3 — Database-Backed with Full Audit History
- **Same as Option 2**, with the addition of `email_notification_logs` to maintain permanent records of all dispatched notifications.
- **Database Tables:** 3 tables (`otp_verifications`, `password_reset_tokens`, `email_notification_logs`).

### Option 4 — High-Concurrency Cloud Enterprise
- **Transport:** Amazon SES
- **Storage:** Redis (with native 30s / 60s TTL)
- **Queue:** RabbitMQ / AWS SQS for notification distribution
- **Database Tables:** Existing PostgreSQL for permanent election data; Redis for security tokens.

---

## 14. Architectural Recommendation for SecureVote

### **Recommended Architecture: Option 2 (Database-Backed with Two Tables)**

#### Why this is the optimal choice for your Online Voting System:
1. **Leverages Existing Stack**: Utilizes your running PostgreSQL 16/18 database with zero additional servers, cloud subscriptions, or Redis instances to maintain.
2. **Persistence Guarantee**: If the backend restarts or deploys a new version while a user is waiting for their 30-second OTP, the verification session is preserved in PostgreSQL.
3. **Strict Rate Limiting**: PostgreSQL SQL queries can easily calculate rolling 60-minute window limits:
   ```sql
   SELECT COUNT(*) FROM otp_verifications 
   WHERE email = ? AND created_at >= NOW() - INTERVAL '1 HOUR';
   ```
4. **Clean Decoupling**: Database tables store hashes and metadata; user passwords and plain OTPs are never stored or logged.
5. **Instant User Response**: Non-blocking asynchronous dispatch keeps registration and voting API response times under 50 milliseconds.

---

## 15. Architecture Selection Matrix

Review the choices below to confirm or tailor your preferred architecture:

| Choice Category | Selected Option |
|---|---|
| **1. Email Delivery** | `Gmail SMTP (vasu.demoprojects@gmail.com)` |
| **2. OTP Generation** | `Java SecureRandom (6 characters: Bv3Ch8)` |
| **3. OTP Storage** | `PostgreSQL (otp_verifications table)` |
| **4. Forgot Password** | `1-Minute Secure Single-Use Reset Link` |
| **5. Email Processing** | `Asynchronous (Non-blocking CompletableFuture)` |
| **6. Notification Triggering** | `Direct Service Calls & Spring Events` |
| **7. Email Templates** | `Branded Responsive HTML Templates` |
| **8. Database Schema** | `2 New Tables (otp_verifications + password_reset_tokens)` |

### Fixed Security Invariants (Guaranteed Across All Options):
- **OTP Format:** Exactly 6 characters adhering to pattern `[A-Z][a-z][0-9][A-Z][a-z][0-9]`.
- **OTP Expiration:** Exactly **30 seconds**.
- **Resend Cooldown:** **30 seconds** countdown timer.
- **Max Resends:** Maximum **5 resends per rolling hour**.
- **Incorrect Attempts:** Maximum **5 attempts per OTP** before permanent invalidation.
- **Hourly Verification Cap:** Maximum **10 verification attempts per rolling hour**.
- **Reset Link Expiry:** Exactly **1 minute**, single-use, cryptographic SHA-256 hash storage.
- **All 15 Email Types:** Account, Election, Candidate, Voter, and Security notifications fully enabled.
