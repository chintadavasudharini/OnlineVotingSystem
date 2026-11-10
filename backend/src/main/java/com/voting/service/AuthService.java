package com.voting.service;

import com.voting.config.AdminSecurityProperties;
import com.voting.config.JwtTokenProvider;
import com.voting.dto.*;
import com.voting.entity.Role;
import com.voting.entity.User;
import com.voting.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private AuditService auditService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OtpStorageService otpStorageService;

    @Autowired
    private PasswordResetStorageService passwordResetStorageService;

    @Autowired
    private AdminSecurityProperties adminSecurityProperties;

    public synchronized String getNextVoterId() {
        List<String> voterIds = userRepository.findAllVoterIds();
        int maxId = 0;
        for (String id : voterIds) {
            if (id.startsWith("V")) {
                try {
                    int num = Integer.parseInt(id.substring(1));
                    if (num > maxId) {
                        maxId = num;
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
        return "V" + (maxId + 1);
    }

    public synchronized String getNextCandidateId() {
        List<String> candidateIds = userRepository.findAllCandidateIds();
        int maxId = 0;
        for (String id : candidateIds) {
            if (id.startsWith("C")) {
                try {
                    int num = Integer.parseInt(id.substring(1));
                    if (num > maxId) {
                        maxId = num;
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
        return "C" + (maxId + 1);
    }

    @Transactional
    public AuthResponse registerVoter(VoterRegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCaseAndRole(request.getEmail().trim(), Role.VOTER)) {
            throw new IllegalArgumentException("A registered voter with this email address already exists.");
        }
        if (request.getAge() < 18) {
            throw new IllegalArgumentException("Voter must be at least 18 years old to register.");
        }

        String voterId = getNextVoterId();
        String encodedPassword = passwordEncoder.encode(request.getPassword().trim());

        User voter = new User(
                voterId,
                request.getName().trim(),
                request.getEmail().trim().toLowerCase(),
                request.getDob(),
                request.getGender() != null ? request.getGender().trim() : null,
                request.getAge(),
                encodedPassword,
                Role.VOTER,
                "ACTIVE",
                null
        );

        userRepository.save(voter);

        auditService.log(
                voterId,
                "VOTER",
                "Registration",
                voterId + " (" + voter.getName() + ") registered as Voter"
        );

        emailService.sendVoterRegistrationEmail(voter);

        String token = tokenProvider.generateToken(voterId, Role.VOTER, voter.getName());

        return new AuthResponse(
                token,
                voter.getId(),
                voter.getName(),
                voter.getEmail(),
                voter.getRole(),
                voter.getAge(),
                voter.getDob(),
                voter.getGender(),
                null,
                voter.getStatus()
        );
    }

    @Transactional
    public AuthResponse registerCandidate(CandidateRegisterRequest request) {
        String voterId = request.getVoterId().trim();
        User voter = userRepository.findByIdIgnoreCase(voterId)
                .orElseThrow(() -> new IllegalArgumentException("No registered voter found with ID: " + voterId));

        if (voter.getRole() != Role.VOTER) {
            throw new IllegalArgumentException("The specified ID does not belong to a Voter.");
        }

        if (voter.getAge() < 25) {
            throw new IllegalArgumentException("Candidate must be 25 years or older. Current age: " + voter.getAge());
        }

        if (userRepository.findByVoterId(voter.getId()).isPresent()) {
            throw new IllegalArgumentException("A Candidate account is already linked to Voter ID: " + voterId);
        }

        String candidateId = getNextCandidateId();
        String encodedPassword = passwordEncoder.encode(request.getPassword().trim());

        User candidate = new User(
                candidateId,
                voter.getName(),
                voter.getEmail(),
                voter.getDob(),
                voter.getGender(),
                voter.getAge(),
                encodedPassword,
                Role.CANDIDATE,
                "ACTIVE",
                voter.getId()
        );

        userRepository.save(candidate);

        auditService.log(
                candidateId,
                "CANDIDATE",
                "Candidate Account Created",
                candidateId + " (" + candidate.getName() + ") created Candidate account linked to Voter " + voter.getId()
        );

        emailService.sendCandidateRegistrationEmail(candidate);

        String token = tokenProvider.generateToken(candidateId, Role.CANDIDATE, candidate.getName());

        return new AuthResponse(
                token,
                candidate.getId(),
                candidate.getName(),
                candidate.getEmail(),
                candidate.getRole(),
                candidate.getAge(),
                candidate.getDob(),
                candidate.getGender(),
                candidate.getVoterId(),
                candidate.getStatus()
        );
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        String rawIdentifier = request.getIdentifier() != null ? request.getIdentifier().trim() : "";
        String cleanIdentifier = rawIdentifier
                .replaceAll("(?i)^(candidate|voter)[\\s:#/-]+", "")
                .replaceAll("(?i)^([A-Z])\\s+(\\d+)$", "$1$2")
                .trim();
        String identifier = cleanIdentifier.isEmpty() ? rawIdentifier : cleanIdentifier;
        String roleStr = request.getRole() != null ? request.getRole().trim().toUpperCase() : null;

        // Dedicated separate login flow for ADMIN
        if ("ADMIN".equalsIgnoreCase(roleStr)) {
            String submittedUser = request.getIdentifier() != null ? request.getIdentifier().trim() : "";
            String submittedPass = request.getPassword() != null ? request.getPassword() : "";

            // In production, reject demo username or demo password immediately
            if (adminSecurityProperties.isProduction()) {
                if ("admin".equalsIgnoreCase(submittedUser) && !"admin".equalsIgnoreCase(adminSecurityProperties.getAdminUsername())) {
                    throw new IllegalArgumentException("Invalid admin credentials.");
                }
                if ("admin".equals(submittedPass.trim())) {
                    throw new IllegalArgumentException("Invalid admin credentials.");
                }
            }

            // Verify username matches configured username (case-insensitive)
            if (!adminSecurityProperties.getAdminUsername().equalsIgnoreCase(submittedUser)) {
                throw new IllegalArgumentException("Invalid admin credentials.");
            }

            // Verify password using BCrypt
            if (!adminSecurityProperties.matches(submittedPass)) {
                throw new IllegalArgumentException("Invalid admin credentials.");
            }

            String adminUsername = adminSecurityProperties.getAdminUsername();
            User admin = userRepository.findByIdIgnoreCase(adminUsername)
                    .orElseGet(() -> {
                        User newAdmin = new User(
                                adminUsername,
                                "System Administrator",
                                adminUsername + "@system.local",
                                null,
                                99,
                                adminSecurityProperties.getEncodedPassword(),
                                Role.ADMIN,
                                "ACTIVE",
                                null
                        );
                        return userRepository.save(newAdmin);
                    });

            // Ensure DB record has updated BCrypt hash
            if (!passwordEncoder.matches(submittedPass.trim(), admin.getPassword())) {
                admin.setPassword(adminSecurityProperties.getEncodedPassword());
                userRepository.save(admin);
            }

            auditService.log(admin.getId(), "ADMIN", "Login", "Administrator (" + admin.getId() + ") logged into admin console");
            String token = tokenProvider.generateToken(admin.getId(), Role.ADMIN, admin.getName());

            return new AuthResponse(
                    token,
                    admin.getId(),
                    admin.getName(),
                    admin.getEmail(),
                    admin.getRole(),
                    admin.getAge(),
                    admin.getDob(),
                    admin.getGender(),
                    null,
                    admin.getStatus()
            );
        }

        // Voter login: Candidate or Admin credentials must NOT work
        if ("VOTER".equalsIgnoreCase(roleStr)) {
            if (identifier.matches("(?i)^C\\d+$")) {
                throw new IllegalArgumentException("Candidate credentials cannot be used for Voter login.");
            }
            if ("admin".equalsIgnoreCase(identifier)) {
                throw new IllegalArgumentException("Admin credentials cannot be used for Voter login.");
            }
        }

        // Candidate login: Voter or Admin credentials must NOT work
        if ("CANDIDATE".equalsIgnoreCase(roleStr)) {
            if (identifier.matches("(?i)^V\\d+$")) {
                throw new IllegalArgumentException("Voter credentials cannot be used for Candidate login.");
            }
            if ("admin".equalsIgnoreCase(identifier)) {
                throw new IllegalArgumentException("Admin credentials cannot be used for Candidate login.");
            }
        }

        // Find Voter or Candidate by ID or Email
        Optional<User> userOpt = userRepository.findByIdIgnoreCase(cleanIdentifier);
        if (userOpt.isEmpty() && !cleanIdentifier.equalsIgnoreCase(rawIdentifier)) {
            userOpt = userRepository.findByIdIgnoreCase(rawIdentifier);
        }

        if (userOpt.isEmpty()) {
            if (roleStr != null) {
                try {
                    Role targetRole = Role.valueOf(roleStr);
                    userOpt = userRepository.findByEmailIgnoreCaseAndRole(rawIdentifier, targetRole);
                } catch (IllegalArgumentException ignored) {}
            }
            if (userOpt.isEmpty()) {
                List<User> users = userRepository.findAllByEmailIgnoreCase(rawIdentifier);
                if (!users.isEmpty()) {
                    userOpt = Optional.of(users.get(0));
                }
            }
        }

        User user = userOpt.orElseThrow(() -> new IllegalArgumentException(
                "VOTER".equalsIgnoreCase(roleStr) ? "Invalid Voter ID or password." :
                "CANDIDATE".equalsIgnoreCase(roleStr) ? "Invalid Candidate ID or password." :
                "Invalid user ID or password."
        ));

        // Strict role enforcement
        if (roleStr != null && !user.getRole().name().equalsIgnoreCase(roleStr)) {
            if ("VOTER".equalsIgnoreCase(roleStr) && user.getRole() == Role.CANDIDATE) {
                throw new IllegalArgumentException("Candidate credentials cannot be used for Voter login.");
            }
            if ("CANDIDATE".equalsIgnoreCase(roleStr) && user.getRole() == Role.VOTER) {
                throw new IllegalArgumentException("Voter credentials cannot be used for Candidate login.");
            }
            throw new IllegalArgumentException("User role mismatch. This account is registered as " + user.getRole());
        }

        String rawPass = request.getPassword() != null ? request.getPassword() : "";
        String trimmedPass = rawPass.trim();

        boolean matches = passwordEncoder.matches(rawPass, user.getPassword()) ||
                          passwordEncoder.matches(trimmedPass, user.getPassword()) ||
                          rawPass.equals(user.getPassword()) ||
                          trimmedPass.equals(user.getPassword());
        if (!matches) {
            throw new IllegalArgumentException(
                    "VOTER".equalsIgnoreCase(roleStr) ? "Invalid Voter ID or password." :
                    "CANDIDATE".equalsIgnoreCase(roleStr) ? "Invalid Candidate ID or password." :
                    "Invalid user ID or password."
            );
        }

        auditService.log(
                user.getId(),
                user.getRole().name(),
                "Login",
                user.getId() + " (" + user.getName() + ") logged in"
        );

        String token = tokenProvider.generateToken(user.getId(), user.getRole(), user.getName());

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getAge(),
                user.getDob(),
                user.getGender(),
                user.getVoterId(),
                user.getStatus()
        );
    }

    // ==========================================
    // OTP VERIFICATION & RECOVERY WORKFLOWS
    // ==========================================

    public String initiateVoterRegistration(VoterRegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCaseAndRole(email, Role.VOTER)) {
            throw new IllegalArgumentException("A registered voter with this email address already exists.");
        }
        if (request.getAge() < 18) {
            throw new IllegalArgumentException("Voter must be at least 18 years old to register.");
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("name", request.getName().trim());
        payload.put("email", email);
        payload.put("dob", request.getDob().toString());
        payload.put("gender", request.getGender() != null ? request.getGender().trim() : "");
        payload.put("age", request.getAge());
        payload.put("password", request.getPassword().trim());

        String rawOtp = otpStorageService.createAndStoreOtp(email, null, "VOTER_REGISTRATION", payload);
        emailService.sendOtpEmail(email, request.getName().trim(), rawOtp, "Voter Registration", OtpStorageService.OTP_VALIDITY_SECONDS);

        return "OTP sent to " + email;
    }

    @Transactional
    public AuthResponse completeVoterRegistration(OtpVerifyRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        Map<String, Object> payload = otpStorageService.verifyOtp(email, "VOTER_REGISTRATION", request.getOtp());

        VoterRegisterRequest regReq = new VoterRegisterRequest();
        regReq.setName((String) payload.get("name"));
        regReq.setEmail((String) payload.get("email"));
        regReq.setDob(LocalDate.parse((String) payload.get("dob")));
        regReq.setGender((String) payload.get("gender"));
        regReq.setAge(((Number) payload.get("age")).intValue());
        regReq.setPassword((String) payload.get("password"));

        return registerVoter(regReq);
    }

    public String initiateCandidateRegistration(CandidateRegisterRequest request) {
        String voterId = request.getVoterId().trim();
        User voter = userRepository.findByIdIgnoreCase(voterId)
                .orElseThrow(() -> new IllegalArgumentException("No registered voter found with ID: " + voterId));

        if (voter.getRole() != Role.VOTER) {
            throw new IllegalArgumentException("The specified ID does not belong to a Voter.");
        }
        if (voter.getAge() < 25) {
            throw new IllegalArgumentException("Candidate must be 25 years or older. Current age: " + voter.getAge());
        }
        if (userRepository.findByVoterId(voter.getId()).isPresent()) {
            throw new IllegalArgumentException("A Candidate account is already linked to Voter ID: " + voterId);
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("voterId", voter.getId());
        payload.put("password", request.getPassword().trim());

        String rawOtp = otpStorageService.createAndStoreOtp(voter.getEmail(), voter.getId(), "CANDIDATE_REGISTRATION", payload);
        emailService.sendOtpEmail(voter.getEmail(), voter.getName(), rawOtp, "Candidate Account Registration", OtpStorageService.OTP_VALIDITY_SECONDS);

        return "OTP sent to registered voter email (" + voter.getEmail() + ")";
    }

    @Transactional
    public AuthResponse completeCandidateRegistration(OtpVerifyRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        if (email.isEmpty() && request.getVoterId() != null) {
            email = userRepository.findByIdIgnoreCase(request.getVoterId().trim())
                    .map(User::getEmail)
                    .orElse("");
        }
        Map<String, Object> payload = otpStorageService.verifyOtp(email, "CANDIDATE_REGISTRATION", request.getOtp());

        CandidateRegisterRequest regReq = new CandidateRegisterRequest();
        regReq.setVoterId((String) payload.get("voterId"));
        regReq.setPassword((String) payload.get("password"));

        return registerCandidate(regReq);
    }

    public String initiateForgotPassword(ForgotPasswordRequest request, String baseUrl) {
        String email = request.getEmail().trim().toLowerCase();
        List<User> users = userRepository.findAllByEmailIgnoreCase(email);
        if (users.isEmpty()) {
            throw new IllegalArgumentException("No registered account found with email address: " + email);
        }

        User user = users.get(0);
        String rawToken = passwordResetStorageService.createAndStoreResetToken(user.getId(), user.getEmail(), user.getRole().name());

        String link = (baseUrl != null ? baseUrl.replaceAll("/$", "") : "http://localhost:5173") + "/reset-password?token=" + rawToken;
        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), link);

        return "Password reset link sent to " + user.getEmail() + ". Link expires in 1 minute.";
    }

    @Transactional
    public String completePasswordReset(ResetPasswordRequest request) {
        PasswordResetStorageService.ResetTokenRecord record = passwordResetStorageService.validateAndConsumeToken(request.getToken());

        User user = userRepository.findByIdIgnoreCase(record.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User account not found."));

        user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        userRepository.save(user);

        auditService.log(
                user.getId(),
                user.getRole().name(),
                "Password Reset",
                user.getId() + " (" + user.getName() + ") reset password via email recovery link"
        );

        emailService.sendPasswordResetSuccessEmail(user.getEmail(), user.getName(), user.getId(), null);

        return "Password has been successfully reset. You may now log in.";
    }

    public String initiateUpdatePassword(String userId, UpdatePasswordRequest request) {
        User user = userRepository.findByIdIgnoreCase(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        String rawCurrent = request.getCurrentPassword();
        boolean matches = passwordEncoder.matches(rawCurrent, user.getPassword()) ||
                          passwordEncoder.matches(rawCurrent.trim(), user.getPassword()) ||
                          rawCurrent.equals(user.getPassword());

        if (!matches) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("newPassword", request.getNewPassword().trim());

        String rawOtp = otpStorageService.createAndStoreOtp(user.getEmail(), user.getId(), "UPDATE_PASSWORD", payload);
        emailService.sendOtpEmail(user.getEmail(), user.getName(), rawOtp, "Password Update", OtpStorageService.OTP_VALIDITY_SECONDS);

        return "OTP sent to " + user.getEmail();
    }

    @Transactional
    public String completeUpdatePassword(String userId, OtpVerifyRequest request) {
        User user = userRepository.findByIdIgnoreCase(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        Map<String, Object> payload = otpStorageService.verifyOtp(user.getEmail(), "UPDATE_PASSWORD", request.getOtp());
        String newPassword = (String) payload.get("newPassword");

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        auditService.log(
                user.getId(),
                user.getRole().name(),
                "Update Password",
                user.getId() + " (" + user.getName() + ") updated account password via OTP verification"
        );

        emailService.sendPasswordUpdatedEmail(user.getEmail(), user.getName(), user.getId(), null);

        return "Password successfully updated.";
    }

    public String initiateUpdateEmail(String userId, UpdateEmailRequest request) {
        User user = userRepository.findByIdIgnoreCase(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        String targetEmail = request.getNewEmail().trim().toLowerCase();
        if (targetEmail.equalsIgnoreCase(user.getEmail())) {
            throw new IllegalArgumentException("New email address must be different from current email.");
        }

        if (userRepository.existsByEmailIgnoreCaseAndRole(targetEmail, user.getRole())) {
            throw new IllegalArgumentException("An account with this email address already exists.");
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("newEmail", targetEmail);
        payload.put("oldEmail", user.getEmail());

        String rawOtp = otpStorageService.createAndStoreOtp(targetEmail, user.getId(), "UPDATE_EMAIL", payload);
        emailService.sendOtpEmail(targetEmail, user.getName(), rawOtp, "Email Address Update", OtpStorageService.OTP_VALIDITY_SECONDS);

        return "OTP sent to " + targetEmail;
    }

    @Transactional
    public String completeUpdateEmail(String userId, OtpVerifyRequest request) {
        User user = userRepository.findByIdIgnoreCase(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        String targetEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        Map<String, Object> payload = otpStorageService.verifyOtp(targetEmail, "UPDATE_EMAIL", request.getOtp());
        String verifiedNewEmail = (String) payload.get("newEmail");
        String oldEmail = user.getEmail();

        user.setEmail(verifiedNewEmail);
        userRepository.save(user);

        // Keep voter/candidate linked emails in sync if applicable
        if (user.getRole() == Role.CANDIDATE && user.getVoterId() != null) {
            userRepository.findByIdIgnoreCase(user.getVoterId()).ifPresent(v -> {
                v.setEmail(verifiedNewEmail);
                userRepository.save(v);
            });
        } else if (user.getRole() == Role.VOTER) {
            userRepository.findByVoterId(user.getId()).ifPresent(c -> {
                c.setEmail(verifiedNewEmail);
                userRepository.save(c);
            });
        }

        auditService.log(
                user.getId(),
                user.getRole().name(),
                "Update Email",
                user.getId() + " updated email from " + oldEmail + " to " + verifiedNewEmail
        );

        emailService.sendEmailUpdatedEmail(verifiedNewEmail, user.getName(), oldEmail, verifiedNewEmail, null);
        emailService.sendEmailUpdatedEmail(oldEmail, user.getName(), oldEmail, verifiedNewEmail, null);

        return "Email address successfully updated.";
    }
}
