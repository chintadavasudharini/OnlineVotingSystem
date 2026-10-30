package com.voting.controller;

import com.voting.dto.ApiResponse;
import com.voting.dto.RazorpayOrderRequest;
import com.voting.dto.RazorpayOrderResponse;
import com.voting.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/create-order")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<RazorpayOrderResponse>> createOrder(
            @Valid @RequestBody RazorpayOrderRequest request,
            Authentication authentication) {
        String candidateId = authentication.getName();
        RazorpayOrderResponse order = paymentService.createOrder(
                candidateId,
                request.getElectionId(),
                request.getAmount()
        );
        return ResponseEntity.ok(ApiResponse.ok("Razorpay order created successfully", order));
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<Boolean>> verifyPayment(@RequestBody Map<String, String> payload) {
        String orderId = payload.get("orderId");
        String paymentId = payload.get("paymentId");
        String signature = payload.get("signature");

        boolean valid = paymentService.verifySignature(orderId, paymentId, signature);
        if (valid) {
            return ResponseEntity.ok(ApiResponse.ok("Payment verified successfully", true));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Payment verification failed"));
        }
    }

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentConfig() {
        return ResponseEntity.ok(ApiResponse.ok("Payment configuration", Map.of(
                "keyId", paymentService.getKeyId(),
                "nominationFee", 500.0,
                "currency", "INR"
        )));
    }
}
