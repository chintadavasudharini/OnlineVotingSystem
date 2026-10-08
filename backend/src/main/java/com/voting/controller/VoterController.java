package com.voting.controller;

import com.voting.dto.ApiResponse;
import com.voting.entity.Role;
import com.voting.entity.User;
import com.voting.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/voters")
public class VoterController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getAllVoters() {
        List<User> list = userRepository.findByRole(Role.VOTER);
        return ResponseEntity.ok(ApiResponse.ok("Voters retrieved", list));
    }

    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('VOTER', 'CANDIDATE', 'ADMIN')")
    public ResponseEntity<ApiResponse<User>> getProfile(Authentication authentication) {
        String userId = authentication.getName();
        User user = userRepository.findByIdIgnoreCase(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(ApiResponse.ok("User profile", user));
    }
}
