package com.uptimemonitor.common.repository;

import com.uptimemonitor.common.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByGoogleSubject(String googleSubject);

    Optional<User> findByEmail(String email);

    boolean existsByGoogleSubject(String googleSubject);
}
