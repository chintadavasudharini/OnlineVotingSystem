package com.voting.dto;

import jakarta.validation.constraints.NotBlank;

public class CastVoteRequest {

    @NotBlank(message = "Election ID is required")
    private String electionId;

    @NotBlank(message = "Candidate ID is required")
    private String candidateId;

    public CastVoteRequest() {}

    public CastVoteRequest(String electionId, String candidateId) {
        this.electionId = electionId;
        this.candidateId = candidateId;
    }

    public String getElectionId() {
        return electionId;
    }

    public void setElectionId(String electionId) {
        this.electionId = electionId;
    }

    public String getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(String candidateId) {
        this.candidateId = candidateId;
    }
}
