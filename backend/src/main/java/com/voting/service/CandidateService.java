package com.voting.service;

import com.voting.dto.CandidateDetailDto;
import com.voting.dto.CandidateElectionRegisterRequest;
import com.voting.entity.CandidateRegistration;
import com.voting.entity.Election;
import com.voting.entity.Role;
import com.voting.entity.User;
import com.voting.repository.CandidateRegistrationRepository;
import com.voting.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CandidateService {

    @Autowired
    private CandidateRegistrationRepository registrationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ElectionService electionService;

    @Autowired
    private AuditService auditService;

    @Transactional
    public CandidateRegistration registerForElection(String candidateId, CandidateElectionRegisterRequest request) {
        User candidate = userRepository.findByIdIgnoreCase(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found with ID: " + candidateId));

        if (candidate.getRole() != Role.CANDIDATE) {
            throw new IllegalArgumentException("User is not a candidate.");
        }

        Election election = electionService.getElectionEntity(request.getElectionId());
        String status = electionService.calculateElectionStatus(election);

        if (!"REGISTRATION_OPEN".equals(status)) {
            throw new IllegalArgumentException("Candidate registration is currently closed for this election.");
        }

        if (registrationRepository.existsByCandidateIdAndElectionId(candidateId, election.getId())) {
            throw new IllegalArgumentException("You are already registered for this election.");
        }

        String regId = "CR-" + System.currentTimeMillis() + "-" + ((int) (Math.random() * 900) + 100);
        String promisesJoined = request.getKeyPromises() != null ? String.join("\n", request.getKeyPromises()) : "";

        CandidateRegistration reg = new CandidateRegistration(
                regId,
                candidateId,
                election.getId(),
                request.getManifestoTitle(),
                request.getVisionStatement(),
                promisesJoined
        );

        CandidateRegistration saved = registrationRepository.save(reg);

        auditService.log(
                candidateId,
                "CANDIDATE",
                "Election Registration",
                candidateId + " (" + candidate.getName() + ") registered for election " + election.getId() +
                        (reg.getManifestoTitle() != null ? " with manifesto: " + reg.getManifestoTitle() : "")
        );

        return saved;
    }

    @Transactional(readOnly = true)
    public List<CandidateDetailDto> getCandidatesForElection(String electionId) {
        List<CandidateRegistration> registrations = registrationRepository.findByElectionId(electionId);
        List<CandidateDetailDto> result = new ArrayList<>();

        for (CandidateRegistration reg : registrations) {
            Optional<User> candOpt = userRepository.findByIdIgnoreCase(reg.getCandidateId());
            if (candOpt.isPresent()) {
                User cand = candOpt.get();
                CandidateDetailDto dto = new CandidateDetailDto();
                dto.setCandidateId(cand.getId());
                dto.setName(cand.getName());
                dto.setEmail(cand.getEmail());
                dto.setAge(cand.getAge());
                dto.setVoterId(cand.getVoterId());
                dto.setManifestoTitle(reg.getManifestoTitle());
                dto.setVisionStatement(reg.getVisionStatement());
                if (reg.getKeyPromises() != null && !reg.getKeyPromises().isBlank()) {
                    dto.setKeyPromises(Arrays.asList(reg.getKeyPromises().split("\n")));
                } else {
                    dto.setKeyPromises(List.of());
                }
                dto.setRegisteredAt(reg.getRegisteredAt());
                result.add(dto);
            }
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<User> getAllCandidates() {
        return userRepository.findByRole(Role.CANDIDATE);
    }

    @Transactional(readOnly = true)
    public boolean isRegisteredForElection(String candidateId, String electionId) {
        return registrationRepository.existsByCandidateIdAndElectionId(candidateId, electionId);
    }
}
