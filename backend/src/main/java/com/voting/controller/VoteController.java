package com.voting.controller;

import com.voting.dto.ApiResponse;
import com.voting.dto.CastVoteRequest;
import com.voting.dto.ElectionResultResponse;
import com.voting.entity.Vote;
import com.voting.service.VoteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/votes")
public class VoteController {

    @Autowired
    private VoteService voteService;

    @PostMapping("/cast")
    @PreAuthorize("hasRole('VOTER')")
    public ResponseEntity<ApiResponse<Vote>> castVote(
            @Valid @RequestBody CastVoteRequest request,
            Authentication authentication) {
        String voterId = authentication.getName();
        Vote vote = voteService.castVote(voterId, request);
        return ResponseEntity.ok(ApiResponse.ok("Vote cast successfully", vote));
    }

    @GetMapping("/has-voted/{electionId}")
    @PreAuthorize("hasRole('VOTER')")
    public ResponseEntity<ApiResponse<Boolean>> hasVoted(
            @PathVariable String electionId,
            Authentication authentication) {
        String voterId = authentication.getName();
        boolean voted = voteService.hasVoted(voterId, electionId);
        return ResponseEntity.ok(ApiResponse.ok("Check voting status", voted));
    }

    @GetMapping("/results/{electionId}")
    public ResponseEntity<ApiResponse<ElectionResultResponse>> getResults(
            @PathVariable String electionId,
            Authentication authentication) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));

        ElectionResultResponse results = voteService.getElectionResults(electionId, isAdmin);
        return ResponseEntity.ok(ApiResponse.ok("Election results retrieved", results));
    }
}
