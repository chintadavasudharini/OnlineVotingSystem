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

import java.util.concurrent.CompletableFuture;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:vasu.demoprojects@gmail.com}")
    private String fromEmail;

    /**
     * Sends a rich confirmation email to a newly registered voter with their Voter ID.
     */
    public void sendVoterRegistrationEmail(User voter) {
        if (mailSender == null) {
            logger.warn("JavaMailSender is not configured. Skipping voter registration email for {}", voter.getEmail());
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom("SecureVote <" + fromEmail + ">");
                helper.setTo(voter.getEmail());
                helper.setSubject("🗳️ Welcome to SecureVote — Voter Registration Confirmed (" + voter.getId() + ")");

                String htmlContent = buildVoterEmailTemplate(voter);
                helper.setText(htmlContent, true);

                mailSender.send(message);
                logger.info("Successfully sent voter registration confirmation email to {} with Voter ID {}", voter.getEmail(), voter.getId());
            } catch (Exception ex) {
                logger.error("Failed to send voter registration email to {}: {}", voter.getEmail(), ex.getMessage(), ex);
            }
        });
    }

    /**
     * Sends a rich confirmation email to a newly registered candidate with their Candidate ID.
     */
    public void sendCandidateRegistrationEmail(User candidate) {
        if (mailSender == null) {
            logger.warn("JavaMailSender is not configured. Skipping candidate registration email for {}", candidate.getEmail());
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom("SecureVote <" + fromEmail + ">");
                helper.setTo(candidate.getEmail());
                helper.setSubject("🏆 SecureVote Candidate Account Created — Candidate ID: " + candidate.getId());

                String htmlContent = buildCandidateEmailTemplate(candidate);
                helper.setText(htmlContent, true);

                mailSender.send(message);
                logger.info("Successfully sent candidate registration confirmation email to {} with Candidate ID {}", candidate.getEmail(), candidate.getId());
            } catch (Exception ex) {
                logger.error("Failed to send candidate registration email to {}: {}", candidate.getEmail(), ex.getMessage(), ex);
            }
        });
    }

    private String buildVoterEmailTemplate(User voter) {
        String genderDisplay = voter.getGender() != null && !voter.getGender().isBlank() ? voter.getGender() : "Not specified";
        String dobDisplay = voter.getDob() != null ? voter.getDob().toString() : "Not specified";

        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Voter Registration Confirmed</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
              <table role="presentation" width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                      
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #1e3a8a 0%%, #2563eb 100%%); padding: 32px 28px; text-align: center; color: #ffffff;">
                          <div style="font-size: 32px; margin-bottom: 8px;">🗳️</div>
                          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.02em;">SecureVote</h1>
                          <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9; font-weight: 400;">Online Democratic Voting Platform</p>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding: 32px 28px;">
                          <h2 style="margin: 0 0 12px; font-size: 20px; color: #0f172a; font-weight: 700;">Welcome, %s!</h2>
                          <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
                            Your voter registration has been successfully processed and verified. You are now officially enrolled to cast your ballot in all eligible elections.
                          </p>

                          <!-- Credential Box -->
                          <div style="background-color: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 10px; padding: 20px; margin-bottom: 24px; text-align: center;">
                            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #1e40af; letter-spacing: 0.08em; margin-bottom: 6px;">Your Official Voter ID</div>
                            <div style="font-size: 28px; font-weight: 800; color: #1d4ed8; letter-spacing: 0.05em; margin-bottom: 6px;">%s</div>
                            <div style="font-size: 12px; color: #64748b;">Use this Voter ID together with your password to log in.</div>
                          </div>

                          <!-- Details Table -->
                          <table role="presentation" width="100%%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; font-size: 14px; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                              <td style="padding: 10px 0; font-weight: 600; color: #64748b; width: 40%%;">Full Name:</td>
                              <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">%s</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                              <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Registered Email:</td>
                              <td style="padding: 10px 0; color: #0f172a;">%s</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                              <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Date of Birth:</td>
                              <td style="padding: 10px 0; color: #0f172a;">%s</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                              <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Gender:</td>
                              <td style="padding: 10px 0; color: #0f172a;">%s</td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Status:</td>
                              <td style="padding: 10px 0; color: #15803d; font-weight: 700;">ACTIVE (Verified)</td>
                            </tr>
                          </table>

                          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 16px; border-radius: 4px; margin-bottom: 24px;">
                            <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 4px;">Important Security Reminder</div>
                            <div style="font-size: 13px; color: #64748b; line-height: 1.5;">
                              Never share your password with anyone. SecureVote will never ask for your password via email or phone.
                            </div>
                          </div>

                          <!-- Call To Action -->
                          <div style="text-align: center; margin-top: 28px;">
                            <a href="https://securevote-onlinevotingsystem.vercel.app/login?role=voter" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(37,99,235,0.3);">
                              Go to Voter Login &rarr;
                            </a>
                          </div>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f8fafc; padding: 20px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                          <p style="margin: 0 0 6px;">SecureVote Online Democratic Voting System</p>
                          <p style="margin: 0;">Designed for democratic transparency, cryptographic non-repudiation, and institutional trust.</p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(voter.getName(), voter.getId(), voter.getName(), voter.getEmail(), dobDisplay, genderDisplay);
    }

    private String buildCandidateEmailTemplate(User candidate) {
        String linkedVoter = candidate.getVoterId() != null ? candidate.getVoterId() : "N/A";

        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Candidate Account Confirmed</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
              <table role="presentation" width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                      
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #7c2d12 0%%, #c2410c 100%%); padding: 32px 28px; text-align: center; color: #ffffff;">
                          <div style="font-size: 32px; margin-bottom: 8px;">🏆</div>
                          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.02em;">SecureVote</h1>
                          <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9; font-weight: 400;">Candidate Governance & Nomination Portal</p>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding: 32px 28px;">
                          <h2 style="margin: 0 0 12px; font-size: 20px; color: #0f172a; font-weight: 700;">Congratulations, %s!</h2>
                          <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
                            Your Candidate account has been approved and activated. You can now log in, submit your election nomination, publish campaign promises, and participate in scheduled elections.
                          </p>

                          <!-- Credential Box -->
                          <div style="background-color: #fff7ed; border: 1.5px solid #fed7aa; border-radius: 10px; padding: 20px; margin-bottom: 24px; text-align: center;">
                            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #9a3412; letter-spacing: 0.08em; margin-bottom: 6px;">Your Official Candidate ID</div>
                            <div style="font-size: 28px; font-weight: 800; color: #c2410c; letter-spacing: 0.05em; margin-bottom: 6px;">%s</div>
                            <div style="font-size: 12px; color: #78716c;">Linked to Voter ID: <strong>%s</strong></div>
                          </div>

                          <!-- Details Table -->
                          <table role="presentation" width="100%%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; font-size: 14px; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                              <td style="padding: 10px 0; font-weight: 600; color: #64748b; width: 40%%;">Candidate Name:</td>
                              <td style="padding: 10px 0; font-weight: 600; color: #0f172a;">%s</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                              <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Registered Email:</td>
                              <td style="padding: 10px 0; color: #0f172a;">%s</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                              <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Role:</td>
                              <td style="padding: 10px 0; color: #c2410c; font-weight: 700;">CANDIDATE</td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Account Status:</td>
                              <td style="padding: 10px 0; color: #15803d; font-weight: 700;">ACTIVE</td>
                            </tr>
                          </table>

                          <!-- Call To Action -->
                          <div style="text-align: center; margin-top: 28px;">
                            <a href="https://securevote-onlinevotingsystem.vercel.app/login?role=candidate" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(234,88,12,0.3);">
                              Go to Candidate Login &rarr;
                            </a>
                          </div>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f8fafc; padding: 20px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                          <p style="margin: 0 0 6px;">SecureVote Online Democratic Voting System</p>
                          <p style="margin: 0;">Designed for democratic transparency, cryptographic non-repudiation, and institutional trust.</p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(candidate.getName(), candidate.getId(), linkedVoter, candidate.getName(), candidate.getEmail());
    }
}
