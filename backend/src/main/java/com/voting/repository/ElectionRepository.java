package com.voting.repository;

import com.voting.entity.Election;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ElectionRepository extends JpaRepository<Election, String> {

    List<Election> findAllByOrderByCreatedAtDesc();
}
