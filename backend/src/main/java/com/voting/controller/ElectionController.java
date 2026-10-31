package com.voting.controller;

import com.voting.dto.ApiResponse;
import com.voting.dto.ElectionRequest;
import com.voting.dto.ElectionResponse;
import com.voting.service.ElectionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/elections")
public class ElectionController {

    @Autowired
    private ElectionService electionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ElectionResponse>>> getAllElections() {
        List<ElectionResponse> list = electionService.getAllElections();
        return ResponseEntity.ok(ApiResponse.ok("Elections retrieved", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ElectionResponse>> getElectionById(@PathVariable String id) {
        ElectionResponse response = electionService.getElectionById(id);
        return ResponseEntity.ok(ApiResponse.ok("Election retrieved", response));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ElectionResponse>> createElection(
            @Valid @RequestBody ElectionRequest request,
            Authentication authentication) {
        String adminId = authentication != null ? authentication.getName() : "admin";
        ElectionResponse created = electionService.createElection(request, adminId);
        return ResponseEntity.ok(ApiResponse.ok("Election created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ElectionResponse>> updateElection(
            @PathVariable String id,
            @Valid @RequestBody ElectionRequest request,
            Authentication authentication) {
        String adminId = authentication != null ? authentication.getName() : "admin";
        ElectionResponse updated = electionService.updateElection(id, request, adminId);
        return ResponseEntity.ok(ApiResponse.ok("Election updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteElection(
            @PathVariable String id,
            Authentication authentication) {
        String adminId = authentication != null ? authentication.getName() : "admin";
        electionService.deleteElection(id, adminId);
        return ResponseEntity.ok(ApiResponse.ok("Election deleted successfully", null));
    }

    @PostMapping("/{id}/publish-results")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ElectionResponse>> publishResults(
            @PathVariable String id,
            Authentication authentication) {
        String adminId = authentication != null ? authentication.getName() : "admin";
        ElectionResponse response = electionService.publishResults(id, adminId);
        return ResponseEntity.ok(ApiResponse.ok("Results published successfully", response));
    }
}
