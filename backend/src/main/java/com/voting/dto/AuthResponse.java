package com.voting.dto;

import com.voting.entity.Role;
import java.time.LocalDate;

public class AuthResponse {

    private String token;
    private String id;
    private String name;
    private String email;
    private Role role;
    private int age;
    private LocalDate dob;
    private String voterId;
    private String status;
    private String gender;

    public AuthResponse() {}

    public AuthResponse(String token, String id, String name, String email, Role role, int age, LocalDate dob, String voterId, String status) {
        this(token, id, name, email, role, age, dob, null, voterId, status);
    }

    public AuthResponse(String token, String id, String name, String email, Role role, int age, LocalDate dob, String gender, String voterId, String status) {
        this.token = token;
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.age = age;
        this.dob = dob;
        this.gender = gender;
        this.voterId = voterId;
        this.status = status;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public LocalDate getDob() {
        return dob;
    }

    public void setDob(LocalDate dob) {
        this.dob = dob;
    }

    public String getVoterId() {
        return voterId;
    }

    public void setVoterId(String voterId) {
        this.voterId = voterId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }
}
