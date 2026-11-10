# 🔌 SecureVote — REST API Specification & Endpoint Documentation

> **Platform:** SecureVote — Enterprise Online Voting System  
> **Backend Base URL (Local):** `http://localhost:8080`  
> **Backend Base URL (Live):** `https://securevote-onlinevotingsystem-backend.onrender.com`  
> **Auth Scheme:** Bearer Token (`Authorization: Bearer <JWT>`)  
> **Standard Envelope:** All JSON responses conform to `ApiResponse<T>`  
> **Author:** Chintada Vasudharini  
> **Portfolio:** [https://chintadavasudharini-portfolio.vercel.app/](https://chintadavasudharini-portfolio.vercel.app/)  
> **GitHub Repository:** [https://github.com/chintadavasudharini/OnlineVotingSystem](https://github.com/chintadavasudharini/OnlineVotingSystem)  
> **LinkedIn Article:** [Online Voting System — Enterprise Architecture & System Invariants](https://www.linkedin.com/pulse/online-voting-system-chintada-vasudharini-wrhic/)  

---

## 📑 Table of Contents
1. [Standard API Response Envelope](#1-standard-api-response-envelope)
2. [Root & Discovery Endpoints](#2-root--discovery-endpoints)
3. [Authentication & Registration APIs (`/api/auth`)](#3-authentication--registration-apis-apiauth)
4. [Ephemeral OTP & Password Recovery APIs (`/api/auth`)](#4-ephemeral-otp--password-recovery-apis-apiauth)
5. [Account Security & Credential Management APIs (`/api/auth`)](#5-account-security--credential-management-apis-apiauth)
6. [Election Lifecycle Management APIs (`/api/elections`)](#6-election-lifecycle-management-apis-apielections)
7. [Candidate Nomination & Portfolio APIs (`/api/candidates`)](#7-candidate-nomination--portfolio-apis-apicandidates)
8. [Balloting & Election Results APIs (`/api/votes`)](#8-balloting--election-results-apis-apivotes)
9. [Razorpay Payment Gateway APIs (`/api/payment`)](#9-razorpay-payment-gateway-apis-apipayment)
10. [Voter Directory & Profile APIs (`/api/voters`)](#10-voter-directory--profile-apis-apivoters)
11. [Administrative Audit Logs API (`/api/audit-logs`)](#11-administrative-audit-logs-api-apiaudit-logs)
12. [HTTP Status Codes & Error Handling Matrix](#12-http-status-codes--error-handling-matrix)

---

## 1. Standard API Response Envelope

Every endpoint (except the root discovery endpoint) returns a consistent, structured JSON envelope:

```json
{
  "success": true,
  "message": "Human-readable status or operation summary",
  "data": { ... }
}
```

### Error Envelope
When an error occurs (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`), the error envelope is emitted:

```json
{
  "success": false,
  "message": "Descriptive reason for failure (e.g., 'Double voting prohibited')",
  "data": null
}
```

---

## 2. Root & Discovery Endpoints

### 2.1 System Discovery & Health Check
Returns the active application state, API version, and core discovery endpoints.

- **URL:** `/`
- **Method:** `GET`
- **Auth:** None (Public)
- **Response `200 OK`:**
```json
{
  "application": "SecureVote — Online Voting System API",
  "status": "UP",
  "version": "1.0.0",
  "endpoints": {
    "authLogin": "/api/auth/login",
    "elections": "/api/elections",
    "paymentConfig": "/api/payment/config"
  }
}
```

---

## 3. Authentication & Registration APIs (`/api/auth`)

### 3.1 User Login
Authenticates System Administrators, Citizens (Voters), and Election Candidates. Returns a signed JWT token valid for 24 hours.

- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "userId": "V1",
  "password": "VoterPassword123"
}
```
> Note: For Admin in `dev` profile, use `admin` / `admin`. In `prod`, use configured environment credentials.

- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "V1",
    "name": "Jane Citizen",
    "email": "jane.citizen@example.com",
    "role": "ROLE_VOTER",
    "tokenType": "Bearer"
  }
}
```

---

### 3.2 Direct Voter Registration (Without OTP)
Directly enrolls an eligible voter (primarily utilized during automated testing or offline seeding).

- **URL:** `/api/auth/register-voter`
- **Method:** `POST`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "name": "Jane Citizen",
  "email": "jane.citizen@example.com",
  "password": "SecurePassword123",
  "dob": "2000-05-15",
  "gender": "Female"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Voter registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "userId": "V1",
    "name": "Jane Citizen",
    "email": "jane.citizen@example.com",
    "role": "ROLE_VOTER",
    "tokenType": "Bearer"
  }
}
```

---

### 3.3 Direct Candidate Registration (Without OTP)
Elevates an existing verified voter identity to an eligible candidate.

- **URL:** `/api/auth/register-candidate`
- **Method:** `POST`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "voterId": "V1",
  "name": "Jane Citizen",
  "email": "jane.candidate@example.com",
  "password": "SecurePassword123",
  "dob": "1995-04-10",
  "gender": "Female"
}
```
- **Validation Rules:** Age must be $\ge 25$ years; `voterId` must exist.
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Candidate account created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "userId": "C1",
    "name": "Jane Citizen",
    "email": "jane.candidate@example.com",
    "role": "ROLE_CANDIDATE",
    "tokenType": "Bearer"
  }
}
```

---

## 4. Ephemeral OTP & Password Recovery APIs (`/api/auth`)

All OTPs are 6-character alternating alphanumeric strings with a **strict 30-second TTL** stored exclusively in volatile JVM RAM as SHA-256 hashes.

### 4.1 Initiate Voter Registration OTP
Validates voter demographics, generates an OTP, caches it in RAM, and sends an HTML email.

- **URL:** `/api/auth/register/send-otp`
- **Method:** `POST`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "name": "Jane Citizen",
  "email": "jane.citizen@example.com",
  "password": "SecurePassword123",
  "dob": "2002-08-20",
  "gender": "Female"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "OTP sent to jane.citizen@example.com. Valid for 30 seconds.",
  "data": "OTP sent to jane.citizen@example.com. Valid for 30 seconds."
}
```

---

### 4.2 Complete Voter Registration via OTP
Validates the submitted OTP against the in-memory SHA-256 hash and persists the voter account.

- **URL:** `/api/auth/register/verify-otp`
- **Method:** `POST`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "email": "jane.citizen@example.com",
  "otp": "K4m9P2"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Voter registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "userId": "V2",
    "name": "Jane Citizen",
    "email": "jane.citizen@example.com",
    "role": "ROLE_VOTER",
    "tokenType": "Bearer"
  }
}
```

---

### 4.3 Initiate Candidate Registration OTP
Validates candidacy prerequisites (age $\ge 25$, valid voter link) and sends an OTP.

- **URL:** `/api/auth/candidate-register/send-otp`
- **Method:** `POST`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "voterId": "V1",
  "name": "Jane Citizen",
  "email": "jane.candidate@example.com",
  "password": "SecurePassword123",
  "dob": "1995-04-10",
  "gender": "Female"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "OTP sent to jane.candidate@example.com. Valid for 30 seconds.",
  "data": "OTP sent to jane.candidate@example.com. Valid for 30 seconds."
}
```

---

### 4.4 Complete Candidate Registration via OTP
Validates the OTP and activates the Candidate account (`C1`, `C2`...).

- **URL:** `/api/auth/candidate-register/verify-otp`
- **Method:** `POST`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "email": "jane.candidate@example.com",
  "otp": "B8x2M7"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Candidate registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "userId": "C2",
    "name": "Jane Citizen",
    "email": "jane.candidate@example.com",
    "role": "ROLE_CANDIDATE",
    "tokenType": "Bearer"
  }
}
```

---

### 4.5 Request Forgot-Password Recovery Link
Generates a 32-byte cryptographic single-use reset token valid for **60 seconds**, cached in RAM.

- **URL:** `/api/auth/forgot-password`
- **Method:** `POST`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "email": "jane.citizen@example.com"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Password reset link sent to your email. Valid for 60 seconds.",
  "data": "Password reset link sent to your email. Valid for 60 seconds."
}
```

---

### 4.6 Reset Password via Token
Consumes the single-use reset token and updates the BCrypt hash.

- **URL:** `/api/auth/reset-password`
- **Method:** `POST`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "token": "a1b2c3d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef01",
  "newPassword": "NewSecurePassword456"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in.",
  "data": "Password reset successfully. You can now log in."
}
```

---

## 5. Account Security & Credential Management APIs (`/api/auth`)

These endpoints allow logged-in users to update their credentials backed by multi-step OTP verification.

### 5.1 Send Password Update OTP
- **URL:** `/api/auth/update-password/send-otp`
- **Method:** `POST`
- **Auth:** Bearer Token (`ROLE_VOTER`, `ROLE_CANDIDATE`, `ROLE_ADMIN`)
- **Request Body:**
```json
{
  "oldPassword": "CurrentPassword123",
  "newPassword": "BrandNewPassword789"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "OTP sent to your registered email address.",
  "data": "OTP sent to your registered email address."
}
```

---

### 5.2 Verify Password Update OTP
- **URL:** `/api/auth/update-password/verify-otp`
- **Method:** `POST`
- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "email": "jane.citizen@example.com",
  "otp": "X3n9T1"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Password updated successfully.",
  "data": "Password updated successfully."
}
```

---

### 5.3 Send Email Update OTP
- **URL:** `/api/auth/update-email/send-otp`
- **Method:** `POST`
- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "newEmail": "updated.citizen@example.com"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "OTP sent to your new email address.",
  "data": "OTP sent to your new email address."
}
```

---

### 5.4 Verify Email Update OTP
- **URL:** `/api/auth/update-email/verify-otp`
- **Method:** `POST`
- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "email": "updated.citizen@example.com",
  "otp": "V9k2B4"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Email address updated successfully.",
  "data": "Email address updated successfully."
}
```

---

## 6. Election Lifecycle Management APIs (`/api/elections`)

### 6.1 List All Elections
Returns all elections with dynamically calculated temporal lifecycle states (`UPCOMING`, `REGISTRATION_OPEN`, `VOTING_OPEN`, `COMPLETED`, `RESULTS_PUBLISHED`).

- **URL:** `/api/elections`
- **Method:** `GET`
- **Auth:** None (Public)
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Elections retrieved",
  "data": [
    {
      "id": "E1",
      "title": "General Student Council Election 2026",
      "description": "Annual elections for university student representation.",
      "registrationStart": "2026-11-01T09:00:00",
      "registrationEnd": "2026-11-05T17:00:00",
      "votingStart": "2026-11-08T08:00:00",
      "votingEnd": "2026-11-12T18:00:00",
      "status": "VOTING_OPEN",
      "resultsPublished": false,
      "candidateCount": 4,
      "totalVotesCast": 142
    }
  ]
}
```

---

### 6.2 Get Election by ID
- **URL:** `/api/elections/{id}`
- **Method:** `GET`
- **Auth:** None (Public)
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Election retrieved",
  "data": {
    "id": "E1",
    "title": "General Student Council Election 2026",
    "description": "Annual elections for university student representation.",
    "registrationStart": "2026-11-01T09:00:00",
    "registrationEnd": "2026-11-05T17:00:00",
    "votingStart": "2026-11-08T08:00:00",
    "votingEnd": "2026-11-12T18:00:00",
    "status": "VOTING_OPEN",
    "resultsPublished": false,
    "candidateCount": 4,
    "totalVotesCast": 142
  }
}
```

---

### 6.3 Create New Election
Creates an election with candidate registration and voting windows.

- **URL:** `/api/elections`
- **Method:** `POST`
- **Auth:** Bearer Token (`ROLE_ADMIN`)
- **Request Body:**
```json
{
  "title": "Faculty Representative Election 2026",
  "description": "Election for Department Faculty Council.",
  "registrationStart": "2026-12-01T09:00:00",
  "registrationEnd": "2026-12-05T18:00:00",
  "votingStart": "2026-12-10T08:00:00",
  "votingEnd": "2026-12-11T18:00:00"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Election created successfully",
  "data": {
    "id": "E2",
    "title": "Faculty Representative Election 2026",
    "status": "UPCOMING",
    "resultsPublished": false,
    "candidateCount": 0,
    "totalVotesCast": 0
  }
}
```

---

### 6.4 Update Election Schedule
- **URL:** `/api/elections/{id}`
- **Method:** `PUT`
- **Auth:** Bearer Token (`ROLE_ADMIN`)
- **Validation Rule:** Schedule cannot be altered once voting has commenced.
- **Request Body:** Same schema as election creation.
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Election updated successfully",
  "data": { ... }
}
```

---

### 6.5 Cancel / Delete Election
- **URL:** `/api/elections/{id}`
- **Method:** `DELETE`
- **Auth:** Bearer Token (`ROLE_ADMIN`)
- **Validation Rule:** Deletion is strictly prohibited if any ballots have already been cast.
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Election deleted successfully",
  "data": null
}
```

---

### 6.6 Publish Official Election Results
Certifies vote tallies and publishes results to the public board.

- **URL:** `/api/elections/{id}/publish-results`
- **Method:** `POST`
- **Auth:** Bearer Token (`ROLE_ADMIN`)
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Results published successfully",
  "data": {
    "id": "E1",
    "status": "RESULTS_PUBLISHED",
    "resultsPublished": true
  }
}
```

---

## 7. Candidate Nomination & Portfolio APIs (`/api/candidates`)

### 7.1 Get Candidates for an Election
Returns certified candidates, their manifestos, and campaign pledges for a specific election.

- **URL:** `/api/candidates/election/{electionId}`
- **Method:** `GET`
- **Auth:** None (Public)
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Candidates retrieved",
  "data": [
    {
      "candidateId": "C1",
      "candidateName": "Jane Citizen",
      "manifestoTitle": "Innovation, Transparency & Equality",
      "visionStatement": "Building an inclusive student community powered by technology.",
      "keyPromises": "• 24/7 Digital Library\n• Research Hackathons\n• Subsidized Canteen Meals",
      "paymentStatus": "PAID"
    }
  ]
}
```

---

### 7.2 File Nomination for Election
Submits candidate nomination manifesto along with verified Razorpay payment receipt details.

- **URL:** `/api/candidates/register-for-election`
- **Method:** `POST`
- **Auth:** Bearer Token (`ROLE_CANDIDATE`)
- **Request Body:**
```json
{
  "electionId": "E1",
  "manifestoTitle": "Innovation & Transparency",
  "visionStatement": "Fostering excellence in campus academic representation.",
  "keyPromises": "• Open Academic Forums\n• Mentorship Programs",
  "orderId": "order_PKy876TgbH",
  "paymentId": "pay_PKy987YhnJ"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Registered for election successfully",
  "data": {
    "id": "CR-1731234567",
    "candidateId": "C1",
    "electionId": "E1",
    "paymentStatus": "PAID",
    "paymentAmount": 100.0
  }
}
```

---

### 7.3 Check Candidate Nomination Status
Verifies if the logged-in candidate has already filed a nomination for the target election.

- **URL:** `/api/candidates/is-registered?electionId={electionId}`
- **Method:** `GET`
- **Auth:** Bearer Token (`ROLE_CANDIDATE`)
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Registration check",
  "data": true
}
```

---

### 7.4 Get All Candidates (Admin Directory)
- **URL:** `/api/candidates`
- **Method:** `GET`
- **Auth:** Bearer Token (`ROLE_ADMIN`)
- **Response `200 OK`:** Returns array of all enrolled Candidate user objects.

---

## 8. Balloting & Election Results APIs (`/api/votes`)

### 8.1 Cast Ballot
Casts an encrypted, confidential vote. Prevents double-voting via PostgreSQL composite unique constraint `UNIQUE (election_id, voter_id)`.

- **URL:** `/api/votes/cast`
- **Method:** `POST`
- **Auth:** Bearer Token (`ROLE_VOTER`)
- **Request Body:**
```json
{
  "electionId": "E1",
  "candidateId": "C1"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Vote cast successfully",
  "data": {
    "id": "VOTE-1731234567",
    "electionId": "E1",
    "voterId": "V1",
    "candidateId": "C1",
    "votedAt": "2026-11-09T14:32:10"
  }
}
```
- **Response `400 Bad Request` (Duplicate Attempt):**
```json
{
  "success": false,
  "message": "Double voting prohibited: You have already voted in this election.",
  "data": null
}
```

---

### 8.2 Check Voter Balloting Status
Returns `true` if the logged-in voter has cast a ballot in the specified election.

- **URL:** `/api/votes/has-voted/{electionId}`
- **Method:** `GET`
- **Auth:** Bearer Token (`ROLE_VOTER`)
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Check voting status",
  "data": true
}
```

---

### 8.3 Get Election Results & Tallies
Returns live tallies for Administrators, or certified results once `resultsPublished == true` for general users. Detects ties dynamically.

- **URL:** `/api/votes/results/{electionId}`
- **Method:** `GET`
- **Auth:** Authenticated
- **Response `200 OK` (Clear Winner):**
```json
{
  "success": true,
  "message": "Election results retrieved",
  "data": {
    "electionId": "E1",
    "electionTitle": "General Student Council Election 2026",
    "totalVotesCast": 250,
    "totalRegisteredVoters": 300,
    "isTie": false,
    "winner": {
      "candidateId": "C1",
      "candidateName": "Jane Citizen",
      "voteCount": 160,
      "votePercentage": 64.0
    },
    "tiedWinners": [],
    "candidateResults": [
      {
        "candidateId": "C1",
        "candidateName": "Jane Citizen",
        "voteCount": 160,
        "votePercentage": 64.0
      },
      {
        "candidateId": "C2",
        "candidateName": "John Doe",
        "voteCount": 90,
        "votePercentage": 36.0
      }
    ]
  }
}
```

---

## 9. Razorpay Payment Gateway APIs (`/api/payment`)

### 9.1 Get Payment Configuration
Returns the public Razorpay Key ID and required nomination fee in INR.

- **URL:** `/api/payment/config`
- **Method:** `GET`
- **Auth:** None (Public)
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Payment configuration",
  "data": {
    "keyId": "rzp_test_TuHZ9A0hAgLC6b",
    "nominationFee": 100.0,
    "currency": "INR"
  }
}
```

---

### 9.2 Create Razorpay Order
Generates an authenticated Razorpay Order ID for the ₹100 deposit (10,000 paise).

- **URL:** `/api/payment/create-order`
- **Method:** `POST`
- **Auth:** Bearer Token (`ROLE_CANDIDATE`)
- **Request Body:**
```json
{
  "electionId": "E1",
  "amount": 100.0
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Razorpay order created successfully",
  "data": {
    "orderId": "order_PKy876TgbH",
    "amount": 10000,
    "currency": "INR",
    "keyId": "rzp_test_TuHZ9A0hAgLC6b"
  }
}
```

---

### 9.3 Verify Payment Signature
Verifies the server-side HMAC-SHA256 signature generated by the Razorpay Checkout Modal.

- **URL:** `/api/payment/verify`
- **Method:** `POST`
- **Auth:** Bearer Token (`ROLE_CANDIDATE`)
- **Request Body:**
```json
{
  "orderId": "order_PKy876TgbH",
  "paymentId": "pay_PKy987YhnJ",
  "signature": "e5b8d9f10a2c3b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d"
}
```
- **Verification Formula:**
  $$\text{HMAC-SHA256}(\text{orderId} + "|" + \text{paymentId}, \text{razorpaySecret})$$
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": true
}
```

---

## 10. Voter Directory & Profile APIs (`/api/voters`)

### 10.1 Get All Registered Voters (Admin Directory)
- **URL:** `/api/voters`
- **Method:** `GET`
- **Auth:** Bearer Token (`ROLE_ADMIN`)
- **Response `200 OK`:** Returns array of all enrolled Voter user objects.

---

### 10.2 Get Authenticated User Profile
Retrieves complete profile data for the current logged-in identity.

- **URL:** `/api/voters/profile`
- **Method:** `GET`
- **Auth:** Bearer Token (`ROLE_VOTER`, `ROLE_CANDIDATE`, `ROLE_ADMIN`)
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "User profile",
  "data": {
    "id": "V1",
    "name": "Jane Citizen",
    "email": "jane.citizen@example.com",
    "dob": "2000-05-15",
    "gender": "Female",
    "age": 26,
    "role": "ROLE_VOTER",
    "status": "ACTIVE",
    "voterId": null,
    "createdAt": "2026-11-01T10:00:00"
  }
}
```

---

## 11. Administrative Audit Logs API (`/api/audit-logs`)

### 11.1 Retrieve System Audit Trail
Returns an immutable chronological log of administrative and user actions.

- **URL:** `/api/audit-logs`
- **Method:** `GET`
- **Auth:** Bearer Token (`ROLE_ADMIN`)
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Audit logs retrieved",
  "data": [
    {
      "id": 104,
      "timestamp": "2026-11-09T14:32:10",
      "userId": "V1",
      "role": "ROLE_VOTER",
      "action": "VOTE_CAST",
      "details": "Voter V1 voted in Election E1"
    },
    {
      "id": 105,
      "timestamp": "2026-11-09T15:00:00",
      "userId": "admin",
      "role": "ROLE_ADMIN",
      "action": "RESULTS_PUBLISHED",
      "details": "Election E1 results published officially by admin"
    }
  ]
}
```

---

## 12. HTTP Status Codes & Error Handling Matrix

| HTTP Status | Meaning | Typical Trigger |
| :---: | :--- | :--- |
| `200 OK` | Success | Query, update, login, or transaction completed normally |
| `400 Bad Request` | Validation / Rule Violation | Double-voting attempt, invalid OTP, under-age registration, signature mismatch |
| `401 Unauthorized` | Authentication Failure | Missing Bearer token, expired JWT, invalid login credentials |
| `403 Forbidden` | Authorization Failure | Voter trying to access `/api/elections` POST, Candidate accessing Admin logs |
| `404 Not Found` | Entity Missing | Election ID or Candidate ID does not exist |
| `500 Server Error` | Unexpected Fault | Database connectivity issue, external SMTP failure |
