package com.voting.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class CandidateElectionRegisterRequest {

    @NotBlank(message = "Election ID is required")
    private String electionId;

    private String manifestoTitle;

    private String visionStatement;

    private List<String> keyPromises;

    public CandidateElectionRegisterRequest() {}

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

    public List<String> getKeyPromises() {
        return keyPromises;
    }

    public void setKeyPromises(List<String> keyPromises) {
        this.keyPromises = keyPromises;
    }
}
