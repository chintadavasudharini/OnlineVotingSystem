package com.voting.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UpdateEmailRequest {

    @NotBlank(message = "New email is required")
    @Email(message = "Valid email is required")
    private String newEmail;

    public UpdateEmailRequest() {}

    public UpdateEmailRequest(String newEmail) {
        this.newEmail = newEmail;
    }

    public String getNewEmail() { return newEmail; }
    public void setNewEmail(String newEmail) { this.newEmail = newEmail; }
}
