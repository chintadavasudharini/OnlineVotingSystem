package com.voting.dto;

import jakarta.validation.constraints.NotBlank;

public class RazorpayOrderRequest {

    @NotBlank(message = "Election ID is required")
    private String electionId;

    private Long amount; // Amount in paise (optional)

    public RazorpayOrderRequest() {}

    public RazorpayOrderRequest(String electionId, Long amount) {
        this.electionId = electionId;
        this.amount = amount;
    }

    public String getElectionId() {
        return electionId;
    }

    public void setElectionId(String electionId) {
        this.electionId = electionId;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
        this.amount = amount;
    }
}
