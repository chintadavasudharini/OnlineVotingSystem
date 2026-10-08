package com.voting.dto;

public class CandidateResultDto {

    private String candidateId;
    private String candidateName;
    private long votes;
    private double percentage;

    public CandidateResultDto() {}

    public CandidateResultDto(String candidateId, String candidateName, long votes, double percentage) {
        this.candidateId = candidateId;
        this.candidateName = candidateName;
        this.votes = votes;
        this.percentage = percentage;
    }

    public String getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(String candidateId) {
        this.candidateId = candidateId;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public long getVotes() {
        return votes;
    }

    public void setVotes(long votes) {
        this.votes = votes;
    }

    public double getPercentage() {
        return percentage;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }
}
