package com.voting.controller;

import com.voting.dto.ApiResponse;
import com.voting.dto.AuthRequest;
import com.voting.dto.AuthResponse;
import com.voting.dto.CandidateRegisterRequest;
import com.voting.dto.VoterRegisterRequest;
import com.voting.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
}
