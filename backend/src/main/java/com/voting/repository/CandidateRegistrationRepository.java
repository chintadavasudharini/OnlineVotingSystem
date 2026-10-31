package com.voting.repository;

import com.voting.entity.CandidateRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateRegistrationRepository extends JpaRepository<CandidateRegistration, String> {

    List<CandidateRegistration> findByElectionId(String electionId);

    long countByElectionId(String electionId);

    void deleteByElectionId(String electionId);

    List<CandidateRegistration> findByCandidateId(String candidateId);

    Optional<CandidateRegistration> findByCandidateIdAndElectionId(String candidateId, String electionId);

    boolean existsByCandidateIdAndElectionId(String candidateId, String electionId);
}
