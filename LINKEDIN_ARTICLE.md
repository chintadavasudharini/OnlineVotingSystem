# 🗳️ Architecting SecureVote: Building a Zero-Trust, Auditable Electronic Voting Platform with Java 21, Spring Boot 3, PostgreSQL & React 19

> **Author:** Chintada Vasudharini  
> **Platform / Dossier:** SecureVote — Enterprise Online Voting System  
> **Live Web Application:** [https://securevote-onlinevotingsystem.vercel.app/](https://securevote-onlinevotingsystem.vercel.app/)  
> **Backend Cloud API:** [https://securevote-onlinevotingsystem-backend.onrender.com](https://securevote-onlinevotingsystem-backend.onrender.com)  
> **GitHub Repository:** [https://github.com/chintadavasudharini/OnlineVotingSystem](https://github.com/chintadavasudharini/OnlineVotingSystem)  

---

## 📌 Executive Summary

Digital democracy requires far more than modern UI forms and basic CRUD APIs. It demands **mathematical guarantees of single-vote integrity**, **uncompromising ballot privacy**, **strict constitutional candidate lineage**, and **real-time auditable verification**.

Over the past few months, I architected and deployed **SecureVote**—an enterprise-grade electronic voting and electoral governance system engineered with **Java 21 LTS**, **Spring Boot 3.3.4**, **PostgreSQL 16/18**, and **React 19 (TypeScript + Vite 8)**.

In this article, I share the deep architectural principles, security invariants, payment orchestration with **Razorpay**, asynchronous **Gmail SMTP** notification engine, and the **cryptographic OTP & password recovery subsystem** that power this platform.

---

## ⚡ The Four Hard Problems of Digital Balloting

Every electronic voting system must address four non-negotiable security challenges:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE DEMOCRATIC GUARANTEES                      │
├──────────────────────────────┬─────────────────────────────────────────┤
│  1. Zero Double-Voting       │  2. Absolute Ballot Secrecy             │
│  Physical DB composite locks │  Voter identity dissociated from vote   │
├──────────────────────────────┼─────────────────────────────────────────┤
│  3. Constitutional Lineage   │  4. Temporal Determinism                │
│  Candidate age >= 25 & Voter │  Time-locked state machine              │
└──────────────────────────────┴─────────────────────────────────────────┘
```

1. **How do you guarantee a voter casts exactly one ballot under massive concurrent traffic?**
2. **How do you verify vote submission while preserving absolute ballot secrecy?**
3. **How do you prevent fraudulent, phantom candidate nominations?**
4. **How do you ensure election phases cannot be retroactively altered or manipulated?**

Here is how SecureVote resolves each challenge at the engineering level.

---

## 1. Mathematical Single-Vote Integrity: The Database Barrier

Most traditional applications rely on application-level checks:
```java
// Vulnerable to race conditions under concurrent requests
if (!hasVoted(voterId, electionId)) {
    saveVote(voterId, candidateId);
}
```
Under concurrent traffic (e.g., submitting from multiple tabs or bots), two simultaneous threads can pass the `if` check simultaneously, causing duplicate ballots.

In **SecureVote**, I pushed the single-vote invariant down to the **PostgreSQL relational engine**:
```sql
CREATE TABLE votes (
    id VARCHAR(60) PRIMARY KEY,
    election_id VARCHAR(50) NOT NULL,
    voter_id VARCHAR(50) NOT NULL,
    candidate_id VARCHAR(50) NOT NULL,
    voted_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT uk_votes_election_voter UNIQUE (election_id, voter_id)
);
```
Even if multiple concurrent HTTP requests bypass the application layer, the PostgreSQL compound unique constraint `UNIQUE (election_id, voter_id)` guarantees that exactly **one** ballot succeeds at the storage layer while rejecting all subsequent attempts with a database constraint violation.

---

## 2. Ballot Secrecy & Confirmation Receipts

In electronic voting, the system must confirm that a ballot was cast without ever exposing *who* the citizen voted for.

- When a citizen casts a ballot, an asynchronous notification is dispatched to their verified email.
- **Included:** Voter Name, Election ID, Election Name, and Timestamp.
- **Strictly Excluded:** The selected candidate ID, candidate name, or preference is **never** included in email notifications, API response logs, or audit records.
- In the public results tally, individual voter identities are completely stripped, displaying only certified aggregate tallies.

---

## 3. Constitutional Candidate Lineage & Razorpay Nomination Security

To eliminate fictitious or unauthorized candidacies:
1. **Constitutional Age Separation:** Voters must be $\ge 18$ years old. Candidates must be $\ge 25$ years old.
2. **Verified Lineage:** A candidate account can only be elevated from an existing, verified voter identity (`voter_id`), establishing clear citizenship lineage.
3. **Nomination Security Deposit (₹100 via Razorpay):**
   - Candidates file their campaign manifesto (Title, Vision Statement, and Key Promises).
   - Before the nomination is accepted, the candidate pays a mandatory ₹100 security deposit (`10000` paise).
   - The backend validates the payment signature server-side using **HMAC-SHA256**:
     $$\text{Signature} = \text{HMAC-SHA256}(\text{order\_id} \parallel "|" \parallel \text{payment\_id}, \text{secret\_key})$$
   - Only upon cryptographic match is the candidate nomination certified and published.

```
Candidate Enters Manifesto ──► POST /api/payment/create-order ──► Razorpay Order Generated
                                                                        │
                                                                        ▼
Candidate Pays via UPI/Card ◄── Razorpay Modal Opens ◄────────────── UI Receives Key ID
            │
            ▼
POST /api/payment/verify ──► Backend Validates HMAC-SHA256 ──► Nomination Confirmed!
```

---

## 4. Deterministic Temporal Election State Machine

Election lifecycles are governed by atomic timestamp boundaries rather than manual admin triggers:

```
[Admin Creates Election]
           │
           ▼
      [ UPCOMING ] ──────────► Candidate Registration Not Started
           │
           ▼ (Current Time >= registrationStart)
  [ REGISTRATION_OPEN ] ─────► Candidates File Manifestos & Pay ₹100
           │
           ▼ (Current Time >= votingStart)
    [ VOTING_OPEN ] ─────────► Citizens Cast Ballots; Edits/Deletes Locked
           │
           ▼ (Current Time > votingEnd)
     [ COMPLETED ] ──────────► Balloting Concluded; Tallies Verified
           │
           ▼ (Admin Certifies Results)
 [ RESULTS_PUBLISHED ] ──────► Public Certified Winner & Tie Breakdown
```

### Certified Winner & Tie Resolution
When results are certified, the platform dynamically computes candidate rankings:
- 🟩 **Elected Candidate:** A single candidate with the highest vote count is showcased in a dedicated **green victory card**.
- 🟨 **Result: Tie:** When two or more candidates share the identical highest vote count, the system dynamically isolates them in a **yellow tie card**, showing each candidate with their exact vote count.

---

## 5. Centralized Asynchronous Email Notification Engine

To keep citizen onboarding and voting lightning-fast, email delivery is executed **asynchronously** using Spring Boot Mail and **Gmail SMTP over TLS 587** using Google App Passwords:

```java
CompletableFuture.runAsync(() -> {
    try {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom("SecureVote <vasu.demoprojects@gmail.com>");
        helper.setTo(voter.getEmail());
        helper.setSubject("🗳️ Welcome to SecureVote — Voter Registration Confirmed (" + voter.getId() + ")");
        helper.setText(buildVoterEmailTemplate(voter), true);
        mailSender.send(message);
    } catch (Exception ex) {
        logger.error("Failed to dispatch email: {}", ex.getMessage());
    }
});
```

### Why Asynchronous Delivery Matters:
- **Instantaneous HTTP Responses:** Registration and voting requests respond in **< 50 milliseconds**.
- **Transaction Isolation:** If the external SMTP relay experiences network jitter, the user's database registration is never rolled back.

---

## 6. Cryptographic OTP Verification & Password Recovery

The platform includes a dedicated security subsystem for authentication and recovery:

### 30-Second Cryptographic OTP
- **Custom Pattern:** Exactly 6 characters adhering to:
  $$\text{OTP} = [A\text{-}Z][a\text{-}z][0\text{-}9][A\text{-}Z][a\text{-}z][0\text{-}9] \quad (\text{e.g., } \texttt{Bv3Ch8})$$
  Generated using `java.security.SecureRandom`.
- **Strict Expiry:** Exactly **30 seconds** with an interactive countdown UI (`00:30` &rarr; `00:00` &rarr; `OTP Expired`).
- **Resend Security:** 30-second cooldown, max 5 resends/hour.
- **Brute-Force Shield:** Maximum 5 incorrect attempts before the OTP is permanently invalidated.

### 1-Minute Single-Use Password Reset
- Generates a 32-byte cryptographic token.
- Stored as a **SHA-256 hash** in PostgreSQL (`password_reset_tokens`).
- Strictly valid for **1 minute**.
- Single-use only: invalidated immediately upon password update. Zero plain passwords or tokens are ever emailed or logged.

---

## 7. Demographic Inclusivity: Gender Recognition

To support complete citizen representation:
- The voter registration form includes a verified **Gender** selection (`Male`, `Female`, `Other`) placed directly after the Date of Birth.
- Validated via Zod on the client and stored in the PostgreSQL `users` table (`gender VARCHAR(20)`).
- Reflected across citizen profiles and the Super Administrator's voter governance registry.

---

## 8. Role-Isolated Authentication Architecture

To prevent credential confusion and cross-role privilege escalation:
- **Voters:** Authenticate strictly via `/login?role=voter` using their auto-generated **Voter ID** (`V1`, `V2`...).
- **Candidates:** Authenticate strictly via `/login?role=candidate` using their auto-generated **Candidate ID** (`C1`, `C2`...).
- **Super Administrator:** Completely isolated login portal at `/admin` (`admin` / `admin`).
- Cross-persona submissions (e.g., trying to use Candidate credentials on the Voter login form) are explicitly rejected with explanatory security warnings.

---

## 9. Comprehensive System Architecture & Tech Stack

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT TIER                                        |
|                          React 19 + TypeScript (Vite 8)                               |
|  +---------------------------+ +----------------------------+ +--------------------+  |
|  |     Voter Dashboard       | |      Candidate Portal      | |    Admin Console   |  |
|  |   - Identity Card         | |    - Nomination Filing     | |   - Schedule Phase |  |
|  |   - Ballot Cast UI        | |    - Razorpay Checkout     | |   - Audit Monitor  |  |
|  |   - Certified Results     | |    - Live Campaign Tally   | |   - Certify Winner |  |
|  +---------------------------+ +----------------------------+ +--------------------+  |
+-------------------------------------------+-------------------------------------------+
                                            | HTTPS / JSON (Bearer JWT)
                                            v
+---------------------------------------------------------------------------------------+
|                        SPRING BOOT 3.3.4 BACKEND (DOCKER)                             |
|                                                                                       |
|  [Security Tier]                                                                      |
|    SecurityFilterChain ──► JwtAuthenticationFilter ──► Delegated Access Interceptor   |
|                                                                                       |
|  [REST API Controllers]                                                               |
|    AuthController ──► ElectionController ──► CandidateController ──► VoteController   |
|                                                                                       |
|  [Transactional Service Layer]                                                        |
|    AuthService ──► ElectionService ──► CandidateService ──► PaymentService            |
|    VoteService ──► AuditService ──► EmailService (Async SMTP Engine)                  |
|                                                                                       |
|  [Data Access Layer]                                                                  |
|    Spring Data JPA Repositories (Hibernate 6.5.3 ORM)                                  |
+-------------------------------------------+-------------------------------------------+
                                            | HikariCP Connection Pool (JDBC)
                      +---------------------+---------------------+---------------------+
                      |                                           |                     |
                      v                                           v                     v
+-------------------------------------------+   +-----------------------+   +-----------------------+
|      PERSISTENCE TIER (PostgreSQL)        |   |    RAZORPAY GATEWAY   |   |   GMAIL SMTP SERVER   |
|  - users (RBAC, Gender & Lineage)         |   |  - Orders API         |   |  - TLS 587 Transport  |
|  - elections (Temporal Lifecycles)        |   |  - Client Checkout    |   |  - App Passwords      |
|  - candidate_registrations (Deposits)     |   |  - HMAC Signature     |   |  - Async Dispatch     |
|  - votes (UNIQUE: election_id, voter_id)  |   +-----------------------+   +-----------------------+
|  - audit_logs (Immutable Ledger)          |
+-------------------------------------------+
```

### Complete Technology Stack:
- **Backend:** Java 21 LTS, Spring Boot 3.3.4, Spring Security 6, Jakarta EE 10, Spring Data JPA, Hibernate 6, JJWT (0.12.6), Spring Mail.
- **Frontend:** React 19.2.8, TypeScript 5, Vite 8.3.1, Zustand 5.0.15 (with local storage hydration), Zod 4.6.5, Lucide React icons.
- **Database:** PostgreSQL 16/18 with relational integrity constraints and immutable audit ledger (`audit_logs`).
- **Cloud Infrastructure:** Docker multi-stage containerization, Render.com backend hosting, Vercel frontend edge network.

---

## 10. Immutable Audit Ledger & Compliance

Every security-sensitive state mutation is recorded in the PostgreSQL `audit_logs` table:
- **Log Attributes:** `id`, `user_id`, `role`, `action`, `details`, and microsecond `timestamp`.
- Covers every citizen registration, candidate nomination, Razorpay transaction ID, vote submission, and results certification.
- Provides regulatory compliance and transparent auditability without violating ballot privacy.

---

## 11. Key Takeaways & Architectural Lessons

1. **Push critical invariants to the database:** In-memory checks fail under concurrency. Let your database unique constraints be the final arbiter of single-vote integrity.
2. **Decouple third-party I/O from transactions:** Never send emails or external HTTP calls synchronously inside a database transaction. Use async workers to keep response times sub-50ms.
3. **Model real-world constraints cleanly:** Constitutional age requirements, candidate voter lineage, and time-locked election states transform an ordinary web app into a resilient institutional system.

---

## 🌐 Live Demos & Source Code

- **Live Web Client:** [https://securevote-onlinevotingsystem.vercel.app/](https://securevote-onlinevotingsystem.vercel.app/)
- **Live Backend REST API:** [https://securevote-onlinevotingsystem-backend.onrender.com](https://securevote-onlinevotingsystem-backend.onrender.com)
- **GitHub Repository:** [https://github.com/chintadavasudharini/OnlineVotingSystem](https://github.com/chintadavasudharini/OnlineVotingSystem)
- **Author & Architect:** [Chintada Vasudharini](https://github.com/chintadavasudharini)

*Feel free to star the repository, explore the code, and share your thoughts in the comments!*

---

# 📱 Ready-to-Post LinkedIn Feed Summary (Copy & Paste)

```markdown
🗳️ Excited to share my latest enterprise project: SecureVote — a Zero-Trust, Auditable Electronic Voting Platform!

Building an electronic voting platform requires solving some of the toughest engineering challenges:
• Mathematical single-vote guarantee under high concurrency
• Absolute ballot secrecy with audit confirmation receipts
• Real-time candidate verification with Razorpay deposit verification (HMAC-SHA256)
• Deterministic, time-locked election lifecycle state machines
• Asynchronous email notifications & 30-second cryptographic OTPs

💡 Key Architectural Highlights:
✅ Zero Double-Voting: Enforced at the PostgreSQL relational engine via composite unique constraints UNIQUE(election_id, voter_id).
✅ Constitutional Lineage: Candidates must be verified citizens (>= 25 years) linked to an active voter identity.
✅ Financial Proof of Candidacy: ₹100 nomination security deposit verified server-side via Razorpay REST API & HMAC signatures.
✅ Async Email Engine: Branded HTML onboarding & receipts dispatched via Gmail SMTP (TLS 587) with non-blocking CompletableFuture.
✅ Dynamic Certified Results: Dedicated green cards for single winners and yellow cards for multi-candidate ties.
✅ Demographic Inclusivity: Gender recognition (Male, Female, Other) with complete profile and administrative governance.

🛠️ Tech Stack:
• Backend: Java 21 LTS | Spring Boot 3.3.4 | Spring Security 6 | Spring Data JPA | JJWT
• Frontend: React 19 | TypeScript 5 | Vite 8 | Zustand | Zod
• Database: PostgreSQL 16/18 with immutable audit trails
• Cloud: Docker Multi-Stage | Render.com | Vercel

Check out the full technical dossier and live demo:
🌐 Web App: https://securevote-onlinevotingsystem.vercel.app/
💻 GitHub: https://github.com/chintadavasudharini/OnlineVotingSystem
📖 Full Article: https://www.linkedin.com/pulse/online-voting-system-chintada-vasudharini-wrhic/

#SoftwareEngineering #Java #SpringBoot #ReactJS #TypeScript #PostgreSQL #Docker #FullStack #CyberSecurity #SystemDesign #OpenSource #WebDevelopment
```
