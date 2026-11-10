package com.voting.dto;

import jakarta.validation.constraints.NotBlank;

public class OtpVerifyRequest {

    private String email;
    private String voterId;

    @NotBlank(message = "OTP is required")
    private String otp;

    private String purpose;

    public OtpVerifyRequest() {}

    public OtpVerifyRequest(String email, String voterId, String otp, String purpose) {
        this.email = email;
        this.voterId = voterId;
        this.otp = otp;
        this.purpose = purpose;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getVoterId() { return voterId; }
    public void setVoterId(String voterId) { this.voterId = voterId; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
}
