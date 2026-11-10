package com.voting.service;

import com.voting.entity.User;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    public static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy, hh:mm a");

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired(required = false)
    private ITemplateEngine templateEngine;

    @Value("${spring.mail.username:vasu.demoprojects@gmail.com}")
    private String fromEmail;

    /**
     * Centralized asynchronous template dispatcher.
     */
    public void sendTemplateEmail(String toEmail, String subject, String templateName, Map<String, Object> variables) {
        if (mailSender == null) {
            logger.warn("JavaMailSender is not configured. Skipping email to {}", toEmail);
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom("SecureVote <" + fromEmail + ">");
                helper.setTo(toEmail);
                helper.setSubject(subject);

                String htmlContent = "";
                if (templateEngine != null) {
                    Context context = new Context();
                    context.setVariables(variables);
                    htmlContent = templateEngine.process("email/" + templateName, context);
                }

                helper.setText(htmlContent, true);
                mailSender.send(message);
                logger.info("Successfully dispatched email [{}] to {}", subject, toEmail);
            } catch (Exception ex) {
                logger.error("Failed to send template email [{}] to {}: {}", subject, toEmail, ex.getMessage(), ex);
            }
        });
    }

    // 1. OTP Verification Email (30-second validity)
    public void sendOtpEmail(String toEmail, String name, String otp, String purpose) {
        sendOtpEmail(toEmail, name, otp, purpose, 30);
    }

    public void sendOtpEmail(String toEmail, String name, String otp, String purpose, int validitySeconds) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("name", name != null ? name : "Citizen");
        vars.put("otp", otp);
        vars.put("purpose", purpose);
        vars.put("validitySeconds", validitySeconds);
        vars.put("expiresAt", LocalDateTime.now().plusSeconds(validitySeconds).format(FORMATTER));
        sendTemplateEmail(toEmail, "🔐 Your SecureVote Verification Code: " + otp, "otp-verification", vars);
    }

    // 2. Voter Welcome Email
    public void sendVoterRegistrationEmail(User voter) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("name", voter.getName());
        vars.put("voterId", voter.getId());
        vars.put("email", voter.getEmail());
        vars.put("dob", voter.getDob() != null ? voter.getDob().toString() : "Not specified");
        vars.put("gender", voter.getGender() != null && !voter.getGender().isBlank() ? voter.getGender() : "Not specified");
        vars.put("status", "ACTIVE");
        vars.put("loginUrl", "https://securevote-onlinevotingsystem.vercel.app/login?role=voter");
        sendTemplateEmail(voter.getEmail(), "🗳️ Welcome to SecureVote — Voter Registration Confirmed (" + voter.getId() + ")", "voter-welcome", vars);
    }

    // 3. Candidate Welcome Email
    public void sendCandidateRegistrationEmail(User candidate) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("name", candidate.getName());
        vars.put("candidateId", candidate.getId());
        vars.put("voterId", candidate.getVoterId() != null ? candidate.getVoterId() : "N/A");
        vars.put("email", candidate.getEmail());
        vars.put("status", "ACTIVE");
        vars.put("loginUrl", "https://securevote-onlinevotingsystem.vercel.app/login?role=candidate");
        sendTemplateEmail(candidate.getEmail(), "🏆 SecureVote Candidate Account Created — Candidate ID: " + candidate.getId(), "candidate-welcome", vars);
    }

    // 4. New Election Announcement
    public void sendNewElectionEmail(String toEmail, String recipientName, String electionId, String title, String description, String regStart, String regEnd, String voteStart, String voteEnd) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("recipientName", recipientName);
        vars.put("electionId", electionId);
        vars.put("electionTitle", title);
        vars.put("description", description);
        vars.put("registrationStart", regStart);
        vars.put("registrationEnd", regEnd);
        vars.put("votingStart", voteStart);
        vars.put("votingEnd", voteEnd);
        vars.put("viewUrl", "https://securevote-onlinevotingsystem.vercel.app/elections");
        sendTemplateEmail(toEmail, "📢 New Election Announced: " + title + " (" + electionId + ")", "new-election", vars);
    }

    // 5. Candidate Registration Period Update
    public void sendRegistrationPeriodUpdateEmail(String toEmail, String recipientName, String electionId, String title, String oldPeriod, String newPeriod) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("recipientName", recipientName);
        vars.put("electionId", electionId);
        vars.put("electionTitle", title);
        vars.put("oldRegistrationPeriod", oldPeriod);
        vars.put("newRegistrationPeriod", newPeriod);
        vars.put("viewUrl", "https://securevote-onlinevotingsystem.vercel.app/candidate/elections");
        sendTemplateEmail(toEmail, "⏱️ Schedule Update: Registration Window Revised for " + electionId, "registration-period-update", vars);
    }

    // 6. Voting Period Update
    public void sendVotingPeriodUpdateEmail(String toEmail, String recipientName, String electionId, String title, String oldPeriod, String newPeriod) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("recipientName", recipientName);
        vars.put("electionId", electionId);
        vars.put("electionTitle", title);
        vars.put("oldVotingPeriod", oldPeriod);
        vars.put("newVotingPeriod", newPeriod);
        vars.put("viewUrl", "https://securevote-onlinevotingsystem.vercel.app/voter/elections");
        sendTemplateEmail(toEmail, "🗳️ Schedule Update: Voting Window Revised for " + electionId, "voting-period-update", vars);
    }

    // 7. General Election Schedule Update
    public void sendElectionScheduleUpdateEmail(String toEmail, String recipientName, String electionId, String title, String changeSummary, String regWindow, String voteWindow) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("recipientName", recipientName);
        vars.put("electionId", electionId);
        vars.put("electionTitle", title);
        vars.put("changeSummary", changeSummary);
        vars.put("registrationWindow", regWindow);
        vars.put("votingWindow", voteWindow);
        vars.put("viewUrl", "https://securevote-onlinevotingsystem.vercel.app/elections");
        sendTemplateEmail(toEmail, "📅 Election Schedule Updated: " + title + " (" + electionId + ")", "election-schedule-update", vars);
    }

    // 8. Election Results Published
    public void sendElectionResultsEmail(String toEmail, String recipientName, String electionId, String title, String totalVoters, String totalVotes, String winnerName) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("recipientName", recipientName);
        vars.put("electionId", electionId);
        vars.put("electionTitle", title);
        vars.put("totalVoters", totalVoters);
        vars.put("totalVotes", totalVotes);
        vars.put("winnerName", winnerName);
        vars.put("resultsUrl", "https://securevote-onlinevotingsystem.vercel.app/elections");
        sendTemplateEmail(toEmail, "📊 Official Results Certified: " + title + " (" + electionId + ")", "election-results", vars);
    }

    // 9. Election Deleted / Cancelled
    public void sendElectionDeletedEmail(String toEmail, String recipientName, String electionId, String title, String deletedAt, String reason) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("recipientName", recipientName);
        vars.put("electionId", electionId);
        vars.put("electionTitle", title);
        vars.put("deletedAt", deletedAt != null ? deletedAt : LocalDateTime.now().format(FORMATTER));
        vars.put("reason", reason != null ? reason : "Administrative Reschedule");
        sendTemplateEmail(toEmail, "⚠️ Election Cancelled: " + title + " (" + electionId + ")", "election-deleted", vars);
    }

    // 10. Candidate Election Registration / Nomination Confirmed
    public void sendCandidateElectionRegistrationEmail(String toEmail, String candidateName, String candidateId, String electionId, String electionTitle, String manifestoTitle, String registeredAt) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("candidateName", candidateName);
        vars.put("candidateId", candidateId);
        vars.put("electionId", electionId);
        vars.put("electionTitle", electionTitle);
        vars.put("manifestoTitle", manifestoTitle);
        vars.put("registeredAt", registeredAt != null ? registeredAt : LocalDateTime.now().format(FORMATTER));
        vars.put("viewUrl", "https://securevote-onlinevotingsystem.vercel.app/candidate/elections");
        sendTemplateEmail(toEmail, "📜 Candidacy Confirmed for " + electionId + " — " + electionTitle, "candidate-registration", vars);
    }

    // 11. Razorpay Nomination Fee Payment Confirmation (₹100)
    public void sendPaymentConfirmationEmail(String toEmail, String candidateName, String candidateId, String electionId, String paymentId, String orderId, double amount, String paidAt) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("candidateName", candidateName);
        vars.put("candidateId", candidateId);
        vars.put("electionId", electionId);
        vars.put("paymentId", paymentId);
        vars.put("orderId", orderId);
        vars.put("amount", String.format("%.2f", amount));
        vars.put("paidAt", paidAt != null ? paidAt : LocalDateTime.now().format(FORMATTER));
        sendTemplateEmail(toEmail, "💳 Payment Receipt: Nomination Security Deposit for " + electionId, "payment-confirmation", vars);
    }

    // 12. Vote Cast Confirmation (Zero Ballot Choice Disclosed)
    public void sendVoteConfirmationEmail(String toEmail, String voterName, String voterId, String electionId, String electionTitle, String votedAt) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("voterName", voterName);
        vars.put("voterId", voterId);
        vars.put("electionId", electionId);
        vars.put("electionTitle", electionTitle);
        vars.put("votedAt", votedAt != null ? votedAt : LocalDateTime.now().format(FORMATTER));
        sendTemplateEmail(toEmail, "🗳️ Vote Receipt: Ballot Confirmed for " + electionTitle + " (" + electionId + ")", "vote-confirmation", vars);
    }

    // 13. Forgot Password Reset Link (1-minute validity)
    public void sendPasswordResetEmail(String toEmail, String recipientName, String resetUrl) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("recipientName", recipientName);
        vars.put("resetUrl", resetUrl);
        vars.put("expiresInMinutes", 1);
        vars.put("expiresAt", LocalDateTime.now().plusMinutes(1).format(FORMATTER));
        sendTemplateEmail(toEmail, "🔑 Reset Your SecureVote Password (Expires in 1 Minute)", "password-reset", vars);
    }

    // 14. Password Reset Success (via reset link)
    public void sendPasswordResetSuccessEmail(String toEmail, String recipientName, String userIdentifier, String timestamp) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("recipientName", recipientName);
        vars.put("userIdentifier", userIdentifier);
        vars.put("timestamp", timestamp != null ? timestamp : LocalDateTime.now().format(FORMATTER));
        sendTemplateEmail(toEmail, "✅ Password Successfully Reset — SecureVote", "password-reset-success", vars);
    }

    // 15. Password Updated Confirmation (in-app via OTP)
    public void sendPasswordUpdatedEmail(String toEmail, String recipientName, String userIdentifier, String timestamp) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("recipientName", recipientName);
        vars.put("userIdentifier", userIdentifier);
        vars.put("timestamp", timestamp != null ? timestamp : LocalDateTime.now().format(FORMATTER));
        sendTemplateEmail(toEmail, "🔐 Password Successfully Changed — SecureVote", "password-updated", vars);
    }

    // 16. Email Address Updated Confirmation
    public void sendEmailUpdatedEmail(String targetEmail, String recipientName, String oldEmail, String newEmail, String timestamp) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("recipientName", recipientName);
        vars.put("oldEmail", oldEmail);
        vars.put("newEmail", newEmail);
        vars.put("timestamp", timestamp != null ? timestamp : LocalDateTime.now().format(FORMATTER));
        sendTemplateEmail(targetEmail, "📧 Registered Email Address Updated — SecureVote", "email-updated", vars);
    }
}
