package com.uptimemonitor.api.service;

import com.uptimemonitor.common.entity.User;
import com.uptimemonitor.common.enums.UserStatus;
import com.uptimemonitor.common.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final EmailService emailService;

    public UserService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    /**
     * Find an existing user by Google subject, or create a new one.
     * Updates profile info (name, email, picture) on every login to keep data fresh.
     */
    @Transactional
    public User findOrCreateUser(String googleSubject, String email, String name, String pictureUrl) {
        Optional<User> existing = userRepository.findByGoogleSubject(googleSubject);

        if (existing.isPresent()) {
            User user = existing.get();
            // Update profile in case Google info changed
            user.setEmail(email);
            user.setName(name);
            user.setPictureUrl(pictureUrl);
            log.info("Updated existing user: id={}, email={}", user.getId(), email);
            User saved = userRepository.save(user);

            // Send sign-in notification email asynchronously
            emailService.sendLoginNotificationEmail(saved);
            return saved;
        }

        User newUser = User.builder()
                .googleSubject(googleSubject)
                .email(email)
                .name(name)
                .pictureUrl(pictureUrl)
                .status(UserStatus.ACTIVE)
                .build();

        User saved = userRepository.save(newUser);
        log.info("Created new user: id={}, email={}", saved.getId(), email);

        // Send welcome email asynchronously upon client signup
        emailService.sendWelcomeEmail(saved);
        return saved;
    }

    /**
     * Retrieve user by Google subject. Used to resolve the current user from the security context.
     */
    @Transactional(readOnly = true)
    public Optional<User> findByGoogleSubject(String googleSubject) {
        return userRepository.findByGoogleSubject(googleSubject);
    }

    @Transactional(readOnly = true)
    public Optional<User> findById(UUID userId) {
        return userRepository.findById(userId);
    }
}
