package com.voting.dto;

import java.util.List;

public class ElectionResultResponse {

    private String electionId;
    private String electionTitle;
    private boolean resultsPublished;
    private long totalVotes;
    private long totalVoters;
    private List<CandidateResultDto> results;

    public ElectionResultResponse() {}

    public ElectionResultResponse(String electionId, String electionTitle, boolean resultsPublished, long totalVotes, long totalVoters, List<CandidateResultDto> results) {
        this.electionId = electionId;
        this.electionTitle = electionTitle;
        this.resultsPublished = resultsPublished;
        this.totalVotes = totalVotes;
        this.totalVoters = totalVoters;
        this.results = results;
    }

    public String getElectionId() {
        return electionId;
    }

    public void setElectionId(String electionId) {
        this.electionId = electionId;
    }

    public String getElectionTitle() {
        return electionTitle;
    }

    public void setElectionTitle(String electionTitle) {
        this.electionTitle = electionTitle;
    }

    public boolean isResultsPublished() {
        return resultsPublished;
    }

    public void setResultsPublished(boolean resultsPublished) {
        this.resultsPublished = resultsPublished;
    }

    public long getTotalVotes() {
        return totalVotes;
    }

    public void setTotalVotes(long totalVotes) {
        this.totalVotes = totalVotes;
    }

    public long getTotalVoters() {
        return totalVoters;
    }

    public void setTotalVoters(long totalVoters) {
        this.totalVoters = totalVoters;
    }

    public List<CandidateResultDto> getResults() {
        return results;
    }

    public void setResults(List<CandidateResultDto> results) {
        this.results = results;
    }

    public List<CandidateResultDto> getCandidateResults() {
        return results;
    }

    public void setCandidateResults(List<CandidateResultDto> candidateResults) {
        this.results = candidateResults;
    }
}
