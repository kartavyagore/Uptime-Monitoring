package com.uptimemonitor.api.controller;

import com.uptimemonitor.api.dto.UserResponse;
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

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Google OAuth 2.0 authentication endpoints")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
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
