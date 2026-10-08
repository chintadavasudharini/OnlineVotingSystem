package com.voting.controller;

import com.voting.dto.ApiResponse;
import com.voting.dto.CandidateDetailDto;
import com.voting.dto.CandidateElectionRegisterRequest;
import com.voting.entity.CandidateRegistration;
import com.voting.entity.User;
import com.voting.service.CandidateService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidates")
public class CandidateController {

    @Autowired
    private CandidateService candidateService;

    @GetMapping("/election/{electionId}")
    public ResponseEntity<ApiResponse<List<CandidateDetailDto>>> getCandidatesForElection(@PathVariable String electionId) {
        List<CandidateDetailDto> candidates = candidateService.getCandidatesForElection(electionId);
        return ResponseEntity.ok(ApiResponse.ok("Candidates retrieved", candidates));
    }

    @PostMapping("/register-for-election")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<CandidateRegistration>> registerForElection(
            @Valid @RequestBody CandidateElectionRegisterRequest request,
            Authentication authentication) {
        String candidateId = authentication.getName();
        CandidateRegistration reg = candidateService.registerForElection(candidateId, request);
        return ResponseEntity.ok(ApiResponse.ok("Registered for election successfully", reg));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getAllCandidates() {
        List<User> list = candidateService.getAllCandidates();
        return ResponseEntity.ok(ApiResponse.ok("All candidates retrieved", list));
    }

    @GetMapping("/is-registered")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<Boolean>> isRegistered(
            @RequestParam String electionId,
            Authentication authentication) {
        String candidateId = authentication.getName();
        boolean registered = candidateService.isRegisteredForElection(candidateId, electionId);
        return ResponseEntity.ok(ApiResponse.ok("Registration check", registered));
    }
}
