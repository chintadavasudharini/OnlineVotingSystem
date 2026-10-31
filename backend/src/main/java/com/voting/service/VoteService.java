package com.voting.service;

import com.voting.dto.CandidateResultDto;
import com.voting.dto.CastVoteRequest;
import com.voting.dto.ElectionResultResponse;
import com.voting.entity.Election;
import com.voting.entity.Role;
import com.voting.entity.User;
import com.voting.entity.Vote;
import com.voting.repository.CandidateRegistrationRepository;
import com.voting.repository.UserRepository;
import com.voting.repository.VoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class VoteService {

    @Autowired
    private VoteRepository voteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ElectionService electionService;

    @Autowired
    private CandidateRegistrationRepository candidateRegistrationRepository;

    @Autowired
    private AuditService auditService;

    @Transactional
    public Vote castVote(String voterId, CastVoteRequest request) {
        User voter = userRepository.findByIdIgnoreCase(voterId)
                .orElseThrow(() -> new IllegalArgumentException("Voter not found with ID: " + voterId));

        if (voter.getRole() != Role.VOTER) {
            throw new IllegalArgumentException("Only voters can cast votes.");
        }

        Election election = electionService.getElectionEntity(request.getElectionId());
        String status = electionService.calculateElectionStatus(election);

        if (!"VOTING_OPEN".equals(status)) {
            throw new IllegalArgumentException("Voting is not currently open for this election. Status: " + status);
        }

        // Single vote enforcement
        if (voteRepository.existsByElectionIdAndVoterId(election.getId(), voterId)) {
            throw new IllegalArgumentException("You have already voted in this election. A voter can cast only one vote.");
        }

        // Verify candidate is participating in this election
        boolean candidateInElection = candidateRegistrationRepository
                .existsByCandidateIdAndElectionId(request.getCandidateId(), election.getId());
        if (!candidateInElection) {
            throw new IllegalArgumentException("Candidate is not registered for this election.");
        }

        String voteId = "VOTE-" + System.currentTimeMillis() + "-" + ((int) (Math.random() * 900) + 100);
        Vote vote = new Vote(voteId, election.getId(), voterId, request.getCandidateId());
        Vote saved = voteRepository.save(vote);

        auditService.log(
                voterId,
                "VOTER",
                "Cast Vote",
                voterId + " cast vote in election " + election.getId() + " (" + election.getTitle() + ")"
        );

        return saved;
    }

    @Transactional(readOnly = true)
    public boolean hasVoted(String voterId, String electionId) {
        return voteRepository.existsByElectionIdAndVoterId(electionId, voterId);
    }

    @Transactional(readOnly = true)
    public ElectionResultResponse getElectionResults(String electionId, boolean isAdmin) {
        Election election = electionService.getElectionEntity(electionId);

        if (!isAdmin && !election.isResultsPublished()) {
            throw new IllegalArgumentException("Results for this election have not been published by the administrator yet.");
        }

        List<Vote> votes = voteRepository.findByElectionId(electionId);
        long totalVotes = votes.size();

        // Get all registered candidates for this election
        var registrations = candidateRegistrationRepository.findByElectionId(electionId);
        List<CandidateResultDto> candidateResults = new ArrayList<>();

        for (var reg : registrations) {
            String candidateId = reg.getCandidateId();
            String candidateName = userRepository.findByIdIgnoreCase(candidateId)
                    .map(User::getName)
                    .orElse(candidateId);

            long count = votes.stream().filter(v -> v.getCandidateId().equalsIgnoreCase(candidateId)).count();
            double percentage = totalVotes > 0 ? Math.round(((double) count / totalVotes * 1000.0)) / 10.0 : 0.0;

            candidateResults.add(new CandidateResultDto(candidateId, candidateName, count, percentage));
        }

        // Sort descending by vote count
        candidateResults.sort(Comparator.comparingLong(CandidateResultDto::getVotes).reversed());

        long totalVoters = userRepository.countByRole(com.voting.entity.Role.VOTER);

        return new ElectionResultResponse(
                election.getId(),
                election.getTitle(),
                election.isResultsPublished(),
                totalVotes,
                totalVoters,
                candidateResults
        );
    }
}
