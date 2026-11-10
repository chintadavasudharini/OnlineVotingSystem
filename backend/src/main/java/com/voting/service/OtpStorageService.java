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
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Concurrency-safe, in-memory OTP storage and verification engine.
 * STRICTLY MEMORY-ONLY: Zero database tables used.
 */
@Service
public class OtpStorageService {

    private static final Logger logger = LoggerFactory.getLogger(OtpStorageService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // Custom pools matching pattern: Uppercase + Lowercase + Number (repeated twice)
    private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijkmnpqrstuvwxyz";
    private static final String DIGITS = "23456789";

    public static final int OTP_VALIDITY_SECONDS = 30;
    public static final int RESEND_COOLDOWN_SECONDS = 30;
    public static final int MAX_RESENDS_PER_HOUR = 5;
    public static final int MAX_ATTEMPTS_PER_OTP = 5;
    public static final int MAX_VERIFICATIONS_PER_HOUR = 10;

    public static class OtpRecord {
        private final String otpHash;
        private final String email;
        private final String userId;
        private final String purpose;
        private final Instant createdAt;
        private final Instant expiresAt;
        private final AtomicInteger attempts = new AtomicInteger(0);
        private volatile boolean isInvalidated = false;
        private final Map<String, Object> pendingPayload;

        public OtpRecord(String otpHash, String email, String userId, String purpose, Instant createdAt, Instant expiresAt, Map<String, Object> pendingPayload) {
            this.otpHash = otpHash;
            this.email = email;
            this.userId = userId;
            this.purpose = purpose;
            this.createdAt = createdAt;
            this.expiresAt = expiresAt;
            this.pendingPayload = pendingPayload != null ? new HashMap<>(pendingPayload) : Collections.emptyMap();
        }

        public String getOtpHash() { return otpHash; }
        public String getEmail() { return email; }
        public String getUserId() { return userId; }
        public String getPurpose() { return purpose; }
        public Instant getCreatedAt() { return createdAt; }
        public Instant getExpiresAt() { return expiresAt; }
        public int getAttempts() { return attempts.get(); }
        public int incrementAttempts() { return attempts.incrementAndGet(); }
        public boolean isInvalidated() { return isInvalidated; }
        public void setInvalidated(boolean invalidated) { isInvalidated = invalidated; }
        public Map<String, Object> getPendingPayload() { return pendingPayload; }
    }

    // In-memory tables (key: email.toLowerCase() + ":" + purpose)
    private final Map<String, OtpRecord> otpStore = new ConcurrentHashMap<>();
    private final Map<String, List<Instant>> resendTimestamps = new ConcurrentHashMap<>();
    private final Map<String, List<Instant>> verifyTimestamps = new ConcurrentHashMap<>();

    /**
     * Generates a cryptographically random 6-character OTP adhering to:
     * Uppercase + Lowercase + Number + Uppercase + Lowercase + Number (e.g., Bv3Ch8)
     */
    public String generateOtp() {
        return "" +
                UPPER.charAt(SECURE_RANDOM.nextInt(UPPER.length())) +
                LOWER.charAt(SECURE_RANDOM.nextInt(LOWER.length())) +
                DIGITS.charAt(SECURE_RANDOM.nextInt(DIGITS.length())) +
                UPPER.charAt(SECURE_RANDOM.nextInt(UPPER.length())) +
                LOWER.charAt(SECURE_RANDOM.nextInt(LOWER.length())) +
                DIGITS.charAt(SECURE_RANDOM.nextInt(DIGITS.length()));
    }

    /**
     * SHA-256 hash helper for memory storage.
     */
    public String hash(String input) {
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
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Stores an OTP temporarily in memory after verifying rolling hourly limits.
     */
    public synchronized String createAndStoreOtp(String email, String userId, String purpose, Map<String, Object> payload) {
        String normalizedEmail = email.trim().toLowerCase();
        Instant now = Instant.now();

        // 1. Check rolling 60-minute resend limit (max 5 per hour)
        List<Instant> resends = resendTimestamps.computeIfAbsent(normalizedEmail, k -> Collections.synchronizedList(new ArrayList<>()));
        synchronized (resends) {
            resends.removeIf(ts -> ts.isBefore(now.minus(1, ChronoUnit.HOURS)));
            if (resends.size() >= MAX_RESENDS_PER_HOUR) {
                throw new IllegalStateException("Hourly resend limit reached (" + MAX_RESENDS_PER_HOUR + "/hour). Please wait before requesting another OTP.");
            }

            // 2. Check 30-second resend cooldown against existing active OTP
            String key = normalizedEmail + ":" + purpose.toUpperCase();
            OtpRecord existing = otpStore.get(key);
            if (existing != null && !existing.isInvalidated() && existing.getCreatedAt().plus(RESEND_COOLDOWN_SECONDS, ChronoUnit.SECONDS).isAfter(now)) {
                long remaining = ChronoUnit.SECONDS.between(now, existing.getCreatedAt().plus(RESEND_COOLDOWN_SECONDS, ChronoUnit.SECONDS));
                if (remaining > 0) {
                    throw new IllegalStateException("Please wait " + remaining + " seconds before requesting a new OTP.");
                }
            }

            // Record this resend/send attempt
            resends.add(now);
        }

        // 3. Generate raw OTP and hash it
        String rawOtp = generateOtp();
        String hashedOtp = hash(rawOtp);
        Instant expiresAt = now.plus(OTP_VALIDITY_SECONDS, ChronoUnit.SECONDS);

        OtpRecord record = new OtpRecord(hashedOtp, normalizedEmail, userId, purpose.toUpperCase(), now, expiresAt, payload);

        // Invalidate any pre-existing OTP for same purpose
        String key = normalizedEmail + ":" + purpose.toUpperCase();
        OtpRecord old = otpStore.put(key, record);
        if (old != null) {
            old.setInvalidated(true);
        }

        logger.debug("Stored temporary in-memory OTP for {} (purpose: {}, expires: {}s)", normalizedEmail, purpose, OTP_VALIDITY_SECONDS);
        return rawOtp;
    }

    /**
     * Authoritative backend OTP verification.
     */
    public synchronized Map<String, Object> verifyOtp(String email, String purpose, String submittedOtp) {
        String normalizedEmail = email.trim().toLowerCase();
        Instant now = Instant.now();

        // 1. Check rolling 60-minute verification requests limit (max 10 per hour)
        List<Instant> verifications = verifyTimestamps.computeIfAbsent(normalizedEmail, k -> Collections.synchronizedList(new ArrayList<>()));
        synchronized (verifications) {
            verifications.removeIf(ts -> ts.isBefore(now.minus(1, ChronoUnit.HOURS)));
            if (verifications.size() >= MAX_VERIFICATIONS_PER_HOUR) {
                throw new IllegalStateException("Maximum verification attempts reached (10/hour). Please try again later.");
            }
            verifications.add(now);
        }

        String key = normalizedEmail + ":" + purpose.toUpperCase();
        OtpRecord record = otpStore.get(key);

        if (record == null) {
            throw new IllegalArgumentException("No active OTP request found for this email and purpose. Please request a new code.");
        }

        if (record.isInvalidated()) {
            otpStore.remove(key);
            throw new IllegalArgumentException("This OTP has been invalidated due to maximum attempts or a new code request. Please request a new code.");
        }

        // 2. Check Expiry (Strictly 30 seconds)
        if (now.isAfter(record.getExpiresAt())) {
            record.setInvalidated(true);
            otpStore.remove(key);
            throw new IllegalArgumentException("OTP Expired. Verification codes are valid for strictly 30 seconds. Please click Resend OTP.");
        }

        // 3. Check Incorrect Attempts (Max 5 attempts)
        int attempt = record.incrementAttempts();
        if (attempt > MAX_ATTEMPTS_PER_OTP) {
            record.setInvalidated(true);
            otpStore.remove(key);
            throw new IllegalArgumentException("Exceeded maximum incorrect attempts (5). This OTP has been invalidated for security. Please request a new code.");
        }

        // 4. Constant-time hash verification
        String submittedHash = hash(submittedOtp.trim());
        boolean matches = MessageDigest.isEqual(
                record.getOtpHash().getBytes(StandardCharsets.UTF_8),
                submittedHash.getBytes(StandardCharsets.UTF_8)
        );

        if (!matches) {
            int remaining = MAX_ATTEMPTS_PER_OTP - attempt;
            if (remaining <= 0) {
                record.setInvalidated(true);
                otpStore.remove(key);
                throw new IllegalArgumentException("Invalid OTP. Maximum attempts reached; this code has been revoked. Please request a new code.");
            }
            throw new IllegalArgumentException("Invalid OTP code. " + remaining + " attempt(s) remaining.");
        }

        // 5. Verification Successful: Single-use consumption
        otpStore.remove(key);
        logger.info("Successfully verified in-memory OTP for {} (purpose: {})", normalizedEmail, purpose);
        return record.getPendingPayload();
    }

    /**
     * Automatic periodic in-memory cleanup of expired entries (runs every 10 seconds).
     */
    @Scheduled(fixedRate = 10000)
    public void cleanupExpiredEntries() {
        Instant now = Instant.now();
        otpStore.entrySet().removeIf(entry -> {
            OtpRecord r = entry.getValue();
            return r.isInvalidated() || now.isAfter(r.getExpiresAt().plus(60, ChronoUnit.SECONDS));
        });

        resendTimestamps.values().forEach(list -> {
            synchronized (list) {
                list.removeIf(ts -> ts.isBefore(now.minus(1, ChronoUnit.HOURS)));
            }
        });

        verifyTimestamps.values().forEach(list -> {
            synchronized (list) {
                list.removeIf(ts -> ts.isBefore(now.minus(1, ChronoUnit.HOURS)));
            }
        });
    }
}
