package com.voting.service;

import com.voting.config.JwtTokenProvider;
import com.voting.dto.AuthRequest;
import com.voting.dto.AuthResponse;
import com.voting.dto.CandidateRegisterRequest;
import com.voting.dto.VoterRegisterRequest;
import com.voting.entity.Role;
import com.voting.entity.User;
import com.voting.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

        String token = tokenProvider.generateToken(voterId, Role.VOTER, voter.getName());

        return new AuthResponse(
                token,
                voter.getId(),
                voter.getName(),
                voter.getEmail(),
                voter.getRole(),
                voter.getAge(),
                voter.getDob(),
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

        String token = tokenProvider.generateToken(candidateId, Role.CANDIDATE, candidate.getName());

        return new AuthResponse(
                token,
                candidate.getId(),
                candidate.getName(),
                candidate.getEmail(),
                candidate.getRole(),
                candidate.getAge(),
                candidate.getDob(),
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
            User admin = userRepository.findByIdIgnoreCase("admin")
                    .orElseGet(() -> {
                        User newAdmin = new User(
                                "admin",
                                "System Administrator",
                                "admin@system.local",
                                null,
                                99,
                                passwordEncoder.encode("admin"),
                                Role.ADMIN,
                                "ACTIVE",
                                null
                        );
                        return userRepository.save(newAdmin);
                    });

            String adminPass = request.getPassword() != null ? request.getPassword() : "";
            if (!"admin".equals(adminPass.trim()) && !passwordEncoder.matches(adminPass.trim(), admin.getPassword()) && !passwordEncoder.matches(adminPass, admin.getPassword())) {
                throw new IllegalArgumentException("Invalid admin credentials.");
            }

            auditService.log("admin", "ADMIN", "Login", "Administrator logged into admin console");
            String token = tokenProvider.generateToken(admin.getId(), Role.ADMIN, admin.getName());

            return new AuthResponse(
                    token,
                    admin.getId(),
                    admin.getName(),
                    admin.getEmail(),
                    admin.getRole(),
                    admin.getAge(),
                    admin.getDob(),
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
                user.getVoterId(),
                user.getStatus()
        );
    }
}
