package com.voting.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidate_registrations",
       uniqueConstraints = @UniqueConstraint(columnNames = {"candidate_id", "election_id"}))
public class CandidateRegistration {

    @Id
    @Column(nullable = false, length = 60)
    private String id; // e.g. "CR-123456789"

    @Column(name = "candidate_id", nullable = false, length = 50)
    private String candidateId;

    @Column(name = "election_id", nullable = false, length = 50)
    private String electionId;

    @Column(name = "manifesto_title", length = 255)
    private String manifestoTitle;

    @Column(name = "vision_statement", columnDefinition = "TEXT")
    private String visionStatement;

    @Column(name = "key_promises", columnDefinition = "TEXT")
    private String keyPromises; // Stored as newline or semicolon-delimited string or JSON

    @Column(name = "registered_at", nullable = false)
    private LocalDateTime registeredAt = LocalDateTime.now();

    public CandidateRegistration() {}

    public CandidateRegistration(String id, String candidateId, String electionId,
                                 String manifestoTitle, String visionStatement, String keyPromises) {
        this.id = id;
        this.candidateId = candidateId;
        this.electionId = electionId;
        this.manifestoTitle = manifestoTitle;
        this.visionStatement = visionStatement;
        this.keyPromises = keyPromises;
        this.registeredAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(String candidateId) {
        this.candidateId = candidateId;
    }

    public String getElectionId() {
        return electionId;
    }

    public void setElectionId(String electionId) {
        this.electionId = electionId;
    }

    public String getManifestoTitle() {
        return manifestoTitle;
    }

    public void setManifestoTitle(String manifestoTitle) {
        this.manifestoTitle = manifestoTitle;
    }

    public String getVisionStatement() {
        return visionStatement;
    }

    public void setVisionStatement(String visionStatement) {
        this.visionStatement = visionStatement;
    }

    public String getKeyPromises() {
        return keyPromises;
    }

    public void setKeyPromises(String keyPromises) {
        this.keyPromises = keyPromises;
    }

    public LocalDateTime getRegisteredAt() {
        return registeredAt;
    }

    public void setRegisteredAt(LocalDateTime registeredAt) {
        this.registeredAt = registeredAt;
    }
}
