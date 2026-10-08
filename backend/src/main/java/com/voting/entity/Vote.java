package com.voting.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "votes",
       uniqueConstraints = @UniqueConstraint(columnNames = {"election_id", "voter_id"}))
public class Vote {

    @Id
    @Column(nullable = false, length = 60)
    private String id; // e.g. "VOTE-123456789"

    @Column(name = "election_id", nullable = false, length = 50)
    private String electionId;

    @Column(name = "voter_id", nullable = false, length = 50)
    private String voterId;

    @Column(name = "candidate_id", nullable = false, length = 50)
    private String candidateId;

    @Column(name = "voted_at", nullable = false)
    private LocalDateTime votedAt = LocalDateTime.now();

    public Vote() {}

    public Vote(String id, String electionId, String voterId, String candidateId) {
        this.id = id;
        this.electionId = electionId;
        this.voterId = voterId;
        this.candidateId = candidateId;
        this.votedAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getElectionId() {
        return electionId;
    }

    public void setElectionId(String electionId) {
        this.electionId = electionId;
    }

    public String getVoterId() {
        return voterId;
    }

    public void setVoterId(String voterId) {
        this.voterId = voterId;
    }

    public String getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(String candidateId) {
        this.candidateId = candidateId;
    }

    public LocalDateTime getVotedAt() {
        return votedAt;
    }

    public void setVotedAt(LocalDateTime votedAt) {
        this.votedAt = votedAt;
    }
}
