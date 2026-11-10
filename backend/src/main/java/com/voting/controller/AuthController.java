package com.voting.controller;

import com.voting.dto.*;
import com.voting.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/register-voter")
    public ResponseEntity<ApiResponse<AuthResponse>> registerVoter(@Valid @RequestBody VoterRegisterRequest request) {
        AuthResponse response = authService.registerVoter(request);
        return ResponseEntity.ok(ApiResponse.ok("Voter registered successfully", response));
    }

    @PostMapping("/register-candidate")
    public ResponseEntity<ApiResponse<AuthResponse>> registerCandidate(@Valid @RequestBody CandidateRegisterRequest request) {
        AuthResponse response = authService.registerCandidate(request);
        return ResponseEntity.ok(ApiResponse.ok("Candidate account created successfully", response));
    }

    // ==========================================
    // OTP REGISTRATION ENDPOINTS
    // ==========================================

    @PostMapping("/register/send-otp")
    public ResponseEntity<ApiResponse<String>> sendVoterRegisterOtp(@Valid @RequestBody VoterRegisterRequest request) {
        String msg = authService.initiateVoterRegistration(request);
        return ResponseEntity.ok(ApiResponse.ok(msg, msg));
    }

    @PostMapping("/register/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyVoterRegisterOtp(@Valid @RequestBody OtpVerifyRequest request) {
        AuthResponse response = authService.completeVoterRegistration(request);
        return ResponseEntity.ok(ApiResponse.ok("Voter registered successfully", response));
    }

    @PostMapping("/candidate-register/send-otp")
    public ResponseEntity<ApiResponse<String>> sendCandidateRegisterOtp(@Valid @RequestBody CandidateRegisterRequest request) {
        String msg = authService.initiateCandidateRegistration(request);
        return ResponseEntity.ok(ApiResponse.ok(msg, msg));
    }

    @PostMapping("/candidate-register/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyCandidateRegisterOtp(@Valid @RequestBody OtpVerifyRequest request) {
        AuthResponse response = authService.completeCandidateRegistration(request);
        return ResponseEntity.ok(ApiResponse.ok("Candidate registered successfully", response));
    }

    // ==========================================
    // PASSWORD RECOVERY ENDPOINTS
    // ==========================================

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            @RequestHeader(value = "Origin", required = false) String origin,
            HttpServletRequest servletRequest) {
        String baseUrl = origin;
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = servletRequest.getScheme() + "://" + servletRequest.getServerName() +
                    (servletRequest.getServerPort() == 80 || servletRequest.getServerPort() == 443 ? "" : ":" + servletRequest.getServerPort());
        }
        String msg = authService.initiateForgotPassword(request, baseUrl);
        return ResponseEntity.ok(ApiResponse.ok(msg, msg));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String msg = authService.completePasswordReset(request);
        return ResponseEntity.ok(ApiResponse.ok(msg, msg));
    }

    // ==========================================
    // ACCOUNT PROFILE SECURITY ENDPOINTS (AUTHENTICATED)
    // ==========================================

    @PostMapping("/update-password/send-otp")
    public ResponseEntity<ApiResponse<String>> sendUpdatePasswordOtp(
            @Valid @RequestBody UpdatePasswordRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        String msg = authService.initiateUpdatePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(msg, msg));
    }

    @PostMapping("/update-password/verify-otp")
    public ResponseEntity<ApiResponse<String>> verifyUpdatePasswordOtp(
            @Valid @RequestBody OtpVerifyRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        String msg = authService.completeUpdatePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(msg, msg));
    }

    @PostMapping("/update-email/send-otp")
    public ResponseEntity<ApiResponse<String>> sendUpdateEmailOtp(
            @Valid @RequestBody UpdateEmailRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        String msg = authService.initiateUpdateEmail(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(msg, msg));
    }

    @PostMapping("/update-email/verify-otp")
    public ResponseEntity<ApiResponse<String>> verifyUpdateEmailOtp(
            @Valid @RequestBody OtpVerifyRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        String msg = authService.completeUpdateEmail(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(msg, msg));
    }
}
