package com.voting;

import com.voting.config.AdminSecurityProperties;
import com.voting.config.JwtTokenProvider;
import com.voting.dto.AuthRequest;
import com.voting.dto.AuthResponse;
import com.voting.entity.Role;
import com.voting.repository.UserRepository;
import com.voting.service.AuthService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminProfileSecurityTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private AdminSecurityProperties adminSecurityProperties;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // =========================================================================
    // DEVELOPMENT PROFILE TESTS
    // =========================================================================

    /**
     * Test 1: In development profile, admin/admin successfully logs in.
     */
    @Test
    public void testDevProfileAdminAdminLoginSuccess() {
        AuthRequest request = new AuthRequest("admin", "admin", "ADMIN");
        AuthResponse response = authService.login(request);

        Assertions.assertNotNull(response);
        Assertions.assertEquals("admin", response.getId());
        Assertions.assertEquals(Role.ADMIN, response.getRole());
        Assertions.assertNotNull(response.getToken());

        // Verify JWT token validity and role
        Assertions.assertTrue(tokenProvider.validateToken(response.getToken()));
        Assertions.assertEquals("ADMIN", tokenProvider.getRoleFromToken(response.getToken()));
    }

    /**
     * Test 2: In development profile, invalid password for admin is rejected.
     */
    @Test
    public void testDevProfileAdminInvalidPasswordRejected() {
        AuthRequest request = new AuthRequest("admin", "wrong_password", "ADMIN");
        Assertions.assertThrows(IllegalArgumentException.class, () -> authService.login(request));
    }

    // =========================================================================
    // PRODUCTION CONFIGURATION & STARTUP SAFEGUARDS
    // =========================================================================

    /**
     * Test 3: Missing ADMIN_USERNAME in production aborts startup.
     */
    @Test
    public void testProdStartupFailsWhenMissingUsername() {
        AdminSecurityProperties prodProps = new AdminSecurityProperties();
        MockEnvironment mockEnv = new MockEnvironment();
        mockEnv.setActiveProfiles("prod");

        ReflectionTestUtils.setField(prodProps, "environment", mockEnv);
        ReflectionTestUtils.setField(prodProps, "configuredUsername", "");
        ReflectionTestUtils.setField(prodProps, "configuredPassword", "SuperSecurePass123!");

        IllegalStateException ex = Assertions.assertThrows(IllegalStateException.class, prodProps::validateAndInitialize);
        Assertions.assertTrue(ex.getMessage().contains("ADMIN_USERNAME"), "Must report missing username: " + ex.getMessage());
    }

    /**
     * Test 4: Missing ADMIN_PASSWORD in production aborts startup.
     */
    @Test
    public void testProdStartupFailsWhenMissingPassword() {
        AdminSecurityProperties prodProps = new AdminSecurityProperties();
        MockEnvironment mockEnv = new MockEnvironment();
        mockEnv.setActiveProfiles("prod");

        ReflectionTestUtils.setField(prodProps, "environment", mockEnv);
        ReflectionTestUtils.setField(prodProps, "configuredUsername", "prod_superadmin");
        ReflectionTestUtils.setField(prodProps, "configuredPassword", "   ");

        IllegalStateException ex = Assertions.assertThrows(IllegalStateException.class, prodProps::validateAndInitialize);
        Assertions.assertTrue(ex.getMessage().contains("ADMIN_PASSWORD"), "Must report missing password: " + ex.getMessage());
    }

    /**
     * Test 5: Insecure demo credentials 'admin/admin' strictly prohibited in production.
     */
    @Test
    public void testProdStartupFailsWithDemoCredentials() {
        AdminSecurityProperties prodProps = new AdminSecurityProperties();
        MockEnvironment mockEnv = new MockEnvironment();
        mockEnv.setActiveProfiles("prod");

        ReflectionTestUtils.setField(prodProps, "environment", mockEnv);
        ReflectionTestUtils.setField(prodProps, "configuredUsername", "admin");
        ReflectionTestUtils.setField(prodProps, "configuredPassword", "admin");

        IllegalStateException ex = Assertions.assertThrows(IllegalStateException.class, prodProps::validateAndInitialize);
        Assertions.assertTrue(ex.getMessage().contains("admin/admin") || ex.getMessage().contains("prohibited"),
                "Must prohibit demo credentials in prod: " + ex.getMessage());
    }

    /**
     * Test 6: Insecure short password (< 8 chars) aborts startup in production.
     */
    @Test
    public void testProdStartupFailsWithShortPassword() {
        AdminSecurityProperties prodProps = new AdminSecurityProperties();
        MockEnvironment mockEnv = new MockEnvironment();
        mockEnv.setActiveProfiles("prod");

        ReflectionTestUtils.setField(prodProps, "environment", mockEnv);
        ReflectionTestUtils.setField(prodProps, "configuredUsername", "prod_admin");
        ReflectionTestUtils.setField(prodProps, "configuredPassword", "short1");

        IllegalStateException ex = Assertions.assertThrows(IllegalStateException.class, prodProps::validateAndInitialize);
        Assertions.assertTrue(ex.getMessage().contains("at least 8 characters"),
                "Must enforce min length: " + ex.getMessage());
    }

    /**
     * Test 7: Valid production configuration initializes correctly.
     */
    @Test
    public void testProdValidConfigurationInitializes() {
        AdminSecurityProperties prodProps = new AdminSecurityProperties();
        MockEnvironment mockEnv = new MockEnvironment();
        mockEnv.setActiveProfiles("prod");

        ReflectionTestUtils.setField(prodProps, "environment", mockEnv);
        ReflectionTestUtils.setField(prodProps, "configuredUsername", "chief_election_officer");
        ReflectionTestUtils.setField(prodProps, "configuredPassword", "V0t1ngSystem#2026Secure!");

        prodProps.validateAndInitialize();

        Assertions.assertTrue(prodProps.isProduction());
        Assertions.assertEquals("chief_election_officer", prodProps.getAdminUsername());
        Assertions.assertTrue(prodProps.matches("V0t1ngSystem#2026Secure!"));
        Assertions.assertFalse(prodProps.matches("admin"));
        Assertions.assertFalse(prodProps.matches("wrong_password"));
    }

    /**
     * Test 8: Plaintext password is never logged or exposed in toString().
     */
    @Test
    public void testProductionPasswordNeverLoggedOrExposed() {
        AdminSecurityProperties prodProps = new AdminSecurityProperties();
        MockEnvironment mockEnv = new MockEnvironment();
        mockEnv.setActiveProfiles("prod");

        ReflectionTestUtils.setField(prodProps, "environment", mockEnv);
        ReflectionTestUtils.setField(prodProps, "configuredUsername", "prod_superadmin");
        ReflectionTestUtils.setField(prodProps, "configuredPassword", "SecretProductionPass#99");

        prodProps.validateAndInitialize();

        String str = prodProps.toString();
        Assertions.assertFalse(str.contains("SecretProductionPass#99"), "Plaintext production password must NEVER appear in toString()");
        Assertions.assertTrue(str.contains("[PROTECTED]"), "Must indicate protected password field");
    }

    // =========================================================================
    // REGRESSION TESTS
    // =========================================================================

    /**
     * Regression Test 9: Verify exactly 5 application tables exist in PostgreSQL database.
     * ZERO new tables created.
     */
    @Test
    public void testDatabaseTablesCountRemainsFive() {
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'",
                String.class
        );

        List<String> expectedTables = List.of("users", "elections", "candidate_registrations", "votes", "audit_logs");
        for (String expected : expectedTables) {
            Assertions.assertTrue(tables.contains(expected), "Database must contain required table: " + expected);
        }

        Assertions.assertFalse(tables.contains("otp_verifications"), "Must NOT contain otp_verifications table");
        Assertions.assertFalse(tables.contains("password_reset_tokens"), "Must NOT contain password_reset_tokens table");
        Assertions.assertFalse(tables.contains("email_notification_logs"), "Must NOT contain email_notification_logs table");
        Assertions.assertEquals(5, tables.size(), "Database must strictly contain exactly 5 tables. Found: " + tables);
    }
}
