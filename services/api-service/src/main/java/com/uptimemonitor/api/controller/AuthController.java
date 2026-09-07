package com.uptimemonitor.api.controller;

import com.uptimemonitor.api.dto.UserResponse;
import com.uptimemonitor.api.service.EmailService;
import com.uptimemonitor.api.service.UserService;
import com.uptimemonitor.common.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Google OAuth 2.0 authentication endpoints")
public class AuthController {

    private final UserService userService;
    private final EmailService emailService;

    public AuthController(UserService userService, EmailService emailService) {
        this.userService = userService;
        this.emailService = emailService;
    }

    /**
     * Returns the currently authenticated user's profile.
     * The user is identified from the server-side session, never from frontend input.
     */
    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Returns the authenticated user's profile from the session")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal OidcUser oidcUser) {
        if (oidcUser == null) {
            return ResponseEntity.status(401).build();
        }

        String googleSubject = oidcUser.getSubject();
        User user = userService.findByGoogleSubject(googleSubject)
                .orElseThrow(() -> new RuntimeException("User not found for subject: " + googleSubject));

        return ResponseEntity.ok(UserResponse.from(user));
    }

    /**
     * Sends a test verification email via Gmail SMTP to the authenticated user.
     */
    @PostMapping("/test-email")
    @Operation(summary = "Send test verification email", description = "Dispatches a test verification email to confirm Gmail SMTP connectivity")
    public ResponseEntity<Map<String, String>> sendTestEmail(@AuthenticationPrincipal OidcUser oidcUser) {
        if (oidcUser == null) {
            return ResponseEntity.status(401).build();
        }

        String googleSubject = oidcUser.getSubject();
        User user = userService.findByGoogleSubject(googleSubject)
                .orElseThrow(() -> new RuntimeException("User not found for subject: " + googleSubject));

        try {
            emailService.sendTestEmail(user);
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Test email successfully sent to " + user.getEmail()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "status", "error",
                    "message", "Failed to dispatch test email: " + e.getMessage()
            ));
        }
    }

    /**
     * Login endpoint — redirects to Google OAuth.
     * Spring Security handles the actual redirect via /oauth2/authorization/google.
     */
    @GetMapping("/login")
    @Operation(summary = "Initiate Google login", description = "Redirects to Google OAuth 2.0 authorization")
    public ResponseEntity<Void> login() {
        // Spring Security's OAuth2 login filter handles the redirect.
        // This endpoint exists for documentation and explicit login URL.
        return ResponseEntity.status(302)
                .header("Location", "/oauth2/authorization/google")
                .build();
    }
}
