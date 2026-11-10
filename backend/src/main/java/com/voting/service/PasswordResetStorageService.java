package com.voting.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Concurrency-safe, in-memory Password Reset Token manager.
 * STRICTLY MEMORY-ONLY: Zero database tables used.
 * Tokens valid for exactly 1 minute and strictly single-use.
 */
@Service
public class PasswordResetStorageService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetStorageService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    public static final int RESET_TOKEN_VALIDITY_SECONDS = 60; // Exactly 1 minute

    public static class ResetTokenRecord {
        private final String tokenHash;
        private final String userId;
        private final String email;
        private final String role;
        private final Instant createdAt;
        private final Instant expiresAt;
        private volatile boolean isUsed = false;

        public ResetTokenRecord(String tokenHash, String userId, String email, String role, Instant createdAt, Instant expiresAt) {
            this.tokenHash = tokenHash;
            this.userId = userId;
            this.email = email;
            this.role = role;
            this.createdAt = createdAt;
            this.expiresAt = expiresAt;
        }

        public String getTokenHash() { return tokenHash; }
        public String getUserId() { return userId; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
        public Instant getCreatedAt() { return createdAt; }
        public Instant getExpiresAt() { return expiresAt; }
        public boolean isUsed() { return isUsed; }
        public void setUsed(boolean used) { isUsed = used; }
    }

    // Key: tokenHash (SHA-256), Value: ResetTokenRecord
    private final Map<String, ResetTokenRecord> tokenStore = new ConcurrentHashMap<>();
    // Lookup to invalidate prior links for same user: Key: userId, Value: tokenHash
    private final Map<String, String> userTokens = new ConcurrentHashMap<>();

    private String hash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    /**
     * Generates a 32-byte secure reset token and stores its SHA-256 hash in memory for 1 minute.
     * Returns raw token string for inclusion in email URL.
     */
    public synchronized String createAndStoreResetToken(String userId, String email, String role) {
        Instant now = Instant.now();

        // Invalidate prior token for user if exists
        String existingHash = userTokens.remove(userId);
        if (existingHash != null) {
            tokenStore.remove(existingHash);
        }

        // Generate 32-byte secure token (URL-safe base64)
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        String tokenHash = hash(rawToken);
        Instant expiresAt = now.plus(RESET_TOKEN_VALIDITY_SECONDS, ChronoUnit.SECONDS);

        ResetTokenRecord record = new ResetTokenRecord(tokenHash, userId, email, role, now, expiresAt);
        tokenStore.put(tokenHash, record);
        userTokens.put(userId, tokenHash);

        logger.debug("Stored in-memory password reset token for {} (validity: 1 min)", userId);
        return rawToken;
    }

    /**
     * Authoritative single-use token validation and consumption.
     */
    public synchronized ResetTokenRecord validateAndConsumeToken(String rawToken) {
        if (rawToken == null || rawToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Invalid password reset token.");
        }

        String tokenHash = hash(rawToken.trim());
        ResetTokenRecord record = tokenStore.get(tokenHash);

        if (record == null) {
            throw new IllegalArgumentException("This reset link is invalid or has already been used. Please request a new link.");
        }

        Instant now = Instant.now();
        if (now.isAfter(record.getExpiresAt())) {
            tokenStore.remove(tokenHash);
            userTokens.remove(record.getUserId());
            throw new IllegalArgumentException("This reset link has expired (1-minute validity limit). Please request a new link.");
        }

        if (record.isUsed()) {
            tokenStore.remove(tokenHash);
            userTokens.remove(record.getUserId());
            throw new IllegalArgumentException("This reset link has already been used once. Please request a new link.");
        }

        // Single-use: Mark used and remove immediately from memory
        record.setUsed(true);
        tokenStore.remove(tokenHash);
        userTokens.remove(record.getUserId());

        logger.info("Successfully validated and consumed in-memory reset token for user {}", record.getUserId());
        return record;
    }

    /**
     * Automatic periodic in-memory cleanup of expired tokens (runs every 10 seconds).
     */
    @Scheduled(fixedRate = 10000)
    public void cleanupExpiredTokens() {
        Instant now = Instant.now();
        tokenStore.entrySet().removeIf(entry -> {
            ResetTokenRecord r = entry.getValue();
            boolean expired = r.isUsed() || now.isAfter(r.getExpiresAt().plus(30, ChronoUnit.SECONDS));
            if (expired) {
                userTokens.remove(r.getUserId());
            }
            return expired;
        });
    }
}
