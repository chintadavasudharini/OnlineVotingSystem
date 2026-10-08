package com.voting.config;

import com.voting.entity.Election;
import com.voting.entity.Role;
import com.voting.entity.User;
import com.voting.repository.ElectionRepository;
import com.voting.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ElectionRepository electionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Ensure Admin user exists
        if (userRepository.findByIdIgnoreCase("admin").isEmpty()) {
            User admin = new User(
                    "admin",
                    "System Administrator",
                    "admin@system.local",
                    LocalDate.of(1980, 1, 1),
                    45,
                    passwordEncoder.encode("admin"),
                    Role.ADMIN,
                    "ACTIVE",
                    null
            );
            userRepository.save(admin);
            System.out.println(">>> Super Admin account initialized: [admin / admin]");
        }

        // Initialize sample election if empty
        if (electionRepository.count() == 0) {
            LocalDateTime now = LocalDateTime.now();
            Election sampleElection = new Election(
                    "E1",
                    "Presidential General Election 2026",
                    "Official nationwide democratic election for executive leadership and municipal representatives.",
                    now.minusDays(2),
                    now.plusDays(3),
                    now.plusDays(4),
                    now.plusDays(10)
            );
            electionRepository.save(sampleElection);
            System.out.println(">>> Sample election initialized: [E1 - Presidential General Election 2026]");
        }
    }
}
