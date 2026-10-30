package com.voting.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(Map.of(
                "application", "SecureVote — Online Voting System API",
                "status", "UP",
                "version", "1.0.0",
                "endpoints", Map.of(
                        "elections", "/api/elections",
                        "paymentConfig", "/api/payment/config",
                        "authLogin", "/api/auth/login"
                )
        ));
    }
}
