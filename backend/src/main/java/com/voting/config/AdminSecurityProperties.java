package com.voting.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * Enterprise Admin Security Configuration & Profile Enforcement Engine.
 * 
 * In 'dev' profile:
 *   - Retains demo credentials ('admin' / 'admin') for college presentations & local dev.
 * 
 * In 'prod' profile:
 *   - Strictly requires ADMIN_USERNAME and ADMIN_PASSWORD environment variables.
 *   - Startup aborts immediately if either is missing, blank, or using insecure 'admin/admin'.
 *   - Never logs or stores plaintext passwords.
 */
@Component
public class AdminSecurityProperties {

    private static final Logger logger = LoggerFactory.getLogger(AdminSecurityProperties.class);
    private static final BCryptPasswordEncoder BCRYPT = new BCryptPasswordEncoder();

    @Value("${app.admin.username:}")
    private String configuredUsername;

    @Value("${app.admin.password:}")
    private String configuredPassword;

    @Autowired
    private Environment environment;

    private String adminUsername;
    private String bcryptHashedPassword;
    private boolean isProduction;

    @PostConstruct
    public void validateAndInitialize() {
        isProduction = Arrays.stream(environment.getActiveProfiles())
                .anyMatch(p -> p.equalsIgnoreCase("prod"));

        if (isProduction) {
            String u = configuredUsername != null ? configuredUsername.trim() : "";
            String p = configuredPassword != null ? configuredPassword.trim() : "";

            if (u.isEmpty()) {
                throw new IllegalStateException(
                        "CRITICAL SECURITY CONFIGURATION ERROR: Production ADMIN_USERNAME environment variable is missing or blank! Application startup aborted.");
            }

            if (p.isEmpty()) {
                throw new IllegalStateException(
                        "CRITICAL SECURITY CONFIGURATION ERROR: Production ADMIN_PASSWORD environment variable is missing or blank! Application startup aborted.");
            }

            if ("admin".equalsIgnoreCase(u) && "admin".equals(p)) {
                throw new IllegalStateException(
                        "CRITICAL SECURITY CONFIGURATION ERROR: Default demo credentials 'admin/admin' are strictly prohibited in production! Application startup aborted.");
            }

            if ("admin".equals(p)) {
                throw new IllegalStateException(
                        "CRITICAL SECURITY CONFIGURATION ERROR: Default demo password 'admin' is prohibited in production! Application startup aborted.");
            }

            if (p.length() < 8) {
                throw new IllegalStateException(
                        "CRITICAL SECURITY CONFIGURATION ERROR: Production ADMIN_PASSWORD must be at least 8 characters long! Application startup aborted.");
            }

            this.adminUsername = u;
            this.bcryptHashedPassword = BCRYPT.encode(p);

            logger.info("Production Admin Security verified and locked. Admin username: [{}]. Plaintext credentials never logged or retained.", adminUsername);
        } else {
            // Development / Demonstration Profile
            this.adminUsername = (configuredUsername != null && !configuredUsername.trim().isEmpty())
                    ? configuredUsername.trim()
                    : "admin";

            String devPass = (configuredPassword != null && !configuredPassword.trim().isEmpty())
                    ? configuredPassword.trim()
                    : "admin";

            this.bcryptHashedPassword = BCRYPT.encode(devPass);

            logger.info("Development profile active. Admin credentials initialized for local demonstration.");
        }
    }

    public String getAdminUsername() {
        return adminUsername;
    }

    public String getEncodedPassword() {
        return bcryptHashedPassword;
    }

    public boolean isProduction() {
        return isProduction;
    }

    /**
     * Constant-time BCrypt verification of submitted credentials.
     */
    public boolean matches(String rawPassword) {
        if (rawPassword == null) return false;
        return BCRYPT.matches(rawPassword, bcryptHashedPassword) ||
               BCRYPT.matches(rawPassword.trim(), bcryptHashedPassword);
    }

    @Override
    public String toString() {
        return "AdminSecurityProperties{" +
                "adminUsername='" + adminUsername + '\'' +
                ", isProduction=" + isProduction +
                ", password=[PROTECTED]" +
                '}';
    }
}
