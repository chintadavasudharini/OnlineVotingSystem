# Email Notifications & OTP Implementation --- Methods and Concepts

## Purpose

This document explains the available implementation methods for the
Email Notifications, OTP Verification, and Password Recovery system in
the Online Voting System. It is intended to help select an architecture
before modifying the existing application.

The existing project stack is: - Frontend: React 19, TypeScript, Vite -
Backend: Spring Boot 3, Java 21 - Database: PostgreSQL

The security requirements already selected are listed in the final
section.

------------------------------------------------------------------------

# 1. Email Delivery Methods

Email delivery is the service that sends messages from the Spring Boot
application to users' inboxes. Choose one primary provider.

## 1.1 Gmail SMTP

Uses a Gmail account and Google App Password to send emails through
Google's SMTP server.

**How it works** 1. Create or select a Gmail account for the
application. 2. Enable 2-Step Verification. 3. Generate a Google App
Password. 4. Configure Spring Boot with Gmail SMTP settings. 5. Send
emails through the SMTP server.

**Advantages** - Easy to configure. - No separate email delivery
platform is required. - Useful for development and small projects.

**Disadvantages** - Gmail sending limits and account policies apply. -
Not designed for high-volume transactional email delivery.

## 1.2 Amazon Simple Email Service (SES)

A cloud-based email delivery service from AWS.

**Advantages** - Suitable for production email delivery. - Scales to
larger email volumes. - Supports delivery monitoring and bounce
handling.

**Disadvantages** - Requires AWS configuration. - Sender/domain
verification and production access may be required. - Pricing depends on
usage and configuration.

## 1.3 SendGrid

A transactional email platform offering SMTP and APIs.

**Advantages** - Email templates and delivery analytics. - Supports
transactional notifications. - Suitable for application email delivery.

**Disadvantages** - Requires account and sender verification. - Plans
and sending limits apply.

## 1.4 Brevo

Provides transactional email APIs, SMTP and templates.

**Advantages** - Transactional email support. - Templates and delivery
tracking. - Useful for OTP and notification emails.

**Disadvantages** - Requires account and sender configuration. - Sending
limits depend on the plan.

## 1.5 Mailgun

A transactional email service designed for application email delivery.

**Advantages** - Email APIs and domain authentication. - Delivery
tracking. - Useful for larger applications.

**Disadvantages** - Requires account and domain configuration. - Pricing
depends on the plan.

**Concept:** Gmail SMTP, Amazon SES, SendGrid, Brevo and Mailgun perform
the same main job: delivering emails. Usually, one primary provider is
selected.

------------------------------------------------------------------------

# 2. OTP Generation Methods

An OTP (One-Time Password) is a temporary code that a user enters to
verify an email address or authorize an account operation.

## 2.1 Java SecureRandom

Java's cryptographically secure random generator can generate the custom
six-character OTP.

Required example: `Bv3Ch8`.

Required pattern: - Uppercase letter. - Lowercase letter. - Number. -
Repeat the pattern twice.

**Advantages** - Built into Java. - No external API required. - Full
control over the OTP format. - Suitable for custom email OTPs.

## 2.2 UUID

UUID means Universally Unique Identifier. It is useful for unique
identifiers and tokens, but a standard UUID is not the best choice for
generating this custom six-character OTP.

## 2.3 Third-party OTP generation

An external authentication provider generates OTPs and may manage
delivery and verification.

**Advantages** - Less OTP-generation code to maintain. - May provide
rate limiting and verification APIs.

**Disadvantages** - External service dependency. - Possible usage
charges. - The exact OTP format and 30-second validity may not be
supported.

## 2.4 TOTP

TOTP means Time-Based One-Time Password. It generates codes from a
shared secret and a time interval, commonly for authenticator
applications such as Google Authenticator or Microsoft Authenticator.

TOTP is different from the requested custom email OTP. Java SecureRandom
is a better fit for the specified email OTP format.

------------------------------------------------------------------------

# 3. OTP and Reset-Token Storage Methods

After generating an OTP or reset token, the backend must retain enough
information to validate it later.

## 3.1 Java in-memory storage

Uses Java data structures such as `ConcurrentHashMap`.

Example temporary record: - Account/email reference. - OTP hash. -
Expiry time. - Purpose. - Incorrect-attempt count.

**Advantages** - No new database tables. - No Redis service. - Simple
for local development and a single backend instance.

**Disadvantages** - Data is lost when Spring Boot restarts. - Not shared
between multiple backend instances. - Requires cleanup of expired
entries.

## 3.2 PostgreSQL storage

Stores OTP and reset-token metadata in the existing PostgreSQL database.

Possible table: `otp_verifications`.

Possible table: `password_reset_tokens`.

**Advantages** - Records survive backend restarts. - Uses the existing
database. - Can be shared by multiple backend instances.

**Disadvantages** - More database writes. - Expired records need
cleanup. - Requires schema and migration changes.

## 3.3 Redis storage

Redis is an in-memory data store commonly used for caching and temporary
information. It supports TTL (Time To Live), which automatically expires
keys.

Example: - OTP hash with a 30-second TTL. - Reset-token hash with a
1-minute TTL. - Resend counters with a 1-hour TTL.

**Advantages** - Automatic expiry through TTL. - Fast access. - Shared
storage across multiple backend instances. - Useful for rate limiting.

**Disadvantages** - Requires another service. - Adds deployment and
configuration work. - Redis availability must be managed.

## 3.4 Third-party OTP storage

The OTP provider manages the verification session and expiry.

**Advantages** - Less OTP storage logic in the backend. - Provider
manages verification sessions.

**Disadvantages** - External service dependency. - Less control over
internal implementation. - Exact expiry and OTP-format requirements must
be supported.

------------------------------------------------------------------------

# 4. OTP Verification Methods

Generation and verification are separate operations.

## 4.1 Backend verification

Spring Boot validates: - Whether the entered OTP matches the stored
hash. - Whether it has expired. - Whether it has already been used. -
Whether attempt limits have been exceeded. - Whether it belongs to the
correct account and purpose.

The frontend sends the entered OTP to the backend.

**Recommended:** Backend verification must be authoritative.

## 4.2 Frontend verification

React checks an OTP locally in the browser.

This must not be the only verification method. Users can modify browser
code and bypass frontend checks.

Frontend countdowns and validation can improve usability, but the
backend must enforce security rules.

## 4.3 Third-party verification

An external provider validates the OTP and returns the verification
result to the backend.

The backend must still authorize account creation, password changes and
email changes.

------------------------------------------------------------------------

# 5. Forgot Password Methods

## 5.1 Secure email reset link

Flow: 1. User enters their registered email. 2. Backend generates a
secure random token. 3. Backend stores the token hash and expiry
metadata. 4. Email provider sends a reset link. 5. User opens the link
and enters a new password. 6. Backend validates the token. 7. Backend
updates the password hash. 8. Backend invalidates the token immediately.

**Advantages** - Straightforward user experience. - Supports expiry and
single-use enforcement. - No need to enter a separate OTP.

## 5.2 Email OTP password reset

Flow: 1. User enters their registered email. 2. Backend sends an OTP. 3.
User verifies the OTP. 4. User enters a new password. 5. Backend updates
the password.

**Advantages** - Reuses the OTP verification system. - No reset URL is
needed.

**Disadvantages** - Requires OTP entry and verification screens.

## 5.3 Third-party authentication

An identity provider manages password recovery.

**Advantages** - Provider manages recovery workflows. - Can reduce
custom authentication code.

**Disadvantages** - Provider dependency. - May require changes to the
existing authentication architecture.

------------------------------------------------------------------------

# 6. Email Processing Methods

These methods determine when and how emails are sent relative to the
main application request.

## 6.1 Synchronous sending

The backend sends the email during the API request.

Flow: 1. User performs an operation. 2. Backend performs the operation.
3. Backend sends the email. 4. API response is returned.

**Advantages** - Easy to implement. - Simple to debug.

**Disadvantages** - Email delays can slow API responses. - SMTP
availability affects request duration.

## 6.2 Asynchronous sending

The backend schedules email delivery separately from the main API
request.

Flow: 1. User performs an operation. 2. Backend saves the successful
operation. 3. Backend schedules email delivery. 4. API response can
return without waiting for delivery.

**Advantages** - Faster API responses. - Separates business logic from
email delivery.

**Disadvantages** - Requires error handling. - In-memory background
tasks can lose pending work after a restart.

## 6.3 Message queue

Uses systems such as RabbitMQ, Apache Kafka or Amazon SQS.

Flow: 1. Backend publishes an email job/event. 2. A worker reads the
job. 3. The worker sends the email. 4. Failed jobs can be retried
according to queue configuration.

**Advantages** - Supports larger notification volumes. - Can provide
durable processing and retries. - Workers can scale independently.

**Disadvantages** - More infrastructure and configuration. - More
implementation complexity.

------------------------------------------------------------------------

# 7. Email Notification Tracking Methods

Tracking is separate from email delivery. It records or reports whether
messages were sent, accepted, delivered, bounced or failed, depending on
the provider's capabilities.

## 7.1 No tracking

Send emails without retaining notification history.

**Advantages:** Minimal storage and implementation.

## 7.2 Application logs

Record email events in application logs, for example: - OTP email send
attempt. - Email provider error. - Notification send success.

Do not log OTPs, reset tokens, passwords or SMTP credentials.

## 7.3 PostgreSQL notification log

Possible table: `email_notification_logs`.

Example fields: - Recipient/user reference. - Notification type. -
Subject. - Status. - Created timestamp.

**Advantages** - Persistent history. - Easier troubleshooting. - Can
support retry workflows.

**Disadvantages** - Additional database storage. - Requires retention
and cleanup policies.

## 7.4 Email provider dashboard

Some providers offer dashboards showing: - Sent messages. - Delivery
status. - Bounces. - Spam complaints. - Failed messages.

This can reduce the need to store detailed email history in PostgreSQL.

------------------------------------------------------------------------

# 8. Email Notification Triggering Methods

These methods determine how an application event triggers an email.

## 8.1 Direct service calls

After a successful operation, a Spring Boot service calls the
EmailService.

Example:

``` java
electionService.createElection();
emailService.sendNewElectionEmail();
```

**Advantages** - Simple. - Easy to understand.

**Disadvantages** - Business services become coupled to email
functionality. - Email failure handling must be designed carefully.

## 8.2 Spring application events

The backend publishes an event after an operation, and an event listener
handles the notification.

Example:

``` text
ElectionCreatedEvent
       |
       v
Email Notification Listener
       |
       v
Send New Election Email
```

**Advantages** - Separates business logic from notification logic. -
Easier to maintain. - Supports asynchronous listeners.

**Disadvantages** - Requires event classes and listeners. - Ordinary
in-memory events are not durable across restarts.

## 8.3 Message-driven events

The backend publishes events to a durable message queue.

**Advantages** - Better for large systems. - Supports independent
workers and retries. - Can provide durable processing.

**Disadvantages** - More infrastructure and complexity.

------------------------------------------------------------------------

# 9. Email Template Methods

## 9.1 Plain-text emails

Simple text messages without HTML formatting.

Example:

``` text
Subject: Account Created Successfully

Hello,

Your Voter account has been created successfully.

Thank you.
```

## 9.2 HTML email templates

Professional emails with: - Website logo. - Header and footer. - OTP
displayed prominently. - Expiry information. - Responsive layout.

## 9.3 Thymeleaf HTML templates

Thymeleaf is a Java template engine that can insert dynamic values into
reusable HTML email templates.

Example:

``` html
<p>Hello <span th:text="${name}"></span></p>
<p>Your OTP is <span th:text="${otp}"></span></p>
```

**Recommendation:** Thymeleaf with reusable HTML email templates.

------------------------------------------------------------------------

# 10. Database Architecture Methods

These are different ways to store OTPs, reset tokens and email history.

## Option A: No new PostgreSQL tables

Use Java in-memory storage for OTP hashes and reset-token hashes.

-   Existing PostgreSQL tables remain unchanged.
-   OTP and reset data are temporary in application memory.
-   No email notification log table.

**Limitation:** Data disappears on backend restart and is not shared
between backend instances.

## Option B: Two new PostgreSQL tables

Create: 1. `otp_verifications` 2. `password_reset_tokens`

Do not create an email notification log.

**Advantages** - OTP and reset records survive restarts. - No Redis
service. - No persistent email history.

**Disadvantages** - Requires expired-record cleanup. - Adds database
writes.

## Option C: Three new PostgreSQL tables

Create: 1. `otp_verifications` 2. `password_reset_tokens` 3.
`email_notification_logs`

**Advantages** - Persistent OTP and reset-token records. - Email history
and troubleshooting information.

**Disadvantages** - More storage. - Requires retention and cleanup
policies.

## Option D: PostgreSQL + Redis

-   PostgreSQL stores permanent application data.
-   Redis stores temporary OTP hashes, resend counters, verification
    attempts and reset-token hashes.
-   Redis TTL automatically expires temporary records.

**Advantages** - Automatic expiry. - Fast temporary data access. -
Shared storage across backend instances.

**Disadvantages** - Requires another service. - Adds deployment and
maintenance work.

------------------------------------------------------------------------

# 11. Complete Architecture Combinations

## Option 1: Basic

-   Gmail SMTP.
-   Java SecureRandom.
-   In-memory OTP storage.
-   In-memory reset-token storage.
-   Backend verification.
-   Synchronous email.
-   No new database tables.

Suitable for local development and demonstrations.

## Option 2: Database-based

-   Gmail SMTP.
-   Java SecureRandom.
-   PostgreSQL OTP storage.
-   PostgreSQL reset-token storage.
-   Backend verification.
-   Asynchronous email.
-   Two new tables.
-   Application logs for email errors.

Suitable for a small deployment using the existing PostgreSQL database.

## Option 3: Database + Email History

-   Gmail SMTP or Amazon SES.
-   Java SecureRandom.
-   PostgreSQL OTP storage.
-   PostgreSQL reset-token storage.
-   Backend verification.
-   Spring application events.
-   Thymeleaf HTML templates.
-   Three new tables.

Suitable when persistent verification records and email history are
needed.

## Option 4: Production-oriented

-   Amazon SES.
-   Java SecureRandom.
-   Redis OTP storage.
-   Redis reset-token storage.
-   Backend verification.
-   Asynchronous email.
-   Durable message queue.
-   Provider dashboard for email tracking.
-   Existing PostgreSQL for permanent application data.

Suitable for larger applications and multiple backend instances.

------------------------------------------------------------------------

# 12. Fixed Security Requirements

These requirements remain the same regardless of the selected
architecture.

  Requirement                  Configuration
  ---------------------------- ------------------------------------------------
  OTP length                   6 characters
  OTP format                   Uppercase + lowercase + number, repeated twice
  Example                      `Bv3Ch8`
  OTP validity                 30 seconds
  Resend cooldown              30 seconds
  Maximum resends              5 per hour
  Incorrect attempts           5 per OTP
  Verification attempts        10 per hour
  Forgot Password reset link   1 minute
  Reset link usage             Single-use

Apply OTP verification to: - Voter account creation. - Candidate account
creation. - Update Password. - Update Email.

Apply Forgot Password reset links to both Voters and Candidates.

Enable all 15 agreed email notification types. Never include the
selected candidate or voting choice in vote confirmation emails.

------------------------------------------------------------------------

# 13. Selection Checklist

Select one method in each category. You can leave categories undecided
until the architecture is finalized.

  -----------------------------------------------------------------------
  Category                            Available methods
  ----------------------------------- -----------------------------------
  Email delivery                      Gmail SMTP / Amazon SES / SendGrid
                                      / Brevo / Mailgun

  OTP generation                      Java SecureRandom / Third-party OTP
                                      provider

  OTP and reset storage               In-memory / PostgreSQL / Redis

  Forgot Password                     Secure reset link / Email OTP /
                                      Third-party authentication

  Email processing                    Synchronous / Asynchronous /
                                      Message queue

  Notification triggering             Direct service calls / Spring
                                      events / Message queue events

  Email templates                     Plain text / HTML / Thymeleaf

  Email tracking                      No tracking / Application logs /
                                      PostgreSQL log / Provider dashboard
  -----------------------------------------------------------------------

## Important implementation considerations

-   The backend must enforce OTP and reset-token expiry.
-   Never store plain-text OTPs or reset tokens.
-   Use server-side validation, not frontend-only validation.
-   Do not let email delivery failure roll back a successful vote,
    registration or election operation.
-   Use a durable email queue if reliable retries across backend
    restarts are required.
-   Never log passwords, OTPs, reset tokens or SMTP credentials.
-   Do not introduce additional services or tables unless they serve a
    clear requirement.

**Objective:** Select the implementation architecture first, then
integrate it into the existing React + Spring Boot + PostgreSQL
application without breaking existing functionality.
