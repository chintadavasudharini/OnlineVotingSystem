package com.voting;

import com.voting.config.JwtTokenProvider;
import com.voting.entity.Role;
import com.voting.service.EmailService;
import com.voting.service.OtpStorageService;
import com.voting.service.PasswordResetStorageService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class EmailAndOtpAuditTest {

    @Autowired(required = false)
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired(required = false)
    private ITemplateEngine templateEngine;

    @Autowired
    private OtpStorageService otpStorageService;

    @Autowired
    private PasswordResetStorageService passwordResetStorageService;

    /**
     * Audit 1: Verify all 16 HTML email templates render without parsing errors or missing variable exceptions.
     */
    @Test
    public void auditAll16TemplatesRender() {
        Assertions.assertNotNull(templateEngine, "Thymeleaf template engine must be initialized");

        Map<String, Map<String, Object>> templateVariables = new LinkedHashMap<>();

        // 1. otp-verification
        templateVariables.put("email/otp-verification", Map.of(
                "name", "Voter Smith",
                "otp", "Ab1Cd2",
                "purpose", "Voter Registration",
                "validitySeconds", 30,
                "expiresAt", "Nov 08, 2026, 08:30 PM"
        ));

        // 2. voter-welcome
        templateVariables.put("email/voter-welcome", Map.of(
                "name", "Alice Citizen",
                "voterId", "V100",
                "email", "alice@example.com",
                "dob", "2000-01-01",
                "gender", "Female",
                "status", "ACTIVE",
                "loginUrl", "http://localhost:5173/login?role=voter"
        ));

        // 3. candidate-welcome
        templateVariables.put("email/candidate-welcome", Map.of(
                "name", "Bob Candidate",
                "candidateId", "C50",
                "voterId", "V100",
                "email", "bob@example.com",
                "status", "ACTIVE",
                "loginUrl", "http://localhost:5173/login?role=candidate"
        ));

        // 4. new-election
        templateVariables.put("email/new-election", Map.of(
                "recipientName", "Alice Citizen",
                "electionId", "E1",
                "electionTitle", "Presidential Election 2026",
                "description", "National Presidential Election",
                "registrationStart", "Nov 01, 2026, 09:00 AM",
                "registrationEnd", "Nov 05, 2026, 05:00 PM",
                "votingStart", "Nov 06, 2026, 08:00 AM",
                "votingEnd", "Nov 07, 2026, 06:00 PM",
                "viewUrl", "http://localhost:5173/elections"
        ));

        // 5. registration-period-update
        templateVariables.put("email/registration-period-update", Map.of(
                "recipientName", "Bob Candidate",
                "electionId", "E1",
                "electionTitle", "Presidential Election 2026",
                "oldRegistrationPeriod", "Nov 01 to Nov 04",
                "newRegistrationPeriod", "Nov 01 to Nov 05",
                "viewUrl", "http://localhost:5173/candidate/elections"
        ));

        // 6. voting-period-update
        templateVariables.put("email/voting-period-update", Map.of(
                "recipientName", "Alice Citizen",
                "electionId", "E1",
                "electionTitle", "Presidential Election 2026",
                "oldVotingPeriod", "Nov 06 to Nov 07",
                "newVotingPeriod", "Nov 06 to Nov 08",
                "viewUrl", "http://localhost:5173/voter/elections"
        ));

        // 7. election-schedule-update
        templateVariables.put("email/election-schedule-update", Map.of(
                "recipientName", "Citizen Smith",
                "electionId", "E1",
                "electionTitle", "Presidential Election 2026",
                "changeSummary", "Registration and voting timelines extended by 24 hours.",
                "registrationWindow", "Nov 01 to Nov 05",
                "votingWindow", "Nov 06 to Nov 08",
                "viewUrl", "http://localhost:5173/elections"
        ));

        // 8. election-results
        templateVariables.put("email/election-results", Map.of(
                "recipientName", "Alice Citizen",
                "electionId", "E1",
                "electionTitle", "Presidential Election 2026",
                "totalVoters", "1500",
                "totalVotes", "1250",
                "winnerName", "Jane Doe",
                "resultsUrl", "http://localhost:5173/elections"
        ));

        // 9. election-deleted
        templateVariables.put("email/election-deleted", Map.of(
                "recipientName", "Alice Citizen",
                "electionId", "E1",
                "electionTitle", "Municipal Council Election",
                "deletedAt", "Nov 08, 2026, 08:30 PM",
                "reason", "Administrative boundary revision"
        ));

        // 10. candidate-registration
        templateVariables.put("email/candidate-registration", Map.of(
                "candidateName", "Bob Candidate",
                "candidateId", "C50",
                "electionId", "E1",
                "electionTitle", "Presidential Election 2026",
                "manifestoTitle", "Future Forward Initiative",
                "registeredAt", "Nov 02, 2026, 11:00 AM",
                "viewUrl", "http://localhost:5173/candidate/elections"
        ));

        // 11. payment-confirmation
        templateVariables.put("email/payment-confirmation", Map.of(
                "candidateName", "Bob Candidate",
                "candidateId", "C50",
                "electionId", "E1",
                "paymentId", "pay_Mock123456",
                "orderId", "order_Mock654321",
                "amount", "100.00",
                "paidAt", "Nov 02, 2026, 11:00 AM"
        ));

        // 12. vote-confirmation (Ballot secrecy: candidate choice MUST NOT exist)
        templateVariables.put("email/vote-confirmation", Map.of(
                "voterName", "Alice Citizen",
                "voterId", "V100",
                "electionId", "E1",
                "electionTitle", "Presidential Election 2026",
                "votedAt", "Nov 06, 2026, 10:30 AM"
        ));

        // 13. password-reset
        templateVariables.put("email/password-reset", Map.of(
                "recipientName", "Alice Citizen",
                "resetUrl", "http://localhost:5173/reset-password?token=mockToken123",
                "expiresInMinutes", 1,
                "expiresAt", "Nov 08, 2026, 08:31 PM"
        ));

        // 14. password-reset-success
        templateVariables.put("email/password-reset-success", Map.of(
                "recipientName", "Alice Citizen",
                "userIdentifier", "V100",
                "timestamp", "Nov 08, 2026, 08:32 PM"
        ));

        // 15. password-updated
        templateVariables.put("email/password-updated", Map.of(
                "recipientName", "Alice Citizen",
                "userIdentifier", "V100",
                "timestamp", "Nov 08, 2026, 08:35 PM"
        ));

        // 16. email-updated
        templateVariables.put("email/email-updated", Map.of(
                "recipientName", "Alice Citizen",
                "oldEmail", "alice.old@example.com",
                "newEmail", "alice.new@example.com",
                "timestamp", "Nov 08, 2026, 08:40 PM"
        ));

        Assertions.assertEquals(16, templateVariables.size(), "Must test all 16 templates");

        for (Map.Entry<String, Map<String, Object>> entry : templateVariables.entrySet()) {
            Context context = new Context();
            context.setVariables(entry.getValue());
            String renderedHtml = templateEngine.process(entry.getKey(), context);
            Assertions.assertNotNull(renderedHtml, "Template " + entry.getKey() + " must render");
            Assertions.assertTrue(renderedHtml.length() > 100, "Rendered HTML must not be empty for " + entry.getKey());
            Assertions.assertTrue(renderedHtml.contains("SecureVote"), "Template must maintain SecureVote branding: " + entry.getKey());
        }
    }

    /**
     * Audit 2: Verify OTP format matches [A-Z][a-z][0-9][A-Z][a-z][0-9] pattern.
     */
    @Test
    public void auditOtpFormatPattern() {
        for (int i = 0; i < 50; i++) {
            String otp = otpStorageService.generateOtp();
            Assertions.assertEquals(6, otp.length(), "OTP must be exactly 6 characters");
            Assertions.assertTrue(Character.isUpperCase(otp.charAt(0)), "Char 0 must be uppercase");
            Assertions.assertTrue(Character.isLowerCase(otp.charAt(1)), "Char 1 must be lowercase");
            Assertions.assertTrue(Character.isDigit(otp.charAt(2)), "Char 2 must be digit");
            Assertions.assertTrue(Character.isUpperCase(otp.charAt(3)), "Char 3 must be uppercase");
            Assertions.assertTrue(Character.isLowerCase(otp.charAt(4)), "Char 4 must be lowercase");
            Assertions.assertTrue(Character.isDigit(otp.charAt(5)), "Char 5 must be digit");
        }
    }

    /**
     * Audit 3 & 4: Concurrency & Atomicity test.
     * When 10 concurrent threads attempt to verify the exact same valid OTP simultaneously,
     * exactly ONE thread must succeed and nine must fail with consumption/invalidated message.
     */
    @Test
    public void auditOtpConcurrentSingleUseAtomicity() throws Exception {
        String testEmail = "concurrent." + System.currentTimeMillis() + "@test.org";
        String purpose = "CONCURRENCY_TEST";
        Map<String, Object> payload = Map.of("key", "testValue");

        String rawOtp = otpStorageService.createAndStoreOtp(testEmail, "U1", purpose, payload);

        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    otpStorageService.verifyOtp(testEmail, purpose, rawOtp);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        doneLatch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        Assertions.assertEquals(1, successCount.get(), "Strictly ONE thread must succeed in verifying OTP");
        Assertions.assertEquals(threadCount - 1, failCount.get(), "All other concurrent attempts must be rejected");
    }

    /**
     * Audit 3: Password reset single-use atomicity under concurrent consumption.
     */
    @Test
    public void auditPasswordResetTokenSingleUseAtomicity() throws Exception {
        String userId = "U_RESET_" + System.currentTimeMillis();
        String email = "reset." + System.currentTimeMillis() + "@test.org";

        String rawToken = passwordResetStorageService.createAndStoreResetToken(userId, email, "VOTER");

        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    passwordResetStorageService.validateAndConsumeToken(rawToken);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        doneLatch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        Assertions.assertEquals(1, successCount.get(), "Strictly ONE thread can consume password reset token");
        Assertions.assertEquals(threadCount - 1, failCount.get(), "Subsequent token uses must fail");
    }

    /**
     * Audit 4: 5 incorrect OTP attempts result in revocation.
     */
    @Test
    public void auditFiveIncorrectAttemptsRevocation() {
        String testEmail = "attempts." + System.currentTimeMillis() + "@test.org";
        String purpose = "ATTEMPTS_TEST";
        String rawOtp = otpStorageService.createAndStoreOtp(testEmail, "U1", purpose, Collections.emptyMap());

        for (int attempt = 1; attempt <= 4; attempt++) {
            int finalAttempt = attempt;
            IllegalArgumentException ex = Assertions.assertThrows(IllegalArgumentException.class, () -> {
                otpStorageService.verifyOtp(testEmail, purpose, "Wrong1");
            });
            Assertions.assertTrue(ex.getMessage().contains("attempt(s) remaining"),
                    "Must inform remaining attempts: " + ex.getMessage());
        }

        // 5th attempt invalidates
        IllegalArgumentException ex5 = Assertions.assertThrows(IllegalArgumentException.class, () -> {
            otpStorageService.verifyOtp(testEmail, purpose, "Wrong1");
        });
        Assertions.assertTrue(ex5.getMessage().contains("revoked") || ex5.getMessage().contains("invalidated"),
                "5th failed attempt must revoke OTP: " + ex5.getMessage());

        // Subsequent attempt even with the RIGHT code must now be rejected
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            otpStorageService.verifyOtp(testEmail, purpose, rawOtp);
        });
    }

    /**
     * Audit 5: Verification that Ballot Secrecy is strictly honored in vote-confirmation.html
     */
    @Test
    public void auditBallotSecrecyInVoteConfirmation() {
        Context context = new Context();
        context.setVariable("voterName", "John Citizen");
        context.setVariable("voterId", "V10");
        context.setVariable("electionId", "E5");
        context.setVariable("electionTitle", "Presidential Election 2026");
        context.setVariable("votedAt", "Nov 08, 2026, 08:45 PM");

        String rendered = templateEngine.process("email/vote-confirmation", context);
        Assertions.assertFalse(rendered.contains("candidateId"), "Vote confirmation must NEVER expose candidateId variable");
        Assertions.assertFalse(rendered.contains("candidateName"), "Vote confirmation must NEVER expose candidateName variable");
        Assertions.assertFalse(rendered.contains("party"), "Vote confirmation must NEVER expose party choice");
        Assertions.assertTrue(rendered.contains("Ballot Confirmed"), "Must confirm ballot participation");
        Assertions.assertTrue(rendered.contains("Ballot Successfully Recorded"), "Must confirm ballot recording");
    }

    /**
     * Audit 6: Strict RBAC enforcement - Voters CANNOT access Admin APIs (HTTP 403 Forbidden).
     */
    @Test
    public void auditVoterCannotAccessAdminApis() throws Exception {
        Assertions.assertNotNull(mockMvc, "MockMvc must be initialized");
        String voterToken = tokenProvider.generateToken("V1", Role.VOTER, "Test Voter");

        // 1. Audit Logs
        mockMvc.perform(get("/api/audit-logs")
                .header("Authorization", "Bearer " + voterToken))
                .andExpect(status().isForbidden());

        // 2. View all voters
        mockMvc.perform(get("/api/voters")
                .header("Authorization", "Bearer " + voterToken))
                .andExpect(status().isForbidden());

        // 3. View all candidates
        mockMvc.perform(get("/api/candidates")
                .header("Authorization", "Bearer " + voterToken))
                .andExpect(status().isForbidden());

        // 4. Create election
        mockMvc.perform(post("/api/elections")
                .header("Authorization", "Bearer " + voterToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Illegal\",\"registrationStart\":\"2026-11-01T09:00:00\",\"registrationEnd\":\"2026-11-02T09:00:00\",\"votingStart\":\"2026-11-03T09:00:00\",\"votingEnd\":\"2026-11-04T09:00:00\"}"))
                .andExpect(status().isForbidden());

        // 5. Update election
        mockMvc.perform(put("/api/elections/E1")
                .header("Authorization", "Bearer " + voterToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Illegal Update\"}"))
                .andExpect(status().isForbidden());

        // 6. Delete election
        mockMvc.perform(delete("/api/elections/E1")
                .header("Authorization", "Bearer " + voterToken))
                .andExpect(status().isForbidden());

        // 7. Publish election results
        mockMvc.perform(post("/api/elections/E1/publish-results")
                .header("Authorization", "Bearer " + voterToken))
                .andExpect(status().isForbidden());
    }

    /**
     * Audit 7: Strict RBAC enforcement - Candidates CANNOT access Admin APIs (HTTP 403 Forbidden).
     */
    @Test
    public void auditCandidateCannotAccessAdminApis() throws Exception {
        Assertions.assertNotNull(mockMvc, "MockMvc must be initialized");
        String candidateToken = tokenProvider.generateToken("C1", Role.CANDIDATE, "Test Candidate");

        // 1. Audit Logs
        mockMvc.perform(get("/api/audit-logs")
                .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isForbidden());

        // 2. View all voters
        mockMvc.perform(get("/api/voters")
                .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isForbidden());

        // 3. View all candidates
        mockMvc.perform(get("/api/candidates")
                .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isForbidden());

        // 4. Create election
        mockMvc.perform(post("/api/elections")
                .header("Authorization", "Bearer " + candidateToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Illegal Election\"}"))
                .andExpect(status().isForbidden());

        // 5. Update election
        mockMvc.perform(put("/api/elections/E1")
                .header("Authorization", "Bearer " + candidateToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Illegal Update\"}"))
                .andExpect(status().isForbidden());

        // 6. Delete election
        mockMvc.perform(delete("/api/elections/E1")
                .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isForbidden());

        // 7. Publish election results
        mockMvc.perform(post("/api/elections/E1/publish-results")
                .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isForbidden());
    }
}
