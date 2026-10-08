package com.voting.repository;

import com.voting.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, String> {

    List<Vote> findByElectionId(String electionId);

    boolean existsByElectionIdAndVoterId(String electionId, String voterId);

    long countByElectionIdAndCandidateId(String electionId, String candidateId);

    long countByElectionId(String electionId);

    Optional<Vote> findByElectionIdAndVoterId(String electionId, String voterId);
}
