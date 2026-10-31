package com.voting.service;

import com.voting.dto.ElectionRequest;
import com.voting.dto.ElectionResponse;
import com.voting.entity.Election;
import com.voting.entity.Role;
import com.voting.repository.CandidateRegistrationRepository;
import com.voting.repository.ElectionRepository;
import com.voting.repository.UserRepository;
import com.voting.repository.VoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ElectionService {

    @Autowired
    private ElectionRepository electionRepository;

    @Autowired
    private CandidateRegistrationRepository candidateRegistrationRepository;

    @Autowired
    private VoteRepository voteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditService auditService;

    public String calculateElectionStatus(Election election) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime regStart = election.getRegistrationStart();
        LocalDateTime regEnd = election.getRegistrationEnd();
        LocalDateTime voteStart = election.getVotingStart();
        LocalDateTime voteEnd = election.getVotingEnd();

        if (now.isBefore(regStart)) {
            return "UPCOMING";
        } else if (!now.isBefore(regStart) && !now.isAfter(regEnd)) {
            return "REGISTRATION_OPEN";
        } else if (!now.isBefore(voteStart) && !now.isAfter(voteEnd)) {
            return "VOTING_OPEN";
        } else if (now.isAfter(voteEnd)) {
            return "COMPLETED";
        } else {
            return "UPCOMING";
        }
    }

    public synchronized String getNextElectionId() {
        List<Election> elections = electionRepository.findAll();
        int maxId = 0;
        for (Election e : elections) {
            if (e.getId().startsWith("E")) {
                try {
                    int num = Integer.parseInt(e.getId().substring(1));
                    if (num > maxId) {
                        maxId = num;
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
        return "E" + (maxId + 1);
    }

    @Transactional(readOnly = true)
    public List<ElectionResponse> getAllElections() {
        return electionRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ElectionResponse getElectionById(String id) {
        Election election = electionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Election not found with ID: " + id));
        return mapToResponse(election);
    }

    @Transactional(readOnly = true)
    public Election getElectionEntity(String id) {
        return electionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Election not found with ID: " + id));
    }

    @Transactional
    public ElectionResponse createElection(ElectionRequest request, String adminId) {
        if (!request.getRegistrationEnd().isAfter(request.getRegistrationStart())) {
            throw new IllegalArgumentException("Registration end time must be after registration start time.");
        }
        if (!request.getVotingStart().isAfter(request.getRegistrationEnd())) {
            throw new IllegalArgumentException("Voting start time must be after registration end time.");
        }
        if (!request.getVotingEnd().isAfter(request.getVotingStart())) {
            throw new IllegalArgumentException("Voting end time must be after voting start time.");
        }

        String id = getNextElectionId();
        Election election = new Election(
                id,
                request.getTitle().trim(),
                request.getDescription() != null ? request.getDescription().trim() : "",
                request.getRegistrationStart(),
                request.getRegistrationEnd(),
                request.getVotingStart(),
                request.getVotingEnd()
        );

        Election saved = electionRepository.save(election);

        auditService.log(
                adminId,
                "ADMIN",
                "Create Election",
                "Created election " + id + " (" + saved.getTitle() + ")"
        );

        return mapToResponse(saved);
    }

    @Transactional
    public ElectionResponse updateElection(String id, ElectionRequest request, String adminId) {
        Election election = getElectionEntity(id);

        String status = calculateElectionStatus(election);
        if ("VOTING_OPEN".equals(status) || "COMPLETED".equals(status)) {
            throw new IllegalArgumentException("This election cannot be edited or deleted because it is " +
                    ("VOTING_OPEN".equals(status) ? "currently voting open." : "already completed."));
        }

        long voteCount = voteRepository.countByElectionId(id);
        if (voteCount > 0) {
            throw new IllegalArgumentException("This election cannot be edited or deleted because votes have already been cast.");
        }

        if (!request.getRegistrationEnd().isAfter(request.getRegistrationStart())) {
            throw new IllegalArgumentException("Registration end time must be after registration start time.");
        }
        if (!request.getVotingStart().isAfter(request.getRegistrationEnd())) {
            throw new IllegalArgumentException("Voting start time must be after registration end time.");
        }
        if (!request.getVotingEnd().isAfter(request.getVotingStart())) {
            throw new IllegalArgumentException("Voting end time must be after voting start time.");
        }

        election.setTitle(request.getTitle().trim());
        election.setDescription(request.getDescription() != null ? request.getDescription().trim() : "");
        election.setRegistrationStart(request.getRegistrationStart());
        election.setRegistrationEnd(request.getRegistrationEnd());
        election.setVotingStart(request.getVotingStart());
        election.setVotingEnd(request.getVotingEnd());

        Election updated = electionRepository.save(election);

        auditService.log(
                adminId,
                "ADMIN",
                "Update Election",
                "Updated election " + id + " (" + updated.getTitle() + ")"
        );

        return mapToResponse(updated);
    }

    @Transactional
    public void deleteElection(String id, String adminId) {
        Election election = getElectionEntity(id);

        String status = calculateElectionStatus(election);
        if ("VOTING_OPEN".equals(status) || "COMPLETED".equals(status)) {
            throw new IllegalArgumentException("This election cannot be edited or deleted because it is " +
                    ("VOTING_OPEN".equals(status) ? "currently voting open." : "already completed."));
        }

        long voteCount = voteRepository.countByElectionId(id);
        if (voteCount > 0) {
            throw new IllegalArgumentException("This election cannot be edited or deleted because votes have already been cast.");
        }

        // Clean up candidate registrations belonging to this election
        candidateRegistrationRepository.deleteByElectionId(id);

        electionRepository.delete(election);

        auditService.log(
                adminId,
                "ADMIN",
                "Delete Election",
                "Deleted election " + id + " (" + election.getTitle() + ")"
        );
    }

    @Transactional
    public ElectionResponse publishResults(String electionId, String adminId) {
        Election election = getElectionEntity(electionId);
        election.setResultsPublished(true);
        Election updated = electionRepository.save(election);

        auditService.log(
                adminId,
                "ADMIN",
                "Publish Results",
                "Certified and published results for election " + electionId + " (" + election.getTitle() + ")"
        );

        return mapToResponse(updated);
    }

    public ElectionResponse mapToResponse(Election election) {
        ElectionResponse response = new ElectionResponse();
        response.setId(election.getId());
        response.setTitle(election.getTitle());
        response.setDescription(election.getDescription());
        response.setRegistrationStart(election.getRegistrationStart());
        response.setRegistrationEnd(election.getRegistrationEnd());
        response.setVotingStart(election.getVotingStart());
        response.setVotingEnd(election.getVotingEnd());
        response.setResultsPublished(election.isResultsPublished());
        response.setCreatedAt(election.getCreatedAt());
        response.setStatus(calculateElectionStatus(election));
        response.setCandidateCount(candidateRegistrationRepository.countByElectionId(election.getId()));
        response.setTotalVotes(voteRepository.countByElectionId(election.getId()));
        response.setTotalVoters(userRepository.countByRole(Role.VOTER));
        return response;
    }
}
